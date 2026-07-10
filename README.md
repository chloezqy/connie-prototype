# Connie

**Connie** is a prototype of a Consumer Reports browser‑extension assistant that overlays retail
pages (a simulated Amazon) to help a shopper research and buy a stroller. It surfaces CR lab
testing and community sentiment, inline claim annotations, priority inference, a personalized
Top 5, shared lists, and a post‑purchase check‑in.

It was built as a reproduction of the Figma prototype:

> **Figma — "Discovery Prototype"**
> https://www.figma.com/design/7NaKwiTiD1PeEsFwZgjMPt/Discovery-Prototype?node-id=667-44663&p=f&t=s97XBGV6thTAnMvI-0

## What's real and what's mock

- **Frontend — mockup copy.** Every screen ships with baked placeholder text so the whole flow is
  clickable and demoable on its own, with no backend required. The visuals, layout, and
  interactions are the real deliverable; the words are stand‑ins.
- **Backend — implemented, runs locally.** Connie's "brain" is a **Langflow** flow (a separate
  service the app calls over REST) that searches a Consumer Reports test database + the web and
  returns typed JSON. When it's running, its **live responses replace the mock copy** on each
  screen; when it's not reachable, the baked text stays so nothing breaks. Setup, architecture,
  and the response contract are documented in **[CONNIE_BACKEND.md](CONNIE_BACKEND.md)**.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · React Router v6 · Zustand. Design tokens
(CR brand green `#00803e`, rating scale, spacing, type, shadows) come from the Figma DS Reference
frames and live as CSS variables bridged into the Tailwind theme.

## Run (frontend)

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
```

`/` opens the flow starting at the Chrome Web Store install screen; walk it through
onboarding → tooltips → browse → decide → collaborate → post‑purchase. `/navigation` is a screen
gallery for jumping directly to any screen.

To see live data instead of the mock copy, stand up the Langflow backend and point the app at it —
follow **[CONNIE_BACKEND.md](CONNIE_BACKEND.md)** (copy `.env.example` → `.env.local`, set
`LANGFLOW_URL` / `LANGFLOW_API_KEY`).

## Architecture

```
src/
  app/         router + typed route constants and flow order
  api/         connieClient.ts — callConnie() → typed backend responses
  types/       connie-contract.ts — the shared wire format (source of truth)
  styles/      tokens.css (design tokens) + globals
  layouts/     FigmaFrame · ConniePanel  (+ some legacy layouts, unused)
  components/  connie/ (NaviRail, RetailBackdrop, CRLauncher) · primitives · display · cards ·
               chat · overlays · icons
  features/    onboarding · tour · productInsights · annotations · priorityInference ·
               decisionSupport · collaboration · postPurchase · chat · home (screen gallery) · ds
  store/       useJourneyStore · usePreferences · useCollabStore · usePriorityStore
  mocks/       baked placeholder content used until live data arrives
```

## Routes

- `/` — real flow (starts at install) · `/navigation` — screen gallery · `/ds` — design‑system gallery
- `/onboarding/*` — install, welcome, member‑check, login, promise, survey (communities /
  priorities), permissions, done
- `/browse/*` — tour, insights (`?v=recommended|expanded|notrec|…`), annotations, priorities,
  decision (`?view=cards|table&expanded=1&mode=compare|detailed`),
  collaborate (`?stage=confirm|share|add|permissions|shared`), post‑purchase, chat

See `CONTEXT.md` and `IMPLEMENTATION_PLAN.md` for the full design rationale.
