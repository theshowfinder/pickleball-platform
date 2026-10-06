import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const COLLECTION_URL = "https://openactive.io/data-catalogs/data-catalog-collection.jsonld";

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && (request.headers.get("authorization") === `Bearer ${secret}` || request.headers.get("x-ingest-secret") === secret);
}

function links(value: unknown): string[] {
  if (typeof value === "string" && /^https?:\/\//.test(value)) return [value];
  if (Array.isArray(value)) return value.flatMap(links);
  if (value && typeof value === "object") return Object.values(value).flatMap(links);
  return [];
}

async function json(url: string) {
  const response = await fetch(url, { headers: { accept: "application/ld+json, application/json", "user-agent": "Rally Pickleball Hub/0.1 (+https://pickleball-platform-xi.vercel.app/)" }, cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return response.json() as Promise<Record<string, unknown>>;
}

async function discoverFeeds(datasetUrl: string) {
  const response = await fetch(datasetUrl, { headers: { accept: "text/html, application/ld+json", "user-agent": "Rally Pickleball Hub/0.1 (+https://pickleball-platform-xi.vercel.app/)" }, cache: "no-store" });
  if (!response.ok) return [];
  const html = await response.text();
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const feeds: string[] = [];
  for (const match of matches) {
    try {
      const metadata = JSON.parse(match[1]) as Record<string, unknown>;
      for (const distribution of Array.isArray(metadata.distribution) ? metadata.distribution : []) {
        if (!distribution || typeof distribution !== "object") continue;
        const item = distribution as Record<string, unknown>;
        const url = item.contentUrl ?? item.url ?? item.endpointUrl;
        if (typeof url === "string" && /^https?:\/\//.test(url)) feeds.push(url);
      }
    } catch { /* Ignore malformed JSON-LD blocks. */ }
  }
  return [...new Set(feeds)];
}

export async function GET(request: Request) {
  if (!authorised(request)) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const supabase = createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Server Supabase configuration is missing" }, { status: 500 });
  try {
    const collection = await json(COLLECTION_URL);
    const catalogUrls = [...new Set(links(collection.hasPart).slice(0, 20))];
    const datasetUrls: string[] = [];
    for (const catalogUrl of catalogUrls) {
      try { datasetUrls.push(...links((await json(catalogUrl)).dataset).slice(0, 50)); } catch { /* Skip unavailable catalogues. */ }
    }
    const feedUrls: string[] = [];
    for (const datasetUrl of [...new Set(datasetUrls)].slice(0, 100)) {
      try { feedUrls.push(...await discoverFeeds(datasetUrl)); } catch { /* Skip unavailable dataset sites. */ }
    }
    const uniqueFeeds = [...new Set(feedUrls)].slice(0, 250);
    let created = 0;
    for (const sourceUrl of uniqueFeeds) {
      const { data, error } = await supabase.from("source_connectors").select("id").eq("provider", "OpenActive discovered").eq("source_url", sourceUrl).maybeSingle();
      if (error || data) continue;
      const { error: insertError } = await supabase.from("source_connectors").insert({ provider: "OpenActive discovered", name: "Discovered OpenActive feed", source_url: sourceUrl, connector_type: "open_data" });
      if (!insertError) created += 1;
    }
    return Response.json({ ok: true, cataloguesChecked: catalogUrls.length, datasetsChecked: [...new Set(datasetUrls)].length, feedsFound: uniqueFeeds.length, connectorsCreated: created });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "OpenActive discovery failed" }, { status: 502 });
  }
}

export async function POST(request: Request) { return GET(request); }
