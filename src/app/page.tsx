"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fallbackSessions, type Session } from "@/lib/sessions";

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>(fallbackSessions);
  const [dataMode, setDataMode] = useState<"sample" | "supabase">("sample");
  const [connectionState, setConnectionState] = useState<"checking" | "live" | "error" | "not-configured">("checking");
  const [level, setLevel] = useState("Any level");
  const [area, setArea] = useState("All London");
  const [saved, setSaved] = useState(false);

  async function bookSession(session: Session) {
    const supabase = createSupabaseBrowserClient();
    if (supabase && !session.id.startsWith("sample-")) {
      await supabase.from("booking_clicks").insert({ session_id: session.id, source_name: session.source });
    }
    if (session.bookingUrl) window.open(session.bookingUrl, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setConnectionState("not-configured");
      return;
    }

    let active = true;
    void Promise.all([
      supabase.from("sessions").select("id, title, venue_id, starts_at, skill_level, session_type, price_pence, availability_text, source_name, source_url").eq("status", "published").order("starts_at", { ascending: true }).limit(100),
      supabase.from("venues").select("id, name, area, booking_url"),
    ]).then(([sessionResult, venueResult]) => {
        if (!active) return;
        if (sessionResult.error || venueResult.error) {
          console.error("Supabase session query failed", sessionResult.error ?? venueResult.error);
          setConnectionState("error");
          return;
        }
        if (!sessionResult.data?.length) {
          setConnectionState("live");
          return;
        }
        const venues = new Map((venueResult.data ?? []).map((venue) => [venue.id, venue]));
        const mapped = sessionResult.data.map((row) => {
          const venue = venues.get(row.venue_id);
          const startsAt = new Date(row.starts_at);
          return {
            id: row.id,
            title: row.title,
            venue: venue?.name ?? "London venue",
            area: venue?.area ?? "London",
            time: startsAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
            date: startsAt.toLocaleDateString("en-GB", { weekday: "long" }),
            level: row.skill_level,
            type: row.session_type,
            price: row.price_pence == null ? "Free" : `£${(row.price_pence / 100).toFixed(0)}`,
            status: row.availability_text ?? "Booking open",
            source: row.source_name,
            bookingLabel: row.source_name === "Spond" ? "Book via Spond →" : row.source_name === "Bookwhen" ? "Book on Bookwhen →" : row.source_name === "ClubSpark" ? "Check ClubSpark →" : "Book session →",
            bookingUrl: row.source_url ?? venue?.booking_url,
            tone: fallbackSessions.find((sample) => sample.type === row.session_type)?.tone ?? "mint",
          } satisfies Session;
        });
        setSessions(mapped);
        setDataMode("supabase");
        setConnectionState("live");
      });

    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => sessions.filter((session) => {
    const levelMatch = level === "Any level" || session.level === level;
    const areaMatch = area === "All London" || session.area === area;
    return levelMatch && areaMatch;
  }), [level, area]);

  return (
    <main>
      <nav className="nav shell">
        <div className="brand"><span className="brand-mark">✦</span><span>rally</span></div>
        <div className="nav-links"><a href="#sessions">Find a session</a><a href="#how">How it works</a><button className="nav-button">Join free</button></div>
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> London pickleball, made simple</div>
          <h1>Find your next<br /><em>good game.</em></h1>
          <p className="hero-lede">Every session, social and court booking in one calm, easy-to-search place.</p>
          <div className="hero-actions"><button className="primary-button" onClick={() => document.getElementById("sessions")?.scrollIntoView({ behavior: "smooth" })}>Explore sessions <span>↗</span></button><button className="text-button" onClick={() => setSaved(!saved)}>{saved ? "Alert saved ✓" : "Get session alerts  →"}</button></div>
          <div className="proof"><div className="avatars"><span>J</span><span>M</span><span>A</span><span>+</span></div><div><strong>Made for regular players</strong><small>Less searching. More playing.</small></div></div>
        </div>
        <div className="hero-card-wrap">
          <div className="floating-note top-note"><span className="note-icon green">✓</span><div><strong>3 new sessions</strong><small>match your preferences</small></div></div>
          <div className="court-card"><div className="court-top"><span className="mini-label">YOUR WEEK</span><span className="live-pill"><i /> Live</span></div><div className="court-date"><strong>Thu 09</strong><span>October 2026</span></div><div className="court-lines"><span /><span /><span /><span /><span /><span /><span /><span /><span /></div><div className="court-ball">●</div><div className="court-label">Play more<br /><strong>of the games you love.</strong></div></div>
          <div className="floating-note bottom-note"><span className="note-icon purple">⌁</span><div><strong>Intermediate · £14</strong><small>Lemon Pickleball · 2.1 mi</small></div></div>
        </div>
      </section>

      <section className="search-section" id="sessions"><div className="shell"><div className="section-kicker">FIND YOUR FIT</div><div className="section-heading"><div><h2>What are you looking for?</h2><p>Live options from venues and organisers across London.</p></div><button className={`save-search ${saved ? "active" : ""}`} onClick={() => setSaved(!saved)}>{saved ? "✓ Alert saved" : "♡ Save this search"}</button></div>
        <div className="filters"><label><span>When</span><button className="filter-control">This week <b>⌄</b></button></label><label><span>Where</span><select value={area} onChange={(event) => setArea(event.target.value)}><option>All London</option><option>West London</option><option>Central London</option><option>South London</option></select></label><label><span>Level</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option>Any level</option><option>Beginner</option><option>Improver</option><option>Intermediate</option><option>Advanced</option></select></label><button className="filter-button">Find sessions <span>→</span></button></div>
        <div className="results-head"><strong>{filtered.length} sessions found</strong><span>{dataMode === "supabase" ? "Live from your Supabase database · " : connectionState === "error" ? "Database connection error · " : connectionState === "not-configured" ? "Supabase not configured · " : "Loading live data · "}<button>Best match ⌄</button></span></div>
        <div className="session-grid">{filtered.map((session) => <article className="session-card" key={`${session.venue}-${session.time}`}><div className={`session-art ${session.tone}`}><span className="art-type">{session.type}</span><span className="art-time">{session.time}</span><div className="art-court"><span /><span /><span /><span /></div><div className="art-ball">●</div></div><div className="session-body"><div className="session-meta"><span>{session.date}</span><span>·</span><span>{session.level}</span></div><h3>{session.title}</h3><p>{session.venue} <span>·</span> {session.area}</p><div className="session-foot"><strong>{session.price}</strong><span className="availability">● {session.status}</span><span className="source">{session.source}</span></div><button className="book-button" onClick={() => void bookSession(session)} disabled={!session.bookingUrl}>{session.bookingUrl ? session.bookingLabel ?? "Book session →" : "Booking link coming soon"}</button></div></article>)}</div>
      </div></section>

      <section className="how shell" id="how"><div className="section-kicker">A BETTER WAY TO PLAY</div><h2>Less time searching.<br /><em>More time on court.</em></h2><div className="how-grid"><div><span className="step">01</span><h3>Tell us what fits</h3><p>Set your area, level and when you like to play. We remember the details.</p></div><div><span className="step">02</span><h3>See it all together</h3><p>One clear view across clubs, socials, coaching and matchplay.</p></div><div><span className="step">03</span><h3>Get out and play</h3><p>Book with the organiser, or let us alert you when the right spot opens.</p></div></div></section>
      <footer className="footer shell"><div className="brand"><span className="brand-mark">✦</span><span>rally</span></div><span>Pickleball, without the hunt.</span></footer>
    </main>
  );
}
