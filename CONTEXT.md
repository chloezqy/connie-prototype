# Connie — Project Context & Session Handoff

This file captures the full context and working history of the Connie build so anyone (or any
future session) can pick up without re-deriving it. Written 2026-07-09.

---

## 1. What Connie is

**Connie** is a **Consumer Reports (CR) browser-extension shopping assistant** that overlays retail
pages (Google search, Amazon, Philips Avent, etc.) to help a shopper research and buy a **stroller**.
It surfaces CR lab testing + community sentiment, annotates on-page marketing claims, infers the
shopper's priorities, produces a personalized ranking, supports shared/collaborative lists, and does a
post-purchase check-in.

This repo is a **working React prototype** of that experience, reproduced faithfully from Figma.

- **Project type:** MHCI Capstone (CMU).
- **Figma is the source of truth.** Screens are faithful frame-by-frame reproductions, not redesigns.

---

## 2. Figma source

- **File:** "Discovery Prototype" — fileKey **`7NaKwiTiD1PeEsFwZgjMPt`**
- **Build page:** the **"for Vibe Coding"** canvas, node **`1052:2133`** (~73 top-level frames).
- **Design system frames:** ★ Connie — DS Reference (`1052:5971`), ★ Component States (`1052:6089`).
- **Figma MCP is authenticated as** `echanqui@andrew.cmu.edu` (Edward Chanquin, team "team yonkas!!!"),
  NOT the user's andrew id. Only files that account can access are reachable.

### Frame → screen map (node IDs)
| Flow | Figma nodes | File | Route |
|---|---|---|---|
| Onboarding | N0 7120, N1 2134, N2 2148, M1 5317, N3 2165, N4a 2203/2254, N4b 2305/2337, N5 2385, N6 2369 | `src/features/onboarding/screens.tsx` | `/onboarding/*` |
| Product Insights | 2526, 2688, 2545, 2880, 2633, 2652, 2670 | `src/features/productInsights/screens.tsx` | `/browse/insights` |
| Annotations | 2872, 2756, 2803, 2709, 2852 | `src/features/annotations/screens.tsx` | `/browse/annotations` |
| Priority Inference | 3353, 3264, 3400, 3489, 3581, 3669, 3757, 3848 | `src/features/priorityInference/screens.tsx` | `/browse/priorities` |
| Decision Support | 4110, 3936, 4218, 4398, 4512, 4656, 5377, 5762, 5541 | `src/features/decisionSupport/screens.tsx` | `/browse/decision` |
| Collaboration | 2917, 3100, 3146, 3196, 3007 | `src/features/collaboration/screens.tsx` | `/browse/collaborate` |
| Post-Purchase | 4878, 4834, 4882, 4929, 5057, 4987, 5060, 5130 | `src/features/postPurchase/screens.tsx` | `/browse/post-purchase` |
| Chat (Chat 4) | 5908 (empty placeholder in Figma) | `src/features/chat/screens.tsx` | `/browse/chat` |
| Guided Tour | 2448, 2480, 2497, 2511, 2900 | `src/features/tour/screens.tsx` | `/browse/tour` |

(All node IDs are under `1052:` in the file, e.g. `1052:2134`.)

---

## 3. Stack

