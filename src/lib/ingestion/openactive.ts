import type { AvailabilityStatus, NormalizedSession, RawSourceRecord } from "./types";
import { availabilityLabel } from "./normalize";

export const OPENACTIVE_LONDON_SPORT_URL = "https://opensessions.io/api/rpde/events";

type RpdeItem = { id?: string; data?: Record<string, unknown>; [key: string]: unknown };
type RpdePage = { items?: RpdeItem[]; next?: string };

function text(value: unknown) { return typeof value === "string" ? value : ""; }
function number(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : undefined; }
function firstObject(value: unknown) { return Array.isArray(value) && value[0] && typeof value[0] === "object" ? value[0] as Record<string, unknown> : undefined; }
function statusFor(item: Record<string, unknown>): AvailabilityStatus {
  const remaining = number(item.remainingAttendeeCapacity);
  if (remaining == null) return "unknown";
  if (remaining <= 0) return "sold_out";
  if (remaining <= 4) return "limited";
  return "live";
}

function isPickleball(item: Record<string, unknown>) {
  return JSON.stringify([
    item.name,
    item.activity,
    item.sport,
    item.category,
    item.activityType,
  ]).toLowerCase().includes("pickleball");
}

export async function fetchOpenActiveRecords(startUrl = OPENACTIVE_LONDON_SPORT_URL, limit = 250, maxPages = 20) {
  const records: RawSourceRecord[] = [];
  let nextUrl: string | undefined = startUrl;
  let pages = 0;
  while (nextUrl && records.length < limit) {
    if (pages >= maxPages) break;
    pages += 1;
    const currentUrl: string = nextUrl;
    const response = await fetch(currentUrl, { headers: { accept: "application/json", "user-agent": "Rally Pickleball Hub/0.1 (+https://pickleball-platform-xi.vercel.app/)" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`OpenActive returned ${response.status}`);
    const page = await response.json() as RpdePage;
    for (const item of page.items ?? []) {
      const payload = item.data && typeof item.data === "object" ? item.data : item;
      if (!isPickleball(payload)) continue;
      const externalId = text(item.id) || text(payload["@id"]);
      if (externalId) records.push({ externalId, externalUrl: text(payload.url) || undefined, rawPayload: payload });
      if (records.length >= limit) break;
    }
    const candidateNext = text(page.next);
    nextUrl = candidateNext && candidateNext !== currentUrl ? candidateNext : OPENACTIVE_LONDON_SPORT_URL;
    if (!candidateNext || candidateNext === currentUrl) break;
  }
  return { records, nextUrl: nextUrl ?? OPENACTIVE_LONDON_SPORT_URL };
}

export function normalizeOpenActiveRecord(record: RawSourceRecord): NormalizedSession | null {
  const item = record.rawPayload;
  const location = item.location && typeof item.location === "object" ? item.location as Record<string, unknown> : {};
  const offers = firstObject(item.offer);
  const start = text(item.startDate) || text(item.startTime);
  if (!start) return null;
  const remaining = number(item.remainingAttendeeCapacity);
  const total = number(item.maximumAttendeeCapacity);
  const price = number(offers?.price) ?? number(item.price);
  const availabilityStatus = statusFor(item);
  return {
    externalId: record.externalId, externalUrl: record.externalUrl,
    title: text(item.name) || "Pickleball session",
    venueName: text(location.name) || text(location.address) || "OpenActive venue",
    area: text(location.address) || undefined, startsAt: start,
    endsAt: text(item.endDate) || text(item.endTime) || undefined,
    skillLevel: JSON.stringify(item).toLowerCase().includes("beginner") ? "Beginner" : "All levels",
    sessionType: JSON.stringify(item).toLowerCase().includes("coaching") ? "Coaching" : "Social",
    pricePence: price == null ? undefined : Math.round(price * 100), capacityTotal: total, spacesRemaining: remaining,
    availabilityStatus, availabilityText: availabilityLabel({ availabilityStatus, spacesRemaining: remaining }),
    bookingMode: "external", bookingUrl: text(item.url) || text(offers?.url) || record.externalUrl, rawPayload: item,
  };
}
