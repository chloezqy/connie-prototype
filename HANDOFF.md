# Connie — Session Handoff

**Read this first if you're picking up this project fresh.** It captures where things stand, what's
real vs. illustrative, what lives *outside* the repo, and what's still open.

Last updated: end of the session that rebuilt the CR roster around the on-screen strollers (v5),
split the two NOT RECOMMENDED cards, and merged Chloe's loading animations.

---

## 1. What this is

**Connie** — a Consumer Reports browser-extension shopping assistant that overlays retail pages to
help someone choose a stroller. MHCI capstone (CMU). Repo: `chloezqy/connie-prototype`.

Two pieces:

- **Frontend** — React + TypeScript + Vite. Faithful reproductions of Figma screens.
- **Backend ("the brain")** — a **Langflow flow** running as a *separate local service*. It is NOT
  part of the React app; the app calls it over REST. See `CONNIE_BACKEND.md` for setup.

Owner split: **Chloe owns the frontend/UX.** The backend + wiring screens to live data is Yinzer's.

---

## 2. Architecture (one paragraph)

Each screen calls `callConnie()` (`src/api/connieClient.ts`) on mount. That POSTs to
`/langflow/api/v1/run/<flow_id>`, which the **Vite dev proxy** (`vite.config.ts`) forwards to
Langflow, injecting the API key server-side (so it never reaches the browser, and no CORS).
Inside Langflow, a **tool-calling Agent** (Vertex AI `gemini-2.5-flash`) runs with two tools:
**Chroma** (the CR test database) and **Tavily** (live web search). It returns a **single JSON
object** typed by `response_type`, which the client parses into a typed `ConnieResponse`
(discriminated union in `src/types/connie-contract.ts`). Screens then map that payload into their
designed components.

Six response types: `product_insights`, `inline_annotations`, `decision_support`,
`priority_inference`, `post_purchase`, `chat`.

---

## 3. Current environment (local)

- **Langflow:** `http://localhost:7860` (must be running for anything to work)
- **Flow ID:** `5c8974c3-52ba-4b7e-b806-9ce2375b127a` — hardcoded in `src/api/connieClient.ts`
- **Chroma collection:** `cr_strollers_v7` (bumped from `v6` when the v5 roster was ingested — see §4a).
  Both Chroma nodes must name the same collection.
- **Env:** `.env.local` (gitignored) holds `LANGFLOW_URL` and `LANGFLOW_API_KEY` (no `VITE_` prefix
  — the proxy reads them server-side)
- **Run:** `npm run dev` → `http://localhost:5173`
- **Test script:** `~/Downloads/Connie/test-connie.mjs` — hits the backend directly, prints the typed
  response and validates its shape. Reads the key from `.env.local` so it never hits shell history:
  ```bash
  cd ~/Downloads/Connie/connie-prototype
  LANGFLOW_API_KEY=$(grep '^LANGFLOW_API_KEY=' .env.local | cut -d= -f2- | tr -d '"'"'") \
    node ~/Downloads/Connie/test-connie.mjs "Rank these strollers for me"
  ```
  It asserts the roster size (`ROSTER_SIZE`, default 3) and that every advised-against product
  carries the `NOT RECOMMENDED` label and sorts last.

⚠️ **Rotate the Langflow API key.** The current one was pasted into a chat transcript.

---

## 4a. ⚠️ The CR dataset (v5) — the roster now matches the screen

**The single most important thing to understand about this project's data.**

The retail backdrop (`public/figma/insights-bg.png`) is a screenshot of a real Amazon search page
showing three strollers. Through **v4**, the CR dataset contained five *entirely different*
strollers (Nuna MIXX Next, UPPAbaby Vista V2, Baby Jogger City Mini GT2, Thule Urban Glide 2,
Lite 3) — so Connie's cards described products that were not on the page the user was looking at.

**v5 rebuilds the roster around the three products actually on screen:**