React 18 · TypeScript · Vite 5 · Tailwind CSS 3 · React Router v6 · Zustand · mock data only.
Node 23 / npm 10. No backend.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build  → currently 73 modules, 0 errors
```

Open `/` for the flow launcher, or "Start the full flow" to walk the prototype.

---

## 4. Architecture (fidelity conventions)

- **`src/layouts/FigmaFrame.tsx`** — a fixed **1440×900** canvas. Every screen wraps this and
  positions children at Figma's **exact absolute `left/top/width`**. It optionally renders a baked
  backdrop image (`backdrop`, `backdropOpacity`).
- **Baked backdrops/assets** — each frame's real screenshot + icons are downloaded to
  **`public/figma/`**, prefixed per flow (`onboarding-*`, `insights-*`, `annot-*`, `prio-*`, `ds-*`,
  `collab-*`, `pp-*`, `tour-*`). Referenced as `/figma/<name>`.
- **Design tokens** — `src/styles/tokens.css` (CSS variables) bridged into `tailwind.config.ts`.
  Pulled from the ★ DS Reference frames:
  - Brand `#00803e`, brand-muted `#daede0`; fg primary `#050500`, secondary `#666661`;
    attention `#ae0d00`; ratings excellent `#00803e` / very-good `#bfd730` / good `#ffd500` /
    fair `#ffa500` / poor `#ae0d00`; accent-blue `#003866`; CR launcher lime `#c4e860`.
  - Radius sm 8 / md 16 / lg 32 / pill. Panel shadow `0 0 15px rgba(0,0,0,.16)`.
  - Type (CR-Averta): eyebrow 14/24/+2 uppercase, body 16/24, title4 18/22/-0.25,
    title2 24/28/-0.8, title1 32/36/-1.5.
- **`src/components/connie/CRLauncher.tsx`** — the floating CR "C" launcher (used where a frame shows
  the collapsed launcher; many browse frames show the expanded nav rail instead, built inline).
- **State model** — same-named Figma frames are *states* of one screen, driven by
  `useSearchParams`/`useState` (e.g. `insights?v=…`, `decision?view=cards|table&mode=…`,
  `collaborate?stage=…`, `post-purchase?step=N`). Cross-flow nav uses `src/app/routes.ts`.
- **Stores (Zustand):** `useJourneyStore`, `usePriorityStore`, `useCollabStore`.
- **Mock data:** `src/mocks/{products,priorities,annotations,collaborators,chatScripts}.ts`.

---

## 5. Working history (chronological)

1. **Figma read.** Connected to Figma MCP; user shared the "Discovery Prototype" file. Listed the
   "1st Iteration" page, then the **"for Vibe Coding"** canvas — 73 top-level frames across 8 flows.
2. **Analysis.** Inferred the navigation flow and reusable components from metadata + screenshots.
3. **Plan.** Wrote `IMPLEMENTATION_PLAN.md` (structure, routing, components, tokens, layouts, state,
   mock data).
4. **First build (interpretive).** Scaffolded the app and implemented all flows as a *reasonable
   interpretation* — invented a "shopmart" backdrop, a left nav rail, generic panel chrome, and
   original copy. Built clean and screenshot-verified, but it was a redesign, not a reproduction.
5. **Course correction (user).** "Do not redesign or reinterpret… Read the Figma frames directly.
   Recreate the layouts as closely as possible… Treat Figma as the source of truth. Fix screens
   first." → switched to faithful frame-by-frame reproduction.
6. **Calibration.** Pulled real `get_design_context` for N1 Welcome; discovered the true design
   (Google backdrop, CR-Averta, exact panel coords/colors, lime "C" launcher, real copy). Fixed the
   foundation (tokens, `FigmaFrame`, `CRLauncher`, backdrop asset) and rebuilt N1 as a pixel match.
7. **Fan-out.** Delegated the remaining flows to per-flow subagents, each reading Figma directly,
   downloading baked assets, reproducing frames at exact coords, and screenshot-verifying. Ran a
   quality gate on Onboarding + Product Insights first, then the rest in parallel.
8. **Verification & consolidation.** Screenshot-verified every flow; full `tsc -b && vite build`
   passes (73 modules). Home launcher works.

---

## 6. Per-flow status — all faithful, verified

