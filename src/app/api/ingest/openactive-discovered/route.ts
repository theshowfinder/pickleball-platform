import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sessionDedupeKey } from "@/lib/ingestion/normalize";
import { fetchOpenActiveRecords, normalizeOpenActiveRecord } from "@/lib/ingestion/openactive";

export const runtime = "nodejs";

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && (request.headers.get("authorization") === `Bearer ${secret}` || request.headers.get("x-ingest-secret") === secret);
}

export async function GET(request: Request) {
  if (!authorised(request)) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const supabase = createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Server Supabase configuration is missing" }, { status: 500 });
  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit") || 5), 5);
  const { data: connectors, error } = await supabase.from("source_connectors").select("id, source_url, config").eq("provider", "OpenActive discovered").eq("active", true).order("last_attempted_at", { ascending: true, nullsFirst: true }).limit(limit);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  let feedsChecked = 0; let sessionsCreated = 0; let sessionsUpdated = 0; let feedsFailed = 0;
  for (const connector of connectors ?? []) {
    const { data: runRecord } = await supabase.from("ingestion_runs").insert({ connector_id: connector.id, status: "running" }).select("id").single();
    if (!runRecord) continue;
    try {
      const config = connector.config && typeof connector.config === "object" ? connector.config as Record<string, unknown> : {};
      const startUrl = typeof config.nextUrl === "string" ? config.nextUrl : connector.source_url;
      const fetched = await fetchOpenActiveRecords(startUrl, 50, 1);
      let created = 0; let updated = 0;
      for (const rawRecord of fetched.records) {
        const session = normalizeOpenActiveRecord(rawRecord); if (!session) continue;
        const { data: existingSource } = await supabase.from("session_sources").select("session_id").eq("connector_id", connector.id).eq("external_id", session.externalId).maybeSingle();
        const { data: matchingVenue } = await supabase.from("venues").select("id").ilike("name", session.venueName).limit(1).maybeSingle();
        let venueId = matchingVenue?.id;
        if (!venueId) {
          const { data: newVenue, error: venueError } = await supabase.from("venues").insert({ name: session.venueName, area: session.area ?? null, booking_url: session.bookingUrl ?? null }).select("id").single();
          if (venueError || !newVenue) continue; venueId = newVenue.id;
        }
        const fields = { venue_id: venueId, title: session.title, starts_at: session.startsAt, ends_at: session.endsAt ?? null, skill_level: session.skillLevel, session_type: session.sessionType, price_pence: session.pricePence ?? null, capacity_total: session.capacityTotal ?? null, spaces_remaining: session.spacesRemaining ?? null, availability_status: session.availabilityStatus, availability_text: session.availabilityText, booking_mode: session.bookingMode, source_name: "OpenActive", source_url: session.bookingUrl ?? null, last_synced_at: new Date().toISOString(), last_verified_at: new Date().toISOString(), status: session.availabilityStatus === "sold_out" ? "sold_out" : "published" };
        let sessionId = existingSource?.session_id; let insertedNew = false;
        if (!sessionId) {
          const { data: candidate } = await supabase.from("sessions").select("id").eq("venue_id", venueId).eq("title", session.title).eq("starts_at", session.startsAt).limit(1).maybeSingle();
          sessionId = candidate?.id;
          if (!sessionId && sessionDedupeKey(session)) { const { data: inserted, error: insertError } = await supabase.from("sessions").insert(fields).select("id").single(); if (insertError || !inserted) continue; sessionId = inserted.id; created += 1; insertedNew = true; }
        }
        if (!sessionId) continue;
        if (!insertedNew) { await supabase.from("sessions").update(fields).eq("id", sessionId); updated += 1; }
        await supabase.from("session_sources").upsert({ session_id: sessionId, connector_id: connector.id, external_id: session.externalId, external_url: session.externalUrl ?? null, raw_payload: session.rawPayload, last_seen_at: new Date().toISOString(), last_synced_at: new Date().toISOString() }, { onConflict: "connector_id,external_id" });
      }
      await supabase.from("ingestion_runs").update({ status: "succeeded", records_seen: fetched.records.length, records_created: created, records_updated: updated, finished_at: new Date().toISOString() }).eq("id", runRecord.id);
      await supabase.from("source_connectors").update({ config: { ...config, nextUrl: fetched.nextUrl }, last_attempted_at: new Date().toISOString(), last_succeeded_at: new Date().toISOString(), last_error: null }).eq("id", connector.id);
      feedsChecked += 1; sessionsCreated += created; sessionsUpdated += updated;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "OpenActive feed failed";
      await supabase.from("ingestion_runs").update({ status: "failed", error_message: message, finished_at: new Date().toISOString() }).eq("id", runRecord.id);
      await supabase.from("source_connectors").update({ last_attempted_at: new Date().toISOString(), last_error: message }).eq("id", connector.id);
      feedsFailed += 1;
    }
  }
  return Response.json({ ok: true, feedsSelected: connectors?.length ?? 0, feedsChecked, feedsFailed, sessionsCreated, sessionsUpdated });
}

export async function POST(request: Request) { return GET(request); }
