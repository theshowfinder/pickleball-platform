import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sessionDedupeKey } from "@/lib/ingestion/normalize";
import { fetchBookwhenRecords, normalizeBookwhenRecord } from "@/lib/ingestion/bookwhen";

export const runtime = "nodejs";

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}` || request.headers.get("x-ingest-secret") === secret;
}

async function run(request: Request) {
  if (!authorised(request)) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const supabase = createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Server Supabase configuration is missing" }, { status: 500 });

  const { data: connector, error: connectorError } = await supabase.from("source_connectors").select("id").eq("provider", "Bookwhen").eq("source_url", "https://data.bookwhen.com/").maybeSingle();
  if (connectorError || !connector) return Response.json({ error: connectorError?.message ?? "Bookwhen connector is not configured" }, { status: 500 });

  const { data: runRecord, error: runError } = await supabase.from("ingestion_runs").insert({ connector_id: connector.id, status: "running" }).select("id").single();
  if (runError || !runRecord) return Response.json({ error: runError?.message ?? "Could not start ingestion run" }, { status: 500 });

  try {
    const rawRecords = await fetchBookwhenRecords();
    let created = 0;
    let updated = 0;
    for (const rawRecord of rawRecords) {
      let insertedNew = false;
      const session = normalizeBookwhenRecord(rawRecord);
      if (!session) continue;
      const { data: existingSource } = await supabase.from("session_sources").select("id, session_id").eq("connector_id", connector.id).eq("external_id", session.externalId).maybeSingle();
      let venueId: string | undefined;
      const { data: matchingVenue } = await supabase.from("venues").select("id").ilike("name", session.venueName).limit(1).maybeSingle();
      venueId = matchingVenue?.id;
      if (!venueId) {
        const { data: newVenue, error: venueError } = await supabase.from("venues").insert({ name: session.venueName, area: session.area ?? null, booking_url: session.bookingUrl ?? null }).select("id").single();
        if (venueError || !newVenue) continue;
        venueId = newVenue.id;
      }
      const fields = { venue_id: venueId, title: session.title, starts_at: session.startsAt, ends_at: session.endsAt ?? null, skill_level: session.skillLevel, session_type: session.sessionType, price_pence: session.pricePence ?? null, capacity_total: session.capacityTotal ?? null, spaces_remaining: session.spacesRemaining ?? null, availability_status: session.availabilityStatus, availability_text: session.availabilityText, booking_mode: session.bookingMode, source_name: "Bookwhen", source_url: session.bookingUrl ?? null, last_synced_at: new Date().toISOString(), last_verified_at: new Date().toISOString(), status: session.availabilityStatus === "sold_out" ? "sold_out" : "published" };
      let sessionId = existingSource?.session_id;
      if (!sessionId) {
        const dedupe = sessionDedupeKey(session);
        const { data: candidate } = await supabase.from("sessions").select("id, title, starts_at").eq("venue_id", venueId).eq("title", session.title).eq("starts_at", session.startsAt).limit(1).maybeSingle();
        sessionId = candidate?.id;
        if (!sessionId && dedupe) {
          const { data: inserted, error: insertError } = await supabase.from("sessions").insert(fields).select("id").single();
          if (insertError || !inserted) continue;
          sessionId = inserted.id;
          created += 1;
          insertedNew = true;
        }
      }
      if (!sessionId) continue;
      if (!insertedNew) {
        await supabase.from("sessions").update(fields).eq("id", sessionId);
        updated += 1;
      }
      await supabase.from("session_sources").upsert({ session_id: sessionId, connector_id: connector.id, external_id: session.externalId, external_url: session.externalUrl ?? null, raw_payload: session.rawPayload, last_seen_at: new Date().toISOString(), last_synced_at: new Date().toISOString() }, { onConflict: "connector_id,external_id" });
    }
    await supabase.from("ingestion_runs").update({ status: "succeeded", records_seen: rawRecords.length, records_created: created, records_updated: updated, finished_at: new Date().toISOString() }).eq("id", runRecord.id);
    await supabase.from("source_connectors").update({ last_attempted_at: new Date().toISOString(), last_succeeded_at: new Date().toISOString(), last_error: null }).eq("id", connector.id);
    return Response.json({ ok: true, recordsSeen: rawRecords.length, recordsCreated: created, recordsUpdated: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion error";
    await supabase.from("ingestion_runs").update({ status: "failed", error_message: message, finished_at: new Date().toISOString() }).eq("id", runRecord.id);
    await supabase.from("source_connectors").update({ last_attempted_at: new Date().toISOString(), last_error: message }).eq("id", connector.id);
    return Response.json({ error: message }, { status: 502 });
  }
}

export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