| Badge | Frame pos | Product | Verdict |
|---|---|---|---|
| 🟢 green | `left: 796` | Baby Trend Passport Switch 6-in-1 ($200) | `recommended`, score 84 |
| ⬜ grey | `left: 356` | Dream On Me Aero Travel Umbrella Stroller ($34) | `not_recommended`, score 54 |
| ⬜ grey | `left: 1215` | Graco Ready2Grow 2.0 Double Stroller ($299) | `not_recommended`, score 58 |

- Data file: **`backend-data/Stroller Test Data v5.md`** (gitignored — `backend-data/` is not in the
  repo, but `backend-data/README.md` documents the format and the re-ingest checklist).
- The frontend constants are in `src/features/productInsights/screens.tsx`: `LIVE_PRODUCT` and
  `NOT_REC_PRODUCTS` (`left` / `right`). `postPurchase` and `annotations` also name a product — they
  must name one that exists in the dataset, or the agent returns `chat` instead of a real payload.
- **If you change the roster, change it in three places:** the data file, the frontend constants,
  and the roster count in the Langflow prompt.

⚠️ **v5 attaches invented NOT RECOMMENDED verdicts to real, named brands** (Dream On Me, Graco).
v4's only poor performer was a fictional product ("Lite 3"), which was the safer design. Keep v5
demos **internal**; do not publish screenshots. The data file carries a SYNTHETIC banner saying so.

⚠️ **Ingest is additive.** Chroma has `allow_duplicates: false` and persists to `/tmp/cr_chroma`,
but that only dedupes identical documents — uploading a new roster into the *same* collection leaves
the old strollers in place. Bump the collection name on **both** Chroma nodes (or wipe
`/tmp/cr_chroma`) whenever the roster changes.

---

## 4b. ⚠️ CRITICAL: prompt rules that live ONLY in Langflow

The Langflow **Prompt Template** node is the actual Connie contract (persona, schema, guardrails).
**Six things** have been added to it. They ARE saved in the repo copy (`langflow/connie-flow.json`)
but the *running* flow is a separate live instance — if you re-import the flow, or if the live prompt
gets reset, these must be re-applied:

