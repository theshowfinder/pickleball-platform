import type { AvailabilityStatus, NormalizedSession, RawSourceRecord } from "./types";
import { availabilityLabel } from "./normalize";

const BOOKWHEN_EVENTS_URL = "https://bookwhen.com/api/openactive/events";

type BookwhenResponse = { items?: Record<string, unknown>[]; next?: string; nextPage?: string };

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function firstObject(value: unknown) {
  return Array.isArray(value) && value[0] && typeof value[0] === "object" ? value[0] as Record<string, unknown> : undefined;
}

function isPickleball(record: Record<string, unknown>) {
  return JSON.stringify(record).toLowerCase().includes("pickleball");
}

function statusFor(spacesRemaining?: number): AvailabilityStatus {
  if (spacesRemaining == null) return "unknown";
  if (spacesRemaining <= 0) return "sold_out";
  if (spacesRemaining <= 4) return "limited";
  return "live";
}

export async function fetchBookwhenRecords(startUrl = BOOKWHEN_EVENTS_URL, limit = 250) {
  const records: RawSourceRecord[] = [];
  let nextUrl: string | undefined = startUrl;
  let lastUrl: string | undefined;

  while (nextUrl && records.length < limit) {
    lastUrl = nextUrl;
    const response = await fetch(nextUrl, {
      headers: {
        accept: "application/json",
        "user-agent": "Rally Pickleball Hub/0.1 (+https://pickleball-platform-xi.vercel.app/)",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        throw new Error(`Bookwhen rate limited (429)${retryAfter ? `; retry-after ${retryAfter}` : ""}`);
      }
      throw new Error(`Bookwhen returned ${response.status}`);
    }
    const payload = await response.json() as BookwhenResponse;
    for (const item of payload.items ?? []) {
      if (!isPickleball(item)) continue;
      const externalId = text(item.identifier);
      if (externalId) records.push({ externalId, externalUrl: text(item.url) || undefined, rawPayload: item });
      if (records.length >= limit) break;
    }
    const candidateNext = text(payload.next) || text(payload.nextPage) || undefined;
    nextUrl = candidateNext && candidateNext !== lastUrl ? candidateNext : undefined;
  }

  return { records, nextUrl: nextUrl ?? BOOKWHEN_EVENTS_URL };
}

export function normalizeBookwhenRecord(record: RawSourceRecord): NormalizedSession | null {
  const item = record.rawPayload;
  const location = item.location && typeof item.location === "object" ? item.location as Record<string, unknown> : {};
  const offers = firstObject(item.offer);
  const start = text(item.startDate) || text(firstObject(item.subEvent)?.startDate);
  if (!start) return null;
  const end = text(item.endDate) || text(firstObject(item.subEvent)?.endDate) || undefined;
  const remaining = number(item.remainingAttendeeCapacity);
  const total = number(item.maximumAttendeeCapacity);
  const price = number(offers?.price);
  const availabilityStatus = statusFor(remaining);
  const normalized: NormalizedSession = {
    externalId: record.externalId,
    externalUrl: record.externalUrl,
    title: text(item.name) || "Pickleball session",
    venueName: text(location.name) || text(location.address) || "Bookwhen venue",
    area: text(location.address) || undefined,
    startsAt: start,
    endsAt: end,
    skillLevel: JSON.stringify(item).toLowerCase().includes("beginner") ? "Beginner" : "All levels",
    sessionType: JSON.stringify(item).toLowerCase().includes("coaching") ? "Coaching" : "Social",
    pricePence: price == null ? undefined : Math.round(price * 100),
    capacityTotal: total,
    spacesRemaining: remaining,
    availabilityStatus,
    availabilityText: availabilityLabel({ availabilityStatus, spacesRemaining: remaining }),
    bookingMode: "external",
    bookingUrl: text(item.url) || text(offers?.url) || record.externalUrl,
    rawPayload: item,
  };
  return normalized;
}
