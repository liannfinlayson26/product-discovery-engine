# Gemini + Tavily Backend Routes — 2026-06-02

## What was added

The real intelligence layer, as **backend routes only** (frontend untouched):

- **`app/api/identify/route.ts`** (rewritten) — `POST` accepts a base64 image,
  sends it to Gemini Vision, and returns structured JSON:
  `{ productName, brand, category, material, style, description, searchQuery }`.
  Gemini writes `searchQuery` itself — a concise shopping query ending in "buy".
- **`app/api/search/route.ts`** (new) — `POST` accepts `{ searchQuery }`, calls
  the Tavily Search API, and returns `{ results: ProductResult[] }` with 3–5
  buyable results: `{ id, name, price, store, buyUrl, thumbnailUrl }`.
- **`lib/types.ts`** — added `IdentifyResult`, `SearchResponse`, `ApiError`
  alongside the existing (untouched) interfaces.

Both routes read keys from `process.env` (`GEMINI_API_KEY`, `TAVILY_API_KEY`).
Nothing is hardcoded.

## Decisions

### Gemini model: `gemini-2.5-flash` + fallback chain
Flash is fast, cheap, vision-capable, and supports structured output — ideal for
a per-upload identification call where latency matters. The route tries
`gemini-2.5-flash` first and falls back to `gemini-flash-latest` then
`gemini-2.0-flash` on a `404` (model unavailable for the key/region), so the
route keeps working as model availability shifts.

### Structured output instead of prompt-and-parse
The request sets `generationConfig.responseMimeType: "application/json"` with a
`responseSchema` pinning the seven fields. This guarantees clean JSON with no
markdown fences to strip, removing the most common source of parse failures.

### REST via `fetch`, no SDKs
Both APIs are called with plain `fetch` against their REST endpoints. This adds
zero npm dependencies and gives full control over the model-fallback loop and
HTTP error mapping. Gemini auth uses the `x-goog-api-key` header; Tavily takes
`api_key` in the request body.

### Tavily settings: `search_depth: "advanced"`, `max_results: 5`, `include_images: true`
- `advanced` returns richer per-result `content` snippets, which gives the price
  parser more text to work with.
- `max_results: 5` matches the app's "3–5 results" target.
- `include_images` supplies candidate thumbnails.
Shopping/retail results are favored by phrasing — Gemini appends "buy" to the
query — rather than a hard `include_domains` allow-list, which would over-filter.

### Price parsing + thumbnail fallback
Tavily does not return a structured price field, so price is parsed from the
result `content`/`title` with a `/\$\s?\d[\d,]*(\.\d{2})?/` regex; when no price
is found the route returns `"See listing"`. For thumbnails, the route matches a
Tavily image hosted on the same domain as the result, otherwise falls back to a
favicon (`google.com/s2/favicons`) so every card has an image.

### Pure routes — no DB writes (confirmed with user)
The previous mock `identify` wrote to SQLite. Both new routes are now pure
(request → JSON, no side effects). History persistence is deferred to the
frontend-wiring step, where `identify` + `search` results are combined and saved
together. Consequence: until that step, the running app's history sidebar won't
update on identify.

### Field-name reuse (confirmed with user)
The routes emit the existing type field names (`productName`, `store`, `buyUrl`,
`thumbnailUrl`, …) rather than the literal `name`/`title`/`source`/`url`/
`thumbnail` from the spec, so the next step wires into the current frontend with
no field mapping.

## Error handling

| Condition | Status | Body |
|-----------|--------|------|
| Missing API key | `500` | `{ error }` |
| Missing/empty image or searchQuery | `400` | `{ error }` |
| Invalid JSON body | `400` | `{ error }` |
| Upstream rate limit | `429` | `{ error }` |
| Upstream non-OK / network / parse failure | `502` | `{ error }` |

## Not done here (next step)

- No frontend changes (`page.tsx`, components).
- No SQLite writes / history wiring.
- No image resize before Gemini (routes accept a full `image` field for when the
  frontend stops sending only an 80px thumbnail).