1. **`post_purchase` response type** — its schema block + routing rules.
2. **`OVERRIDE` rule** — reads priorities from a `[User priorities: …]` prefix in the user message.
   *(Necessary because Langflow `/run` does NOT honor tweaks on the priorities TextInput. Priorities
   are delivered inside the message — do not "fix" this back to tweaks; it doesn't work.)*
3. **Insight-ordering rule** — `product_insights` leads with the insights matching the user's
   priorities.
4. **`SOURCING INTEGRITY` rule** — never cite YouTube; only cite what was actually retrieved.
   **⚠️ This rule does not work reliably — see §8.** `sourceFilter.ts` is the real enforcement.
5. **`CLASSIFICATION GUARD`** — greetings/small talk return `chat`, not a product card.
6. **`rank_label` two-pass rule** *(new)* — decides NOT RECOMMENDED **before** assigning positional
   labels, so **multiple** products can be NOT RECOMMENDED and they all sort last. The old wording
   said NOT RECOMMENDED went to "any product you would advise against, **which always ranks last**"
   — singular. With two bad strollers, the model gave one of them `#2 RUNNER UP` while its own
   rationale said "Consumer Reports does not recommend this stroller."

**Also in the prompt:** the **roster count** ("The database contains three strollers… if it has
fewer than three entries, you have skipped strollers and must add them"). Stale count ⇒ the agent
invents strollers to pad the `decision_support` array.

**Also configured in the live flow (not obvious):** Vertex model = `gemini-2.5-flash`, **Max Output
Tokens = 8192** (at the default `0` the big `decision_support` payload gets truncated into invalid
JSON), and the **YouTube claim-extraction chain was deleted** (it exhausted the Vertex quota and
produced fabricated citations). Only `YouTubeTranscripts` remains, orphaned.

---

## 5. What is LIVE vs. ILLUSTRATIVE (important for demos)

**Genuinely live (real retrieved data):**
- **Consumer Reports lab data** — from the Chroma vector store. *(Synthetic values, real retrieval —
  see §4a. It is live data from a fake dataset.)*
- **Web evidence** — real Tavily search results with live URLs (The Bump, Strolleria, Mumsnet…).
- All six screens call the backend: Product Insights, Decision Support (cards/table/verdict/deep-dive),
  Priority Inference, Post-Purchase, Annotations, and a fully interactive **Chat**.
- Personalization is real: onboarding preferences are sent to the backend and genuinely reorder
  insights and re-rank Decision Support.

**Illustrative (authored synthetic data — do NOT present as live):**
- **Community posts** (Instagram / Reddit / TikTok / YouTube / Pinterest / Online blogs) in
  `src/mocks/communityPosts.ts`. There is no real social-listening pipeline — Instagram et al. have
  no open content API. These are authored samples, gated by what the user connects in onboarding.
- The **compare-prices popover** in Decision Support (fixed retailer prices).
- The **"DID YOU KNOW"** trivia (frontend-supplied by design; backend always returns `trivia: null`).

**Honest demo line:** *"CR lab data and web reviews are live; the community sentiment is illustrative
of the social-listening layer on our roadmap."*

**Sourcing rules enforced in `src/lib/sourceFilter.ts` (`cleanEvidence`):**
- **No YouTube** — matched by **URL and source name**, not just `source_type` (see §8).
- **No CR competitors** — Wirecutter, BabyGearLab, Reviewed, Good Housekeeping, RTINGS are blocked
  (a Consumer Reports tool must not cite competing review authorities).
- **No evidence-less claims** — an insight whose evidence is entirely YouTube/competitors is hidden;
  annotations fall back to designed content rather than showing an unbacked "verified" claim.

**Mock rows are a FAILURE fallback, not a loading state.** Product Insights and both NOT RECOMMENDED
panels now shimmer until the real fetch settles. The baked `rows` / `notRecRows` only appear if the
backend actually failed. This matters: the mock rows are plausible, CR-and-Reddit-badged, and
entirely fabricated — they used to appear silently and were easily mistaken for live data.

---

## 6. Git state

- **Branch:** `connie-backend-integration`.
- **`origin/main` (`5dfa921`, Chloe's "added animations for loading states") has been merged in.**
  Conflicts in `productInsights/screens.tsx` and `annotations/screens.tsx` were resolved to keep
  **both** sides — see §7.4.
- ⚠️ **The repo's fetch refspec was misconfigured** to fetch only one branch, so `origin/main` never
  updated and `git merge origin/main` said "Already up to date" against a stale ref. Fixed with:
  ```bash
  git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
  git fetch origin --prune
  ```
  If someone clones fresh and sees the same symptom, this is why.

---

## 7. Open threads / decisions pending

1. **~~1 vs. 2 not-recommended products~~ — RESOLVED.** There are now **two**, and they are distinct
   products with their own live cards (see §4a). The two grey badges no longer open the same card.

2. **`decisionSupport/screens.tsx` is stale against the v5 roster.** Its baked fallback cards and
   comparison table still list Vista / City Mini / Lite 3, and it uses `prod-vista.png` as the photo
   for **every** product. Live data overrides the *text*, but **the product photos will be wrong.**
   Chloe's screen — needs her.

3. **Annotations verdicts** *(Chloe's call — frontend ownership)*
   The backend returns **all four verdicts** (verified-by-both, community-only, misleading,
   unverifiable). Chloe's redesign only surfaces **misleading**. Worth raising: "Unable to verify" is
   arguably Connie's strongest credibility moment. Suggested compromise: keep her hover pattern but
   put multiple highlighted claims on the page, each revealing its own verdict.

4. **Two of Chloe's behaviours were changed in the merge — tell her:**
   - Her **verify animation** dismissed the annotation callout the instant the cursor left the claim.
     But the callout holds clickable source links, so it was unreachable. Her phase machine is kept;
     a 300ms grace period + hover-the-callout + click-to-pin were restored on top.
   - Her **shimmer** was a blind `setTimeout(…, 5000)` — it cleared whether or not the backend had
     answered, so a slow call or a 429 revealed mock rows behind an animation claiming we'd analysed
     the page. It now holds until the fetch settles, with 5s as a **floor** and 20s as a **ceiling**.

5. **NOT RECOMMENDED panel positions** — anchored under their own cards (`left: 176` and `left: 880`;
   the right one is clamped because the panel is 540px wide in a 1440px frame). Both draggable.

---

## 8. Known constraints / gotchas (things that will bite you)

- **The agent launders YouTube through `source_type: "web"`.** It returns things like
  `{ source_type: "web", source_name: "Simply Cherished Life (YouTube)",
  source_url: "https://www.youtube.com/watch?v=…" }`. The prompt's SOURCING INTEGRITY rule and the
  old `cleanEvidence` both checked `source_type === 'youtube'` and therefore **missed all of it** —
  YouTube citations were rendering in the UI the whole time. `sourceFilter.ts` now matches on URL
  and name. **Never trust `source_type` alone.**
- **Vertex quota (429s).** `product_insights` is a heavy call (live web searches). Firing several in
  quick succession trips the per-minute limit. Screens fetch **once on mount**, guarded against
  React StrictMode's double-invoke. The deep-dive and both NOT RECOMMENDED cards fetch **lazily**
  (only when opened), and each caches per badge + per priority string. Don't spam-refresh; don't add
  fetches casually. Opening all three badges in a row is enough to trip it.
- **Fetch failures used to be silent.** Both fetches now `console.warn` on failure or on an
  unexpected `response_type`, so "why am I seeing mock data" is answerable from the console.
- **Langflow `/run` ignores tweaks** on the priorities input — priorities go in the message. Already
  handled; don't "fix" it.
- **Re-importing the flow changes the flow ID** (and node IDs). If you re-import, grab the new ID
  from the Langflow URL and update `FLOW_ID` in `connieClient.ts`.
- **`vite.config.js`** (a stale compiled artifact) used to shadow `vite.config.ts` and silently break
  the proxy. It's deleted and gitignored — don't let it come back.
- **The CR data file is the one irreplaceable asset.** It's not in the repo (`backend-data/` is
  gitignored). Without it, Chroma is empty and `decision_support` / `product_insights` return
  nothing. A teammate self-hosting needs it from Yinzer directly (see `CONNIE_BACKEND.md`).

---

## 9. Key files

| File | Purpose |
|---|---|
| `backend-data/Stroller Test Data v5.md` | **The CR dataset.** Gitignored. One stroller per `---`-separated block. |
| `backend-data/README.md` | Roster, file format, and the Chroma re-ingest checklist. Read before changing the data. |
| `src/types/connie-contract.ts` | The typed response contract. Source of truth for the wire format. |
| `src/api/connieClient.ts` | `callConnie()` → typed `ConnieResponse`. Holds `FLOW_ID`. |
| `src/lib/sourceFilter.ts` | `cleanEvidence()` — drops YouTube (by URL *and* name) + CR competitors. |
| `src/features/productInsights/screens.tsx` | `LIVE_PRODUCT` + `NOT_REC_PRODUCTS`; the shimmer; both insight panels. |
| `src/mocks/communityPosts.ts` | Illustrative community posts (synthetic — see §5). |
| `src/store/usePreferences.ts` | Onboarding preferences + connected communities; drives personalization. |
| `langflow/connie-flow.json` | The flow, secrets scrubbed. Re-importable (changes the flow ID). |
| `vite.config.ts` | Dev proxy → Langflow, injects API key server-side. |
| `CONNIE_BACKEND.md` | Full backend setup, incl. teammate self-hosting checklist. |
| `~/Downloads/Connie/test-connie.mjs` | Direct backend test + shape validation. Not in the repo. |