| Flow | Notes |
|---|---|
| Onboarding | N0 Chrome Web Store page; N1–N6 + M1 panels over dimmed Google page. Real copy. |
| Product Insights | Amazon backdrop; RECOMMENDED panel, DID YOU KNOW banner, accordion insight rows w/ CR+Reddit source chips, expanded detail, not-recommended, tooltip, nav-menu, collapsed. |
| Annotations | Amazon PDP; 4 verdict callouts (verified CR+community / community-only / misleading / unverifiable) with exact per-verdict colors + source cards. |
| Priority Inference | Connie chat inferring priorities; bento priority grid with ranked/green cards + soft-star; 8 progressive steps. |
| Decision Support | Personalized ranking; cards/table toggle, editable list w/ checkboxes, compare-retailers popover, detailed deep-dive, 900px expanded cards/table. |
| Collaboration | C1 confirm → C2 share → C3 add/permissions → C4 shared list, avatars, permission toggles. |
| Post-Purchase | Philips Avent backdrop; multi-step check-in (product card, chips, star+comment, thanks banner). |
| Chat | Chat 4 (empty in Figma) — reproduced with the PP chat-panel design as the completed thread. |
| Tour | T1–T4 coach-marks: spotlight highlight, dark tooltip + arrow, step counter, Skip/Next, inline-annotation callout. |

---

## 7. Key decisions & deviations

- **Per-frame CR launcher color is genuinely inconsistent in Figma:** onboarding N1 = lime `#c4e860`
  + dark "C"; browse frames = brand-green `#00803e` + white "C". Each frame matches itself; not
  normalized. Many browse frames show the **expanded nav rail** (chat/heart/gear/help) rather than
  the collapsed launcher — built inline for fidelity.
- **CR-Averta font is licensed and not installed.** `--font-sans` falls back to Inter/system. Sizes,
  weights, line-heights, tracking match Figma exactly; letterforms are approximate until the real
  font file is added.
- **Chat 4 (`1052:5908`) is an empty placeholder frame** — the only screen without literal Figma
  content. Reproduced using the established post-purchase chat-panel design.
- **Backdrops are baked screenshots** composited at the frame's opacity (often 0.3–0.7 over white,
  sometimes with a negative x-offset crop so highlights align).
- **Verbatim content preserved**, including Figma's minor copy typos and a placeholder inconsistency
  (a collaborator is "Alex" in the Add frame, "Maya" in the Permissions frame).

---

## 8. Open / pending items (awaiting user decision)

1. **Dev "state switchers".** Several browse screens carry small out-of-Figma affordances (a top
   strip or bottom pager) to reach states that aren't clickable in a static prototype. Options:
   standardize into one dismissible dev overlay, gate behind a `?dev` flag, or remove and rely on the
   flow menu. *Not yet actioned.*
2. **Orphaned interpretive components.** From the first (interpretive) build these are now unused and
   tree-shaken (build is clean): `layouts/ExtensionShell`, `layouts/OnboardingLayout`,
   `layouts/RetailBackdrop`, `layouts/ConniePanel`, and several `components/cards/*`,
   `components/display/*`. Safe to delete in a cleanup pass. *Not yet actioned.*
3. **CR-Averta font.** Add the licensed font file (e.g. under `public/fonts` + `@font-face`) if
   available, to make letterforms exact. *Not yet actioned.*

---

## 9. How to verify a screen visually (headless Chrome)

The dev server is client-rendered (SPA); use a virtual-time budget so React renders before capture:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless --disable-gpu --window-size=1440,900 --hide-scrollbars \
  --virtual-time-budget=3000 --screenshot=out.png "http://localhost:5173/<route>"
```

Compare against the frame's screenshot from `get_design_context` / `get_screenshot`.

---

## 10. Key files

- `IMPLEMENTATION_PLAN.md` — original plan (interpretive-era; §4 architecture superseded by the
  faithful FigmaFrame approach).
- `README.md` — run instructions + architecture overview.
- `src/layouts/FigmaFrame.tsx` — the 1440×900 fidelity canvas (core convention).
- `src/components/connie/CRLauncher.tsx` — floating CR launcher.
- `src/styles/tokens.css` + `tailwind.config.ts` — design tokens.
- `src/app/router.tsx` + `src/app/routes.ts` — routing.
- `src/features/*/screens.tsx` — one faithful file per flow.
- `public/figma/*` — baked backdrops + icons per flow.
