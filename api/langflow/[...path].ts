/**
 * Production proxy for Langflow  (Vercel serverless function)
 * ===========================================================
 * This is the deployed-environment replacement for the Vite dev proxy in `vite.config.ts`.
 *
 * In `npm run dev`, Vite forwards `/langflow/*` to your Langflow instance and injects the API key
 * server-side. That proxy does NOT exist in a production build — a static site has no dev server —
 * so a deployed frontend calling `/langflow/...` would hit nothing and would have no safe place to
 * add the key. This function restores both behaviours:
 *
 *   browser → /langflow/api/v1/run/<flow>   (relative path, no key)
 *           → Vercel rewrite → /api/langflow/api/v1/run/<flow>   (see vercel.json)
 *           → this function → <LANGFLOW_URL>/api/v1/run/<flow>   (+ x-api-key header)
 *
 * The key lives ONLY in the Vercel env var `LANGFLOW_API_KEY` and never reaches the browser bundle.
 *
 * Required Vercel environment variables (Project → Settings → Environment Variables):
 *   LANGFLOW_URL       e.g. https://your-langflow-host.up.railway.app   (no trailing slash)
 *   LANGFLOW_API_KEY   the key for that Langflow instance
 *
 * Note: these have NO `VITE_` prefix on purpose — that keeps them server-side only.
 */

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  const LANGFLOW_URL = process.env.LANGFLOW_URL;
  const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY;

  if (!LANGFLOW_URL) {
    res.status(500).json({ error: 'LANGFLOW_URL is not configured on the server.' });
    return;
  }

  // Strip the /api/langflow prefix to recover the real Langflow path (+ query string).
  // e.g. /api/langflow/api/v1/run/<flow>?stream=false  ->  /api/v1/run/<flow>?stream=false
  const incoming: string = req.url || '';
  const downstreamPath = incoming.replace(/^\/api\/langflow/, '') || '/';
  const target = `${LANGFLOW_URL.replace(/\/$/, '')}${downstreamPath}`;

  // Re-serialize the body for non-GET requests. Vercel's Node runtime parses JSON into req.body.
  let body: string | undefined;
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    body =
      typeof req.body === 'string'
        ? req.body
        : req.body
          ? JSON.stringify(req.body)
          : undefined;
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(LANGFLOW_API_KEY ? { 'x-api-key': LANGFLOW_API_KEY } : {}),
      },
      body,
    });

    // Pass the response straight back through (status + body). Langflow returns JSON.
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    res.send(text);
  } catch (err) {
    res.status(502).json({
      error: 'Failed to reach Langflow.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
