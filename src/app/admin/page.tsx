"use client";

import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Venue = { id: string; name: string; area: string | null };
type AdminSession = { id: string; title: string; starts_at: string; skill_level: string; session_type: string; price_pence: number | null; venue_id: string; source_name: string; availability_text: string | null; source_url: string | null };

export default function AdminPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", venue_id: "", skill_level: "Intermediate", session_type: "Social", price: "15", starts_at: "", source_name: "Manual", availability: "Booking open", booking_url: "" });

  async function loadData() {
    if (!supabase) return;
    const [{ data: venueData }, { data: sessionData }] = await Promise.all([
      supabase.from("venues").select("id, name, area").order("name"),
      supabase.from("sessions").select("id, title, starts_at, skill_level, session_type, price_pence, venue_id, source_name, availability_text, source_url").order("starts_at", { ascending: true }).limit(50),
    ]);
    setVenues(venueData ?? []);
    setSessions(sessionData ?? []);
    if (!form.venue_id && venueData?.[0]) setForm((current) => ({ ...current, venue_id: venueData[0].id }));
  }

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setUser(data.user ? { email: data.user.email } : null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ? { email: session.user.email } : null));
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => { if (user) void loadData(); }, [user]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "Signed in.");
  }

  async function addSession(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const { error } = await supabase.from("sessions").insert({
      venue_id: form.venue_id,
      title: form.title,
      starts_at: new Date(form.starts_at).toISOString(),
      skill_level: form.skill_level,
      session_type: form.session_type,
      price_pence: Math.round(Number(form.price) * 100),
      source_name: form.source_name,
      availability_text: form.availability,
      source_url: form.booking_url || null,
      status: "published",
      last_verified_at: new Date().toISOString(),
    });
    setMessage(error ? error.message : "Session added.");
    if (!error) { setForm((current) => ({ ...current, title: "", starts_at: "", booking_url: "" })); await loadData(); }
  }

  if (!supabase) return <main className="admin-page"><div className="admin-card"><h1>Admin setup required</h1><p>Add the Supabase environment variables before using the operator dashboard.</p></div></main>;
  if (!user) return <main className="admin-page"><form className="admin-card" onSubmit={signIn}><div className="section-kicker">RALLY OPERATIONS</div><h1>Sign in to manage supply</h1><p>Add and verify venues, sessions and booking links.</p><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="primary-button" type="submit">Sign in <span>→</span></button>{message && <div className="admin-message">{message}</div>}</form></main>;

  return <main className="admin-page"><div className="admin-shell"><div className="admin-header"><div><div className="section-kicker">RALLY OPERATIONS</div><h1>Manage supply</h1><p>Signed in as {user.email}</p></div><button className="text-button" onClick={() => supabase.auth.signOut()}>Sign out →</button></div><div className="admin-grid"><form className="admin-card" onSubmit={addSession}><h2>Add a session</h2><p>Publish a verified session with its real joining route and availability note.</p><label>Session title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Intermediate open play" required /></label><label>Venue<select value={form.venue_id} onChange={(event) => setForm({ ...form, venue_id: event.target.value })}>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}{venue.area ? ` · ${venue.area}` : ""}</option>)}</select></label><div className="admin-row"><label>Starts<input type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} required /></label><label>Price (£)<input type="number" min="0" step="0.50" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label></div><div className="admin-row"><label>Level<select value={form.skill_level} onChange={(event) => setForm({ ...form, skill_level: event.target.value })}><option>Beginner</option><option>Improver</option><option>Intermediate</option><option>Advanced</option><option>All levels</option></select></label><label>Type<select value={form.session_type} onChange={(event) => setForm({ ...form, session_type: event.target.value })}><option>Social</option><option>Open play</option><option>Matchplay</option><option>Coaching</option><option>Tournament</option><option>Court hire</option></select></label></div><div className="admin-row"><label>Source<select value={form.source_name} onChange={(event) => setForm({ ...form, source_name: event.target.value })}><option>Manual</option><option>Spond</option><option>Playtomic</option><option>Bookwhen</option><option>ClubSpark</option><option>Direct</option></select></label><label>Availability<input value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value })} placeholder="Join via Spond · code ..." required /></label></div><label>Booking link<input type="url" value={form.booking_url} onChange={(event) => setForm({ ...form, booking_url: event.target.value })} placeholder="https://..." /></label><button className="primary-button" type="submit">Publish session <span>→</span></button>{message && <div className="admin-message">{message}</div>}</form><section className="admin-card"><div className="admin-card-heading"><div><h2>Upcoming sessions</h2><p>{sessions.length} records in the database</p></div><span className="live-pill"><i /> Live</span></div><div className="admin-list">{sessions.map((session) => <div className="admin-list-item" key={session.id}><div><strong>{session.title}</strong><small>{new Date(session.starts_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {venues.find((venue) => venue.id === session.venue_id)?.name ?? "Venue"} · {session.skill_level} · {session.source_name}{session.availability_text ? ` · ${session.availability_text}` : ""}</small></div><b>{session.price_pence == null ? "Free" : `£${(session.price_pence / 100).toFixed(0)}`}</b></div>)}</div></section></div></div></main>;
}
