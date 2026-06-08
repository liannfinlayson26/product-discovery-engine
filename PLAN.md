# Lens — Product Discovery Engine · Plan

Photograph any product → identify it → find where to buy it.

## What We Built

A full-stack visual product discovery app on Next.js 16 + TypeScript +
Tailwind v4, with a local SQLite history.

- **Upload & preview** — drag-drop or file picker with a live preview and
  remove/replace controls.
- **AI identification** — `POST /api/identify` sends a downscaled image to
  Gemini Vision and returns the product's name, brand, category, material,
  style, a description, and a shopping query.
- **Shopping results** — `POST /api/search` passes Gemini's query to Tavily and
  returns 3–5 buyable results (name, price, store, buy URL, thumbnail).
- **Persistent history** — every completed search is saved to SQLite
  (`POST /api/history`) and listed in a sidebar; clicking one re-opens the full
  result (`GET /api/history/[id]`).
- **Complete state coverage** — idle explainer, identify/search skeletons,
  no-results and error states with retry, and a history re-view mode.
- **A real design system** — "Editorial Atelier": Fraunces + Hanken Grotesk,
  warm paper / ink / terracotta palette, grain + gradient atmosphere,
  orchestrated motion, and accessible focus states.

## What We Improved

Driven by the Ralph Loop and verified with the frontend-design skill (see
`docs/2026-06-02-design-overhaul.md`):

- Replaced generic system fonts and a timid `blue-on-grey` palette with a
  distinctive, cohesive editorial direction and design tokens.
- Built a proper centered **hero** with a prominent upload zone; the marketing
  copy steps aside once the user engages so results lead.
- Made the **identification card visually distinct** (dark "ink" card with an
  accent glow) from the light product result cards.
- Turned product results into a **responsive card grid** (1 / 2 / 3 columns)
  with hover lifts and a clear Buy affordance opening in a new tab.
- Added **loading skeletons**, refined **empty / no-results / error** states,
  and a polished **history rail** with thumbnails and timestamps.
- Added **remove/replace** on the preview and fixed the blurry stretched
  thumbnail on history re-view with a compact "From your history" banner.
- Added **`:focus-visible`** rings, `prefers-reduced-motion` support, and
  verified responsiveness (no horizontal scroll) on desktop and mobile.

## Future Roadmap

- **Deploy to Vercel** — connect the repo and set the API keys as env vars;
  move SQLite to a hosted DB (Turso / Neon) for the serverless runtime.
- **Save favorites** — star results and revisit a saved-items board.
- **Price comparison across sources** — normalize prices and surface the best
  deal per result set.
- **Browser extension / mobile camera capture** — identify products in-page or
  directly from the phone camera.
- **Barcode fallback** — scan a barcode/QR when vision identification is
  ambiguous, for an exact match.
- **Pagination & history management** — paginate beyond the current cap and add
  delete / clear-history controls.
