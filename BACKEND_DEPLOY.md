# Backend deploy — Langflow on a GCP VM (for the live demo)

> This gets Connie's **backend** always-on so the Vercel live demo has real data. Do this BEFORE
> the Vercel steps in `DEPLOY_LIVE_DEMO.md` — the frontend is useless until `LANGFLOW_URL` points
> here.
>
> **Why GCP (not Railway/Render):** you're already using Google Vertex AI. If Langflow runs on a
> GCP VM with an attached service account, Vertex authentication is automatic — no key file to
> download, store, or leak. That removes the single most error-prone step. Everything stays in one
> project and one bill.

## The shape

```
Vercel serverless proxy  →  http://<VM_EXTERNAL_IP>:7860  →  Langflow
                                                              ├─ Chroma (vector store, on disk)
                                                              ├─ Tavily (web search)
                                                              └─ Vertex AI  ← auth via attached SA
```

The browser never talks to the VM directly — only Vercel's server-side proxy does, and it adds the
API key. So the VM can serve plain `http` on its IP; there's no browser mixed-content problem.

---

## Step 1 — Service account (makes Vertex auth automatic)

In Google Cloud Console → **IAM & Admin → Service Accounts**:

1. **Create service account**, name it e.g. `connie-langflow`.
2. Grant it the role **Vertex AI User** (`roles/aiplatform.user`).
3. No key download needed — you'll attach it to the VM directly in Step 2.

## Step 2 — Create the VM

Console → **Compute Engine → VM instances → Create instance**:

- **Machine type:** `e2-medium` (2 vCPU / 4 GB) is enough for a demo. `e2-standard-2` if it feels tight.
- **Boot disk:** Debian 12, bump the size to **30 GB** (Docker images + Chroma need room).
- **Identity and API access → Service account:** select **`connie-langflow`** from Step 1. *(This
  is the line that makes Vertex work without a key file — don't skip it.)*
- **Firewall:** check **Allow HTTP traffic** for now. You'll open port 7860 in Step 4.

## Step 3 — Install Docker + run Langflow

SSH into the VM (the **SSH** button on the instance row), then:

```bash
# Docker
sudo apt-get update && sudo apt-get install -y docker.io
sudo usermod -aG docker $USER && newgrp docker

# Persistent data dir — NOT /tmp. /tmp is wiped on reboot and would erase your Chroma store.
sudo mkdir -p /opt/langflow-data && sudo chown $USER /opt/langflow-data

# Run Langflow, pinned to a known-good version, data persisted to the dir above
docker run -d --name langflow --restart unless-stopped \
  -p 7860:7860 \
  -v /opt/langflow-data:/app/langflow \
  langflowai/langflow:1.8.0
```

Give it a minute, then `curl localhost:7860` should return HTML.

> ⚠️ **Vertex auth check:** because the VM has the service account attached, the Google libraries
> inside the container pick up credentials automatically (Application Default Credentials). You do
> NOT set `GOOGLE_APPLICATION_CREDENTIALS`. If Vertex calls fail with an auth error, confirm the SA
> is attached (Step 2) and has the Vertex AI User role (Step 1).

## Step 4 — Open the port

Console → **VPC network → Firewall → Create firewall rule**:

- Targets: the VM (by tag or "All instances in the network" for a demo).
- Source IPv4 ranges: `0.0.0.0/0` (open — acceptable for a demo because the Langflow API key gates
  access; tighten later).
- Protocols/ports: **TCP 7860**.

Now `http://<VM_EXTERNAL_IP>:7860` opens the Langflow UI from your browser.

## Step 5 — Recreate the flow (this is where Connie's brain lives)

A fresh Langflow is empty. Your working flow lives only on your laptop. To recreate it:

1. In the cloud Langflow UI: **Import** → upload `langflow/connie-flow.json` from this repo.
2. **Re-apply the six prompt rules and settings that live only in a running instance** — the repo
   JSON has most, but verify against `HANDOFF.md` §4b. Specifically confirm:
   - Roster count says **three** strollers (not five).
   - The `rank_label` two-pass rule is present (multiple NOT RECOMMENDED allowed).
   - Vertex model = `gemini-2.5-flash`, **Max Output Tokens = 8192**.
3. **Set the Vertex project/region** on the Vertex nodes to your GCP project.
4. **Create a Langflow API key:** Settings → Langflow API Keys → Add New. Save it — Vercel needs it.
5. **Grab the new Flow ID** from the URL and update `FLOW_ID` in `src/api/connieClient.ts`
   (re-importing changes the ID). Commit that change.

## Step 6 — Re-ingest the CR data (Chroma does not travel)

Your vector store only exists on your laptop. On the cloud Langflow:

1. On the **Read File** node, upload `backend-data/Stroller Test Data v5.md`.
2. Confirm both Chroma nodes name the same collection (`cr_strollers_v7`).
3. **Change the Chroma `persist_directory`** from `/tmp/cr_chroma` to `/app/langflow/cr_chroma`
   (inside the mounted volume from Step 3) so the store survives a reboot. Do this on both Chroma
   nodes.
4. Run the flow once to ingest.
5. Verify:
   ```bash
   LANGFLOW_API_KEY=<cloud key> FLOW_ID=<new id> \
     node ~/Downloads/Connie/test-connie.mjs "Rank these strollers for me"
   ```
   Expect exactly three strollers, Baby Trend #1, the other two NOT RECOMMENDED.

## Step 7 — Point Vercel at it

In the `connie-live-demo` Vercel project → Settings → Environment Variables:

- `LANGFLOW_URL` = `http://<VM_EXTERNAL_IP>:7860`
- `LANGFLOW_API_KEY` = the cloud Langflow key from Step 5

Redeploy. Walk the live URL. If cards fall back to mock, use the `DEPLOY_LIVE_DEMO.md` §4
error-code table (502 = can't reach the VM, 403 = wrong key).

---

## Cost & caveats for the demo
- An `e2-medium` runs about **$25–35/month** if left on. **Stop the VM when not demoing**
  (Compute Engine → Stop) so it doesn't burn credits. Note: stopping releases the ephemeral external
  IP — reserve a **static IP** if you want the URL stable across restarts, or just update
  `LANGFLOW_URL` each time.
- Every teammate hitting the demo shares your one **Vertex per-minute rate limit** and burns your
  credits. Fine for a scheduled demo, not for open load.
- Port 7860 open to `0.0.0.0/0` means anyone with the IP can reach Langflow's API; the API key is
  the only gate. Keep the IP unlisted and rotate the key after the demo.
- The CR data is **synthetic** and attaches invented NOT RECOMMENDED verdicts to real brands. Keep
  the demo internal.

## Same-day fallback if this runs long
Since your teammates only need it **during a scheduled live demo**, you can skip the VM and expose
your laptop's Langflow with a tunnel:
```bash
# install cloudflared, then:
cloudflared tunnel --url http://localhost:7860
```
Point Vercel's `LANGFLOW_URL` at the printed `https://…trycloudflare.com` URL. Works in minutes,
but only while your laptop is on and Langflow is running.
