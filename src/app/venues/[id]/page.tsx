"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Venue = { id: string; name: string; address: string | null; area: string | null; county: string | null; postcode: string | null; booking_url: string | null };
type VenueSession = { id: string; title: string; starts_at: string; skill_level: string; session_type: string; price_pence: number | null; availability_text: string | null; source_name: string; source_url: string | null };

export default function VenuePage() {
  const params = useParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [sessions, setSessions] = useState<VenueSession[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !params.id) return;
    void Promise.all([
      supabase.from("venues").select("id, name, address, area, county, postcode, booking_url").eq("id", params.id).maybeSingle(),
      supabase.from("sessions").select("id, title, starts_at, skill_level, session_type, price_pence, availability_text, source_name, source_url").eq("venue_id", params.id).eq("status", "published").order("starts_at", { ascending: true }),
    ]).then(([venueResult, sessionResult]) => {
      if (venueResult.error || sessionResult.error || !venueResult.data) {
        setError("We could not load this venue yet.");
        return;
      }
      setVenue(venueResult.data);
      setSessions(sessionResult.data ?? []);
    });
  }, [params.id]);

  if (error) return <main className="detail-page"><div className="detail-shell"><a className="back-link" href="/#sessions">← Back to sessions</a><div className="detail-card"><h1>Venue unavailable</h1><p>{error}</p></div></div></main>;
  if (!venue) return <main className="detail-page"><div className="detail-shell"><a className="back-link" href="/#sessions">← Back to sessions</a><div className="detail-card"><p>Loading venue…</p></div></div></main>;

  return <main className="detail-page"><div className="detail-shell"><a className="back-link" href="/#sessions">← Back to sessions</a><header className="detail-hero"><div className="section-kicker">VENUE & ORGANISER</div><h1>{venue.name}</h1><p>{venue.area}{venue.postcode ? ` · ${venue.postcode}` : ""}</p><div className="detail-address">{venue.address ?? "London venue"}{venue.county ? ` · ${venue.county}` : ""}</div></header><div className="detail-grid"><section className="detail-card"><div className="detail-card-heading"><div><div className="section-kicker">UPCOMING OPTIONS</div><h2>Sessions at this venue</h2></div><span className="live-pill"><i /> Live</span></div>{sessions.length ? <div className="detail-session-list">{sessions.map((session) => { const url = session.source_url ?? venue.booking_url; const label = session.source_name === "Spond" ? "Book via Spond →" : session.source_name === "Bookwhen" ? "Book on Bookwhen →" : session.source_name === "ClubSpark" ? "Check ClubSpark →" : "Book session →"; return <div className="detail-session" key={session.id}><div><div className="session-meta"><span>{new Date(session.starts_at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</span><span>·</span><span>{new Date(session.starts_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span></div><h3>{session.title}</h3><p>{session.skill_level} · {session.session_type} · {session.price_pence == null ? "Free" : `£${(session.price_pence / 100).toFixed(0)}`}</p><small>{session.availability_text ?? "Check organiser"}</small></div>{url && <a className="detail-book" href={url} target="_blank" rel="noreferrer">{label}</a>}</div>; })}</div> : <p>No upcoming sessions are listed yet.</p>}</section><aside className="detail-card"><div className="section-kicker">HOW TO JOIN</div><h2>Choose a session</h2><p>Rally brings the options together. Booking and joining are completed with the organiser or booking platform shown on each session.</p>{venue.booking_url && <a className="primary-button detail-venue-link" href={venue.booking_url} target="_blank" rel="noreferrer">Open venue booking <span>↗</span></a>}<p className="detail-note">Always check the organiser’s latest availability before travelling.</p></aside></div></div></main>;
}
