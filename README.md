# Connie

**Connie** is a Consumer Reports browser-extension shopping assistant. It overlays retail pages
(Google and a simulated Amazon) to help someone research and buy a stroller — surfacing CR
lab data and community sentiment, annotating marketing claims on the page, inferring the shopper's
priorities, producing a personalized ranking, supporting shared lists, and checking in after
purchase.

Built by an **MHCI Capstone team (Carnegie Mellon, 2026) in partnership with Consumer Reports.**
This repo is the **final functional prototype**: a React frontend reproduced from Figma,
plus a working tool-calling agent backend that replaces the mock copy with live retrieved data.

## Team

| | Role |
|---|---|
| **Cassidy Ha** | PM, Design Strategy |
| **Chloe Zhu** | Design Engineer |
| **Edward Chanquin** | PM, AI Strategy |
| **Isabel Yin** | Product Designer |
| **Sarah Koh** | Product Designer |

## Links

| | Link | What it is |
|---|---|---|
| **Design** | [Connie Design Handoff (Figma)](https://www.figma.com/design/5NHRYHIKZpJ2TIQHZkHB8K/Connie---Design-Handoff?node-id=0-1&t=SrehqEKZeJcZcPZd-1) | **Design handoff** with all screens and components. |
| **Frontend** | https://connie-prototype.vercel.app | The full clickable flow on **mock data**. No backend needed, always up. |
| **Backend** | https://connie-prototype-theta.vercel.app | The **fully functional** build — a tool-calling agent returning live CR + web data. |

Both URLs build the **same code from `main`**. The only difference is environment variables: the
backend deploy points at a running Langflow instance, the frontend deploy doesn't and therefore falls
back to baked copy.

> **The backend link will be deactivated once the project wraps up.** It runs on a cloud VM that
> costs money to keep on, so we're taking it down afterward. Nothing is lost when we do: the live
> experience is fully reproducible on your own machine — follow **[Backend](#backend)** below to
> stand up Langflow locally, and the same build will serve live data again.

> ⚠️ **The CR dataset is synthetic** — it attaches invented NOT RECOMMENDED verdicts to real brands.
> Keep demos internal and don't publish screenshots of the verdicts as if they were real CR findings.

---

## How it works

```
browser
  └── React SPA (Vite build, Vercel)
        └── callConnie()                      src/api/connieClient.ts
              └── POST /langflow/api/v1/run/<flow_id>     (relative path — no API key in the browser)
                    └── proxy                 vite.config.ts (dev) │ vercel.json rewrite (prod)
                          └── Langflow ── tool-calling Agent (Vertex AI gemini-2.5-flash)
                                            ├── tool: Chroma      → CR stroller test database
                                            └── tool: Tavily      → live web search
                                          returns ONE typed JSON object
              ◀── ConnieResponse             src/types/connie-contract.ts
```

The "brain" is a separate Langflow service the app calls
over REST; the app's job is to send a message plus the shopper's priorities and render whatever typed
payload comes back.

---

## Backend

### The agent

Connie's brain is a **Langflow flow** (`langflow/connie-flow.json`, 14 nodes, secrets scrubbed). At
its center is a **tool-calling Agent** on **Vertex AI `gemini-2.5-flash`** (temperature `0`, max
output tokens `8192`) with two tools it decides between on its own:

- **Chroma** — a vector store of the Consumer Reports stroller test database (lab scores,
  maneuverability, safety/stability, durability, fold, weight, terrain, price, safety flags).
  Ingested from a CR data file via the Read File → Split Text → Chroma chain in the same flow.
- **Tavily** — live web search, for community sentiment: owner reviews, parent forums, social posts.

A ~16k-character **Prompt Template** node is the actual contract. It defines Connie's persona
(independent, no sponsorships), its method (search CR → search web → reconcile → **never hide a
conflict**, never invent a score), and the exact JSON schema for every response type.

### The response contract

Every response is **one JSON object** with exactly two top-level fields: `response_type` and a payload
field named the same. Six types, modeled as a TypeScript discriminated union in
[`src/types/connie-contract.ts`](src/types/connie-contract.ts) — the single source of truth for the
wire format:

| `response_type` | Drives | Payload highlights |
|---|---|---|
| `product_insights` | Product Insights panels | verdict, 4–6 insights, each with category/sentiment + 1–2 evidence items |
| `inline_annotations` | Claim annotations on the PDP | per-claim verdict: verified by both / community only / misleading / unverifiable |
| `decision_support` | The personalized ranking | ranked products, `rank_label`, rationale, priority matches, specs |
| `priority_inference` | Priority chat + bento grid | inferred priorities, follow-up question, answer options |
| `post_purchase` | The 3-week check-in | sentiment options, community stat |
| `chat` | Free-form chat | a message (also the fallback for greetings/small talk) |

Every piece of `Evidence` carries `source_type`, a human-readable `source_name`, a real `source_url`
(or `null` — never fabricated), and a ≤20-word quote.

### Client hardening

[`src/api/connieClient.ts`](src/api/connieClient.ts) is more than a `fetch`, because a real LLM is
messier than its schema:

- **Lenient parsing** — the agent is told to return one bare JSON object, but sometimes wraps it in
  ``` fences, prepends prose, or emits both a `chat` block *and* the real structured block. The
  parser scans for every top-level `{…}` (respecting string literals), keeps valid responses, and
  prefers the substantive one over the bare `chat`.
- **Priorities travel inside the message.** Langflow's `/run` endpoint does **not** honor tweaks on
  the priorities `TextInput`, so priorities are sent as a `[User priorities: …]` prefix that the
  prompt has a matching `OVERRIDE` rule for. This is deliberate — don't "fix" it back to tweaks.
- **Chat history travels the same way.** The agent is stateless; the last 6 turns are prefixed as
  context so follow-ups like *"why not the cheaper one?"* resolve.
- **Session cache** (`callConnieCached`) — module-scoped, so it survives route changes; keyed on
  priorities + history + message, so changing preferences correctly refetches. In-flight requests are
  shared (absorbing React StrictMode's double-invoke). Failures are **not** cached, so a 429 stays
  retryable.
- **Source filtering** ([`src/lib/sourceFilter.ts`](src/lib/sourceFilter.ts)) — the agent launders
  YouTube through `source_type: "web"`, so YouTube is matched by **URL and name**, never `source_type`
  alone. Direct CR competitors (Wirecutter, BabyGearLab, RTINGS, Good Housekeeping…) are dropped too:
  a CR-branded tool must not cite competing review authorities.
- **Demo pre-warm** ([`src/api/prefetch.ts`](src/api/prefetch.ts)) — opt-in via `?warm=1`. A
  `product_insights` call takes ~20s, so the heavy calls run **sequentially** with a 10s gap (one
  in-flight call at a time keeps us under the Vertex per-minute quota) in the background during
  onboarding, and fire 3s *after* priorities settle so the warmed cache keys match what the screens
  request.

### Setting it up

Full instructions live in **[CONNIE_BACKEND.md](CONNIE_BACKEND.md)** (local) and
**[BACKEND_DEPLOY.md](BACKEND_DEPLOY.md)** (Langflow on a GCP VM). The short version:

1. `pip install langflow && langflow run` → `http://localhost:7860`
2. Import `langflow/connie-flow.json`. Plug in your own Vertex service account (on both Vertex nodes)
   and a Tavily key.
3. Upload the CR stroller data file on the **Read File** node and run the flow once to ingest into
   Chroma. **This file is not in the repo** (`backend-data/` is gitignored) — get it from Yinzer.
   Without it, `decision_support` and `product_insights` come back empty.
4. Create a Langflow API key; copy `.env.example` → `.env.local` and set `LANGFLOW_URL` /
   `LANGFLOW_API_KEY` (no `VITE_` prefix — the proxy reads them server-side).
5. Re-importing assigns a **new flow id**. Copy it from the Langflow URL and set `VITE_FLOW_ID`.

---

## Frontend

### From design to code

The design went through **>6 iterations in Figma** before any of it was built. What's here is the
final high fidelity iteration, carried into React with the detail kept intact.

A few decisions shape the whole frontend:

- **One design system, not per-screen styling.** The brand green `#00803e`, the five-step rating
  scale, the radii, and the CR-Averta type ramp are defined once in
  [`src/styles/tokens.css`](src/styles/tokens.css) and bridged into the Tailwind theme, so a token
  change moves every screen at once. `/ds` renders the system on its own page.
- **States, not screens.** A design that shows Product Insights collapsed, expanded, and
  not-recommended is *one* screen with three states — modeled as search params
  (`insights?v=expanded`, `decision?view=table&mode=compare`, `collaborate?stage=share`) rather than
  duplicated routes. Every state is linkable, which is what makes them reviewable.
- **One tempo across the product.** Every thinking/generating/verifying animation runs on the same
  beat from [`src/lib/timing.ts`](src/lib/timing.ts), so Connie reads as a single system instead of
  a set of screens each with its own rhythm.
- **An extension has to sit on a real page.** Connie overlays retail, so the retail has to be
  convincing: `components/browser/` and `components/retail/` build the Chrome frame, Google, and the
  Amazon search + product pages the panels anchor to. Layout uses
  [`FigmaFrame`](src/layouts/FigmaFrame.tsx), a fixed 1440×900 canvas that positions elements at
  exact coordinates — deliberate, since a panel that drifts a few pixels off the product it's
  pointing at stops being an annotation.

### Stack

React 18 · TypeScript · Vite 5 · Tailwind CSS 3 · React Router v6 · Zustand. No test framework; the
build (`tsc -b && vite build`) is the gate.

### Layout

```
src/
  api/          connieClient.ts (callConnie + cache) · connieRequests.ts (shared messages) · prefetch.ts
  types/        connie-contract.ts — the wire format, source of truth
  app/          router.tsx + routes.ts (typed routes + flowOrder for the clickthrough)
  styles/       tokens.css (design tokens) + globals
  layouts/      FigmaFrame — the 1440×900 fidelity canvas
  components/   connie/ (CRLauncher, NaviRail, ChatPanel) · retail/ (Amazon chrome/search/PDP) ·
                browser/ (Chrome + Google) · primitives · display · cards · chat · overlays · icons
  features/     onboarding · tour · productInsights · annotations · priorityInference ·
                decisionSupport · collaboration · postPurchase · chat · home (gallery) · ds
  store/        usePreferences (drives personalization) · useJourneyStore · useCollabStore · usePriorityStore
  lib/          sourceFilter.ts (evidence rules) · timing.ts (one shared loading beat) · cn.ts
  mocks/        baked content — the FAILURE fallback, not a loading state
```

### Loading, and the mock-data trap

**Mock rows are a failure fallback, not a loading state.** This is the single most important thing to
understand when demoing. The baked rows are plausible, CR-and-Reddit-badged, and entirely fabricated;
they used to appear silently and were easily mistaken for live data. Now the screens shimmer until
the fetch **settles** — `LOADING_MS` (5s) is a *floor* so the animation reads as one beat across the
product, with a `MAX_LOADING_MS` ceiling so a hung backend can never trap the user. Baked copy only
appears if the backend genuinely failed, and every failure `console.warn`s with a `[Connie]` prefix,
so "why am I seeing mock data" is answerable from the console.

### Routes

- `/` — the flow, starting at the Chrome Web Store install screen
- `/navigation` — screen gallery, to jump straight to any screen
- `/ds` — design-system gallery
- `/onboarding/*` — install · search · welcome · member-check · login/signup · promise · survey
  (communities → priorities) · permissions · done · results
- `/browse/*` — tour · insights · annotations · priorities · decision · collaborate · post-purchase · chat

Append `?warm=1` to pre-warm the heavy backend calls during onboarding.

---

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173  — mock data unless .env.local points at Langflow
npm run build      # tsc -b && vite build
npm run typecheck
```

With no `.env.local`, you get the mock prototype — the whole flow is clickable with nothing else
running. To see live data, stand up the backend (above) and set `LANGFLOW_URL` / `LANGFLOW_API_KEY` /
`VITE_FLOW_ID`.

---

## What's live vs. illustrative

**Genuinely live** — real retrieval, all six backend-backed screens (Product Insights, Annotations,
Priority Inference, Decision Support, Post-Purchase, Chat):
- **CR lab data** from Chroma. *Real retrieval over a **synthetic** dataset* — live data from a fake
  database.
- **Web evidence** from Tavily: real search results with live URLs.
- **Personalization**: onboarding preferences genuinely reorder insights and re-rank Decision Support.

**Illustrative** — authored, do *not* present as live:
- **Community posts** (`src/mocks/communityPosts.ts`). There is no social-listening pipeline;
  Instagram et al. have no open content API. Gated by what the shopper connects in onboarding.
- The **compare-prices** popover (fixed retailer prices).
- The **"DID YOU KNOW"** trivia — frontend-supplied by design; the backend always returns
  `trivia: null`.

---

## Known constraints

- **Deployment is configured, not branched.** The backend branch was merged into `main`, so both
  Vercel projects build identical code — only the env vars differ. `vercel.json` rewrites
  `/langflow/*` straight to the VM's address, because Vercel's serverless functions weren't building
  for this Vite project; the proxy at [`api/langflow/[...path].ts`](api/langflow/[...path].ts), which
  injects the API key server-side, is still in the repo and is the better shape to return to. Note
  that **[DEPLOY_LIVE_DEMO.md](DEPLOY_LIVE_DEMO.md) still describes the two deploys as separate
  branches**, which the merge has made untrue.
- **The Langflow address is deliberately not in this README.** Port 7860 is open and the Langflow
  editor UI sits at `/flows`, so anyone with the address reaches the console holding the prompt, the
  Vertex credentials, and the Tavily key — over plain `http`. The API key gates the run endpoint, not
  that console. `langflow/connie-flow.json` is the reproducible path; nobody needs the live address.
- **Vertex quota (429s).** `product_insights` is heavy (tool loop + live web searches). Screens fetch
  once on mount, guarded against StrictMode's double-invoke, and cache per product + priority string.
  Opening several cards in a row can still trip the per-minute limit. Don't add fetches casually.
- **Never trust `source_type` alone** — the agent tags YouTube as `"web"`. `sourceFilter.ts` is the
  enforcement point, not the prompt's SOURCING INTEGRITY rule (which has the same blind spot).
- **Ingest is additive.** Uploading a new roster into the same Chroma collection leaves the old
  strollers in place. Bump the collection name on **both** Chroma nodes when the roster changes.
- **The roster must match the screen.** The Amazon backdrop shows specific strollers; the dataset, the
  frontend constants in `productInsights/screens.tsx`, and the roster count in the Langflow prompt all
  have to agree. A stale count makes the agent invent strollers to pad the array.
- **Prompt rules live in a running instance.** They're saved in `langflow/connie-flow.json`, but if
  you re-import or the live prompt resets, re-apply them — see **[HANDOFF.md](HANDOFF.md) §4b**.
- **Max Output Tokens must stay 8192.** At the default `0`, the big `decision_support` payload gets
  truncated into invalid JSON.
- **Don't let `vite.config.js` come back** — a stale compiled artifact used to shadow
  `vite.config.ts` and silently break the proxy. It's gitignored.

## Further reading

| Doc | What's in it |
|---|---|
| [HANDOFF.md](HANDOFF.md) | Pick-this-up-fresh brief: live vs. illustrative, prompt rules, open threads. |
| [CONNIE_BACKEND.md](CONNIE_BACKEND.md) | Backend architecture + teammate self-hosting checklist. |
| [BACKEND_DEPLOY.md](BACKEND_DEPLOY.md) | Langflow on a GCP VM (Vertex auth via attached service account). |
| [DEPLOY_LIVE_DEMO.md](DEPLOY_LIVE_DEMO.md) | Vercel setup, env vars, and the error-code table. |
| [CONTEXT.md](CONTEXT.md) | Figma frame → screen → route map, fidelity conventions, design rationale. |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | The original plan (interpretive-era; §4 superseded). |
