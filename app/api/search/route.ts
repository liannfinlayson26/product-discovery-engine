import { NextRequest, NextResponse } from "next/server";
import type { ProductResult } from "@/lib/types";

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
}

interface TavilyResponse {
  results?: TavilyResult[];
  images?: (string | { url?: string })[];
}

// Matches prices like "$150", "$1,299.99", "$ 49.95".
const PRICE_RE = /\$\s?\d[\d,]*(?:\.\d{2})?/;

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function extractPrice(...sources: (string | undefined)[]): string {
  for (const s of sources) {
    const match = s?.match(PRICE_RE);
    if (match) return match[0].replace(/\$\s+/, "$");
  }
  return "See listing";
}

// Pick a Tavily image hosted on the same domain as the result, if any.
function thumbnailFor(host: string, images: TavilyResponse["images"]): string {
  for (const img of images ?? []) {
    const src = typeof img === "string" ? img : img?.url;
    if (src && hostname(src) === host) return src;
  }
  return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: TAVILY_API_KEY is not set" },
      { status: 500 }
    );
  }

  let body: { searchQuery?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const searchQuery = body.searchQuery;
  if (typeof searchQuery !== "string" || !searchQuery.trim()) {
    return NextResponse.json(
      { error: "searchQuery is required" },
      { status: 400 }
    );
  }

  let res: Response;
  try {
    res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        max_results: 5,
        search_depth: "advanced",
        include_images: true,
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Network error contacting Tavily: ${String(err)}` },
      { status: 502 }
    );
  }

  if (res.status === 429) {
    return NextResponse.json(
      { error: "Tavily rate limit reached, please try again shortly" },
      { status: 429 }
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `Tavily returned ${res.status}` },
      { status: 502 }
    );
  }

  let payload: TavilyResponse;
  try {
    payload = await res.json();
  } catch {
    return NextResponse.json(
      { error: "Could not parse Tavily response" },
      { status: 502 }
    );
  }

  const results: ProductResult[] = (payload.results ?? [])
    .filter((r) => r.url)
    .slice(0, 5)
    .map((r, i) => {
      const host = hostname(r.url!);
      return {
        id: `${i}-${host}`,
        name: r.title ?? host,
        price: extractPrice(r.content, r.title),
        store: host,
        buyUrl: r.url!,
        thumbnailUrl: thumbnailFor(host, payload.images),
      };
    });

  return NextResponse.json({ results });
}
