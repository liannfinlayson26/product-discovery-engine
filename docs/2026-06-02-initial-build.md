# Initial Build — 2026-06-02

## What was built

Complete app shell for the Vision-Based Product Discovery Engine. The app renders fully at localhost:3000 using mock data. No real AI or search APIs are wired yet.

### Features delivered
- Drag-and-drop / click-to-upload zone with live image preview
- "Identify Product" button with loading spinner
- Identification card (name, brand, category, material, style, description)
- 4 product result cards (name, price, store, buy link, thumbnail)
- Search history sidebar populated from SQLite, persists across refreshes
- Mobile-responsive layout (history moves below main content on small screens)

## Technical decisions

### Next.js App Router
Chosen for co-located API routes (`route.ts`) alongside the UI, removing the need for a separate Express server. The `/api/identify` and `/api/history` routes live in the same repo and deploy together.

### better-sqlite3 over Prisma / Drizzle
The app is local-only for now. `better-sqlite3` is synchronous, zero-config, and embeds directly in the Node.js process — no connection pool, no migration runner, no ORM overhead. The DB file (`searches.db`) lives in the project root.

### Client component for page.tsx
The main page manages upload state, loading state, and result state — all inherently interactive. Making it a client component (`"use client"`) keeps the state logic clean without needing a Context provider or Zustand.

### Base64 thumbnail in SQLite
Rather than saving file paths (which break if the user moves files) or full images (large), the app canvas-scales uploads to 80px and stores the JPEG data URL. This keeps the sidebar snappy and self-contained.

### Mock data as a module
`lib/mock-data.ts` exports a typed `MOCK_RESPONSE` constant. The identify route simply imports and returns it. Swapping in real Gemini + Tavily means replacing just the body of `app/api/identify/route.ts` — no component changes needed.

### Tailwind v4
The scaffold came with Tailwind v4 (PostCSS plugin pattern). No `tailwind.config.js` needed; configuration is done via `@theme` in `globals.css`.

## Known limitations / next steps

- Mock data always returns Nike Air Max 270 regardless of the uploaded image
- No error UI for failed API calls
- Images are sent as base64 thumbnails to the API but Gemini will need the full image — this will change in the next step
- No pagination on history (capped at 20 records)
