# Connie Backend (Langflow)

The Connie "brain" is a **Langflow flow** — a separate service the frontend calls over REST. It
takes a chat message (plus the shopper's priorities), searches a Consumer Reports test database
(Chroma vector store) and the web (Tavily), and returns a single typed JSON object describing what
the UI should render.

The React app does **not** contain the brain; it calls it. This folder holds everything needed to
run and connect to it.

## Architecture

```
React app  ──REST──▶  Langflow flow (the brain)  ──▶  Chroma (CR test data) + Tavily (web) + Vertex Gemini
   │                                                        │
   └── src/api/connieClient.ts  ◀── single typed JSON ──────┘
       src/types/connie-contract.ts   (shared response contract)
```

Every response is one JSON object discriminated by `response_type`, one of:
`product_insights`, `inline_annotations`, `decision_support`, `priority_inference`, `chat`,
`post_purchase`. The full shape lives in `src/types/connie-contract.ts`.

## Files

| File | Purpose |
|---|---|
| `src/types/connie-contract.ts` | TypeScript types for every Connie response. Source of truth for the wire format. |
| `src/api/connieClient.ts` | `callConnie({ message, priorities })` → typed `ConnieResponse`. |
| `langflow/connie-flow.json` | The Langflow flow, secrets scrubbed. Import this to recreate the brain. |
| `.env.example` | Env vars the client reads. Copy to `.env.local`. |

## Usage (frontend)

```ts
import { callConnie, isDecisionSupport } from '@/api/connieClient';

const res = await callConnie({ message: userText, priorities: 'Safety, Durability' });
if (isDecisionSupport(res)) {
  res.decision_support.products.forEach(p => /* render */);
}
```

Priorities are delivered inside the message as a `[User priorities: ...]` prefix (the Langflow
prompt has a matching rule that reads it). This is intentional — tweaks on the priorities input
were not honored by the Langflow `/run` endpoint in this version.

## Running your own backend (teammate setup)

The backend runs on **your own machine** — Langflow is not a shared/hosted service. Cloning the
repo gives you the flow and this guide, but the flow ships with **secrets and data removed**, so
you supply those. The committed flow already has the right model settings baked in
(`gemini-2.5-flash`, Max Output Tokens `8192`, YouTube claim-extraction removed), so you only need
to plug in credentials and data.

### What you need to get from the flow owner (Yinzer)

Two things are **not reproducible on your own** — ask for them directly (share securely, never
commit them):

1. **The CR stroller data file** (e.g. "Stroller Test Data v4"). This is the product data ingested
   into Chroma. Without it, `decision_support` and `product_insights` come back empty.
2. Optionally the **Tavily API key** — or make your own (below).

### What you set up yourself

1. **Node + the app.** `npm install`, then `npm run dev` (frontend at `http://localhost:5173`).
2. **Install & start Langflow.** `pip install langflow`, then `langflow run` (default
   `http://localhost:7860`).
3. **Import the flow.** Projects → New Flow → Import → `langflow/connie-flow.json`.
4. **Plug in credentials + data on the imported flow:**
   - **Google Vertex service account** — you need your own Google Cloud project with Vertex AI
     enabled, plus a service-account JSON. Upload it on **both** the *Vertex AI* and
     *Vertex AI Embeddings* nodes (Credentials field). Set the Project/Location to yours.
   - **Tavily API key** — free tier at tavily.com; paste it on the *Tavily AI Search* node.
   - **CR data file** — upload the file from Yinzer on the *File* node. It ingests into Chroma
     (collection `cr_strollers_v6`, persist dir `/tmp/cr_chroma`). Run the flow once so it builds.
5. **Create a Langflow API key.** Settings → Langflow API Keys → Add New → copy it (shown once).
6. **Configure the app.** Copy `.env.example` to `.env.local`; set `LANGFLOW_URL` and
   `LANGFLOW_API_KEY`. (No `VITE_` prefix — the Vite proxy reads them server-side.)
7. **Set the flow id.** Importing assigns a **new** flow id. Copy it from the Langflow URL
   (`/flow/<id>`) and set `FLOW_ID` in `src/api/connieClient.ts`.
8. **Restart `npm run dev`** so the proxy picks up `.env.local`, then test with
   `node test-connie.mjs "Rank these strollers for me"` (needs `LANGFLOW_API_KEY` + `FLOW_ID` env
   vars — see that file's header).

### Sanity check

`node test-connie.mjs` runs the full suite. Green across `decision_support`, `product_insights`,
`priority_inference`, `post_purchase`, and `chat` means the backend is wired correctly.

## Known constraints

- **Vertex quota:** the free tier caps requests per minute. Human demo pace (one action at a time)
  is fine; rapid bursts can 429. For heavier use, request a Vertex quota increase or use billing.
- **Browser → Langflow directly** exposes the API key and needs CORS — that's why we use the Vite
  proxy (`vite.config.ts`), which injects the key server-side. For a shared deploy, proxy through a
  real backend route instead.
- `community_stat` in `post_purchase` returns `null` until a real community-data source backs a
  figure — the model will not invent a percentage.
- **Product images:** only two real photos exist in assets (Vista, City Mini); other products reuse
  the Vista photo. Cosmetic only — all text data is live.
