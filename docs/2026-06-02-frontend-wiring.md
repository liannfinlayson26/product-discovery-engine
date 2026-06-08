# Frontend Wiring — End-to-End Flow — 2026-06-02

## What changed

Connected the real Gemini + Tavily routes to the UI so the app now works end to
end: **upload a photo → Gemini identifies it → Tavily finds where to buy →
results render → the search is saved to history → past searches are
re-viewable.** No more mock data anywhere in the live path.

### Files
- **`app/page.tsx`** (main change) — replaced the single mock call with a
  client-orchestrated two-call flow, added status/error state, progressive
  rendering, a product skeleton, friendly errors with Retry, and history
  re-view.
- **`app/api/history/route.ts`** — added `POST` to persist a completed search
  (kept the existing `GET` list).
- **`app/api/history/[id]/route.ts`** (new) — `GET` returns a full saved search
  for re-viewing.
- **`lib/db.ts`** — added `getSearch(id)` (reuses `getDb()`); `insertSearch`
  reused unchanged.
- **`lib/types.ts`** — added `SavedSearchDetail`.
- **`components/SearchHistory.tsx`** — history items are now clickable buttons
  with an active highlight (`onSelect` / `activeId` props). All other components
  were already compatible and went untouched.

## Decisions

### Client orchestrates two calls; persistence via an API route
The routes are pure (no DB side effects), so `page.tsx` calls `/api/identify`
then `/api/search` in sequence. Because `better-sqlite3` only runs server-side,
the client can't write the DB directly — it saves the completed search through a
new `POST /api/history`. This keeps the DB server-only and the routes composable.

### `results_json` reuses `ApiIdentifyResponse` → zero-mapping re-view
A saved search stores `{ identification, products }` (the existing
`ApiIdentifyResponse` shape) in the `results_json` column. Re-viewing a past
search (`GET /api/history/[id]`) is then a plain `JSON.parse` with no field
mapping, and the same `IdentificationCard` / `ProductResults` components render
it. The history *list* query stays light (`listSearches` excludes
`results_json`); the heavy payload is fetched only on click.

### Progressive UI: identification first, then product skeleton
As soon as Gemini responds, the identification card renders and the product area
shows an `animate-pulse` skeleton grid while Tavily runs. This makes the
two-stage latency feel responsive instead of one long spinner.

### Friendly, stage-specific errors with Retry
Each stage throws a specific message — "couldn't identify the product" vs.
"identified it, but the shopping search failed" — shown in a red banner with a
Retry button. Zero search results is handled separately as a neutral notice
(the identification still shows) with a "Retry search" action.

### Image sizing
The client downscales the upload to ~1024px (longest edge, JPEG q0.85) for the
Gemini `image` payload — good fidelity at a modest size — and to 80px for the
history `thumbData`, reusing the original canvas-scaling approach.

## Verification
- `npx tsc --noEmit` clean.
- Persistence endpoints via curl: `POST /api/history` → `201 {id}`;
  `GET /api/history/:id` → full record; bad id → `400`; unknown id → `404`;
  missing identification → `400`.
- End-to-end via Playwright: uploaded a real JPEG, confirmed identification card
  appeared first, then 5 product cards with `target="_blank"` Buy links, the
  search saved to Recent Searches, and clicking it re-rendered the results
  (active highlight). Verified at desktop width and resized to 375px (history
  strip moves below the main column, products stack to one column).

## Known cosmetic issue (pre-existing, not introduced here)
`timeAgo` in `SearchHistory` parses the SQLite `created_at` (UTC, no `Z`
suffix) as local time, so a just-saved item can read "1h ago" depending on the
machine's timezone offset. Fix later by storing/parsing as explicit UTC.

## Out of scope
- No changes to the Gemini/Tavily route internals.
- No auth, pagination, or full-image storage (only the 80px thumb persists).
