# Lens — Product Discovery Engine

Photograph any product and find where to buy it online. Identification by
**Gemini Vision**, shopping links by **Tavily**.

## What it does

1. User drops or selects a product photo (with preview + remove/replace).
2. App identifies the product (name, brand, category, material, style).
3. App shows 3–5 purchase links with prices, sources, and thumbnails.
4. Every completed search is saved to a local SQLite database for history.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) |
| Database | SQLite via `better-sqlite3` |
| Vision AI | Google Gemini |
| Product search | Tavily |

## Design system — "Editorial Atelier"

A deliberate, cohesive look that avoids generic AI aesthetics. All tokens live
in `app/globals.css` under `@theme`.

- **Typography**: `Fraunces` (display serif, headlines + product names) paired
  with `Hanken Grotesk` (body/UI). Loaded via `next/font` in `app/layout.tsx`.
- **Palette**: warm paper (`--color-paper`), ink charcoal (`--color-ink`), a
  single terracotta accent (`--color-accent #b64a2b`), muted sage secondary.
- **Atmosphere**: layered warm radial gradients + a faint SVG film-grain
  overlay (`body::before`) for depth.
- **Motion**: one orchestrated page-load reveal (staggered `fade-up`), card
  hover lifts, shimmer skeletons. All respect `prefers-reduced-motion`.
- **Accessibility**: brand-colored `:focus-visible` rings on every control.

## Layout

- **Header** (sticky): `Lens` wordmark (click = reset) + a "New search" action.
- **Hero**: marketing headline + one-line description + the prominent upload
  zone. Marketing copy shows only on the idle screen; it steps aside once the
  user engages so results lead.
- **Workspace**: a `[1fr 300px]` grid on `lg+` — results on the left, a sticky
  search-history rail on the right. Stacks to one column on mobile.
- **States**: idle "How it works" explainer · identify skeleton · search
  skeleton · no-results (with retry) · friendly error (with retry).

## Folder structure

```
app/
  layout.tsx              Fonts + metadata + root layout
  globals.css             Design tokens, base styles, motion, grain
  page.tsx                Main SPA: orchestration, hero, states, skeletons
  api/
    identify/route.ts     POST — image → Gemini → identification + searchQuery
    search/route.ts       POST — searchQuery → Tavily → buyable results
    history/route.ts      GET list · POST save a completed search
    history/[id]/route.ts GET full saved search for re-view

components/
  UploadZone.tsx          Drag-drop + picker, preview with remove/replace
  IdentifyButton.tsx      Primary CTA with loading spinner
  IdentificationCard.tsx  Dark "ink" spec card, distinct from result cards
  ProductCard.tsx         Buyable result (thumb, name, price, store, Buy)
  ProductResults.tsx      Responsive grid (1 / 2 / 3 cols) of ProductCards
  SearchHistory.tsx       History rail: thumbnails, timestamps, click to reopen

lib/
  types.ts                Shared TypeScript interfaces
  mock-data.ts            Realistic mock response (Nike Air Max 270)
  db.ts                   SQLite init + helpers (insertSearch, listSearches)

docs/                     Dated decision logs
```

## Data flow

```
Upload image (local preview via URL.createObjectURL)
  → "Identify product"
  → POST /api/identify { image: base64 }        (Gemini Vision)
  → IdentificationCard renders; product area shows skeleton
  → POST /api/search { searchQuery }             (Tavily)
  → ProductResults rendered (3–5 buyable cards)
  → POST /api/history { thumbData, identification, products }  (SQLite)
  → history rail refreshes
  → Click a past search → GET /api/history/[id] → results re-render
```

The client orchestrates `identify` then `search` because both routes are pure
(no DB side effects). Persistence happens via `POST /api/history`, since
`better-sqlite3` runs server-side only. The identification card appears the
moment Gemini responds while a skeleton covers the Tavily search. Failures at
either stage (or zero results) surface a specific message with a Retry button.

## SQLite schema

```sql
CREATE TABLE searches (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  thumb_data   TEXT,        -- base64 JPEG (80px thumbnail)
  product_name TEXT,
  brand        TEXT,
  category     TEXT,
  results_json TEXT         -- full JSON response
);
```

Database file: `searches.db` in the project root (git-ignored).

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Requires a `.env` file:
```
GEMINI_API_KEY=your-key
TAVILY_API_KEY=your-key
```

## Testing the API routes

Both `identify` and `search` are pure (request → JSON). Start the dev server
and hit them directly; keys are read from `.env`.

```bash
# search — shopping query → buyable results from Tavily
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"searchQuery":"nike air max 270 buy"}'
# → { "results": [ { id, name, price, store, buyUrl, thumbnailUrl }, ... ] }

# identify — base64 image → product attributes + searchQuery (Gemini Vision)
curl -X POST http://localhost:3000/api/identify \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"data:image/jpeg;base64,$(base64 -i sample.jpg)\"}"
# → { productName, brand, category, material, style, description, searchQuery }
```

Error responses are JSON with the right status: missing input → `400`, missing
API key → `500`, upstream rate limit → `429`, other upstream failures → `502`.

## Next Steps

- **Deploy to Vercel** — push the repo and connect; set `GEMINI_API_KEY` and
  `TAVILY_API_KEY` as project env vars. (Note: `better-sqlite3` needs a
  persistent volume or a swap to a hosted DB such as Turso/Neon for serverless.)
- **Save favorites** — let users star results and revisit a saved-items board.
- **Price comparison across sources** — normalize prices and highlight the best
  deal per result set.
- **Browser extension / mobile camera capture** — identify products in-page or
  straight from the phone camera.
- **Barcode fallback** — when vision is ambiguous, scan a barcode/QR for an
  exact match.
