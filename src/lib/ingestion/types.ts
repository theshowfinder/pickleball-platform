export type ConnectorType = "api" | "feed" | "open_data" | "structured_page" | "organiser_feed" | "manual_review";

export type AvailabilityStatus = "live" | "limited" | "waitlist" | "sold_out" | "unknown";

export type BookingMode = "external" | "contact" | "spond" | "whatsapp" | "email" | "embedded";

export type RawSourceRecord = {
  externalId: string;
  externalUrl?: string;
  rawPayload: Record<string, unknown>;
};

export type NormalizedSession = {
  externalId: string;
  externalUrl?: string;
  title: string;
  venueName: string;
  area?: string;
  startsAt: string;
  endsAt?: string;
  skillLevel: string;
  sessionType: string;
  pricePence?: number;
  capacityTotal?: number;
  spacesRemaining?: number;
  availabilityStatus: AvailabilityStatus;
  availabilityText?: string;
  bookingMode: BookingMode;
  bookingUrl?: string;
  contactMethod?: string;
  rawPayload: Record<string, unknown>;
};

export type SourceConnector = {
  provider: string;
  name: string;
  sourceUrl: string;
  connectorType: ConnectorType;
  fetch: () => Promise<RawSourceRecord[]>;
  normalize: (record: RawSourceRecord) => NormalizedSession | null;
};
