import type { NormalizedSession } from "./types";

export function sessionDedupeKey(session: Pick<NormalizedSession, "venueName" | "title" | "startsAt">) {
  return [session.venueName, session.title, session.startsAt].map((value) => value.trim().toLowerCase()).join("|");
}

export function availabilityLabel(session: Pick<NormalizedSession, "availabilityStatus" | "spacesRemaining">) {
  if (session.spacesRemaining != null) return `${session.spacesRemaining} spaces left`;
  if (session.availabilityStatus === "live") return "Booking open";
  if (session.availabilityStatus === "limited") return "Limited spaces";
  if (session.availabilityStatus === "waitlist") return "Waitlist available";
  if (session.availabilityStatus === "sold_out") return "Sold out";
  return "Check organiser availability";
}
