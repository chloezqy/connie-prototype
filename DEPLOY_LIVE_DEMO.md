# Deploying Connie — BACKEND LIVE DEMO

> **This is the backend-connected "live demo" deployment — the one that calls Langflow and shows
> real CR + web data.** It is a SEPARATE Vercel project from Chloe's frontend/mock prototype.
>
> | | Chloe's prototype | **This — live demo** |
> |---|---|---|
> | Vercel project | the existing one | **a new, separate project** |
> | Production branch | `main` | **`connie-backend-integration`** |
> | Data | mock / illustrative | **live Langflow (CR + Tavily)** |
> | Backend needed | no | **yes (always-on Langflow)** |
>
> ⚠️ **Keep them apart:** do NOT merge this deploy config (`vercel.json`, `api/`, this file) into
> `main`, or Chloe's mock deployment inherits the proxy + rewrites. Keep it on the
> `connie-backend-integration` branch, and point the new Vercel project at that branch as its
> Production Branch (Step 1 below).

This gets your teammates a **clickable URL** for the live demo instead of running everything on your
laptop. It covers the frontend + the API-key proxy. The backend (Langflow + Chroma on an always-on
host) is a separate job — see the last section.

## How the pieces fit

```
teammate's browser
   → https://connie.vercel.app                (static React build, on Vercel)
   → calls /langflow/api/v1/run/<flow>         (relative path, NO api key)
   → vercel.json rewrites → /api/langflow/...  (see vercel.json)
   → api/langflow/[...path].ts                 (serverless proxy — adds x-api-key)
   → LANGFLOW_URL                              (your always-on Langflow)
   → Chroma + Tavily + Vertex
```

The serverless proxy is the production replacement for the Vite dev proxy. In `npm run dev`, Vite
injects the key; in production there is no Vite, so this function does it instead. **The key lives
only in Vercel's env vars and never reaches the browser.**

## Prerequisites

- The frontend is already on GitHub (`chloezqy/connie-prototype`). Good.
- You need an **always-on Langflow** with a public HTTPS URL (not `localhost`). If you don't have
  one yet, do the backend section first — the frontend is useless without it.

## Steps

### 1. Create a NEW, separate Vercel project (do not reuse Chloe's)
- vercel.com → **Add New… → Project** → import `connie-prototype` **again** as a second project.
  Vercel allows the same repo to back multiple projects. Name it clearly, e.g. `connie-live-demo`.
- Framework preset: **Vite**. Build command `npm run build`, output `dist` (Vercel detects this).
- **Set the Production Branch to `connie-backend-integration`:**
  Project → **Settings → Git → Production Branch** → `connie-backend-integration`.
  This is what makes it the live demo and keeps it independent of Chloe's `main` deploy.
- **Don't deploy yet** — set env vars first (next step), or the first build will work but the app
  won't reach the backend.

### 2. Set the two environment variables
Project → **Settings → Environment Variables**. Add both (Production + Preview):

| Name | Value |
|---|---|
| `LANGFLOW_URL` | your always-on Langflow URL, e.g. `http://34.70.72.51:7860` (the GCP VM, no trailing slash) |
| `LANGFLOW_API_KEY` | the API key created ON the cloud Langflow (not your local one — keys are per-instance) |
| `VITE_FLOW_ID` | the flow id from the cloud Langflow URL, e.g. `a9ea7e6c-c9da-42ec-8b37-dc6a7e23b3a2` |

`LANGFLOW_URL` / `LANGFLOW_API_KEY` are read server-side by the proxy (no `VITE_` prefix).
`VITE_FLOW_ID` is baked into the build (it's not secret) so the browser calls the right flow.

No `VITE_` prefix — that's what keeps them server-side. The browser bundle never contains them.

### 3. Deploy
- **Deploy**. Vercel builds the static site and publishes the serverless function under `/api`.
- Every push to `main` redeploys automatically.

### 4. Verify
- Open the Vercel URL. Walk to Product Insights — it should hit the live backend.
- If cards fall back to mock data, open DevTools → Console for the `[Connie] …` warning, and check
  the **Network** tab: a request to `/langflow/api/v1/run/...`
  - **502** → the proxy can't reach `LANGFLOW_URL` (wrong URL, or Langflow is down).
  - **403 / 401** → wrong or missing `LANGFLOW_API_KEY`.
  - **200 but mock** → backend reachable but returned the wrong shape; read the console warning.
- Add `?warm=1` to the URL to pre-warm the demo calls on load.

## Files that make this work (already in the repo)
- `api/langflow/[...path].ts` — the serverless proxy.
- `vercel.json` — rewrites `/langflow/*` to the proxy, and everything else to `index.html` (so
  React Router's client-side routes survive a refresh).
- `src/api/connieClient.ts` — unchanged; it already calls the relative `/langflow` path, which works
  identically in dev (Vite proxy) and prod (serverless proxy).

## The backend (still to do — the bigger job)
Vercel hosts the **frontend + proxy** only. Langflow itself needs an always-on home:

1. **Host Langflow** on Railway / Render / a GCP VM (Docker image available).
2. **Vertex auth:** a cloud box has no `gcloud` login. Create a **GCP service account** with role
   *Vertex AI User*, download its JSON key, and give it to Langflow via
   `GOOGLE_APPLICATION_CREDENTIALS`. This is the step that silently breaks cloud Langflow.
3. **Re-ingest Chroma there.** Your vector store lives in `/tmp/cr_chroma` on your laptop and does
   not travel. Upload the v5 data file and run the flow once on the cloud box (see
   `backend-data/README.md`).
4. Put the Langflow API key + service-account JSON in the host's env/secrets — never in the repo.
5. Copy the resulting Langflow URL into Vercel's `LANGFLOW_URL`.

## Caveats for a class demo
- Every teammate shares your **one** Vertex per-minute rate limit and burns your credits. Fine for a
  demo, not for real load.
- The CR data is **synthetic** and now attaches invented NOT RECOMMENDED verdicts to real brands.
  Keep the URL unlisted; don't index it publicly.
