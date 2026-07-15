/**
 * Connie ↔ Langflow client (REST API)
 * ====================================
 * Thin typed wrapper around the Langflow run endpoint. Call `callConnie()` from a screen,
 * get back a fully typed `ConnieResponse` (discriminated on `response_type`).
 *
 * Save as: src/api/connieClient.ts
 *
 * CONNECTION: In the browser this calls the relative path `/langflow`, which the Vite dev server
 * proxies to your Langflow instance while injecting the API key server-side (see vite.config.ts).
 * That avoids CORS and keeps the key out of the browser bundle. Configure the target + key in
 * .env.local via LANGFLOW_URL / LANGFLOW_API_KEY (see .env.example) — no VITE_ prefix, so those
 * stay server-side. Override the base with VITE_LANGFLOW_URL only if you want to bypass the proxy.
 *
 * PRIORITIES: Langflow /run does not honor tweaks on the priorities TextInput in this version,
 * so we deliver priorities INSIDE the chat message as a `[User priorities: ...]` prefix. The
 * Prompt Template has a matching override rule that treats that line as onboarding priorities.
 * This uses only the top-level input_value channel, which is reliable and node-id independent.
 */

import type { ConnieResponse } from '@/types/connie-contract';

// Read Vite env without needing vite/client types wired up.
const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};

// Default to the Vite proxy path; the proxy injects the API key, so none is needed here.
const LANGFLOW_BASE_URL = env.VITE_LANGFLOW_URL ?? '/langflow';
const API_KEY = env.VITE_LANGFLOW_API_KEY; // only needed if you bypass the proxy

/**
 * Flow id. Re-importing a flow into a different Langflow instance changes this, so it's
 * configurable per environment:
 *   - Local dev (default): the flow on your laptop's Langflow.
 *   - Vercel live demo: set VITE_FLOW_ID to the CLOUD Langflow's flow id (it points at the VM).
 * Not secret — safe to bake into the browser build.
 */
const FLOW_ID = env.VITE_FLOW_ID ?? '5c8974c3-52ba-4b7e-b806-9ce2375b127a';

/** One prior turn of a conversation, as plain text. Connie's turns are SUMMARIES, not raw JSON —
 *  feeding whole payloads back in would blow up the token count and confuse classification. */
export interface ChatTurn {
  role: 'user' | 'connie';
  text: string;
}

export interface CallConnieOptions {
  /** The user's message / request. Drives which response_type Connie returns. */
  message: string;
  /** Comma-separated priorities from onboarding, e.g. "Safety, Durability". Optional. */
  priorities?: string;
  /**
   * Prior turns, oldest first. Used by the Chat screen so follow-ups resolve ("why not the cheaper
   * one?"). The agent itself is stateless — Langflow holds no memory — so history is delivered in
   * the message, exactly like priorities. Only the last few turns are sent.
   */
  history?: ChatTurn[];
  signal?: AbortSignal;
}

/** How many prior turns to send. Enough to resolve a reference, few enough to stay cheap. */
const HISTORY_TURNS = 6;

/** Prefix the message with priorities + recent history so the prompt's rules pick them up.
 *  The NEW message always comes last, so the agent classifies on that and not on the history. */
function buildInput(message: string, priorities?: string, history?: ChatTurn[]): string {
  const parts: string[] = [];

  const p = priorities?.trim();
  if (p) parts.push(`[User priorities: ${p}]`);

  const recent = (history ?? []).slice(-HISTORY_TURNS);
  if (recent.length > 0) {
    const lines = recent
      .map((t) => `${t.role === 'user' ? 'User' : 'Connie'}: ${t.text}`)
      .join('\n');
    parts.push(
      '[Conversation so far — context only. Use it to resolve references such as "it", ' +
        '"that one", or "the cheaper one". Do NOT answer these earlier turns again; ' +
        'respond only to the new message below.\n' +
        lines +
        '\n]',
    );
  }

  parts.push(message);
  return parts.join('\n\n');
}

/** Call the Connie Langflow flow and return a typed, parsed response. */
export async function callConnie(opts: CallConnieOptions): Promise<ConnieResponse> {
  const { message, priorities, history, signal } = opts;

  const res = await fetch(`${LANGFLOW_BASE_URL}/api/v1/run/${FLOW_ID}?stream=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    },
    body: JSON.stringify({
      input_value: buildInput(message, priorities, history),
      input_type: 'chat',
      output_type: 'chat',
    }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Langflow ${res.status} ${res.statusText}: ${await res.text().catch(() => '')}`);
  }

  const payload: unknown = await res.json();
  const raw = extractMessageText(payload);
  return parseConnieResponse(raw);
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Session cache
 * ────────────────────────────────────────────────────────────────────────── *
 * Screens fetch on mount, but React unmounts them on navigation — so leaving Product Insights and
 * coming back used to re-run the whole analysis. That is slow, and it re-spends Vertex quota on an
 * answer we already had.
 *
 * This cache lives at module scope, so it outlives any component and survives route changes. It is
 * keyed on the exact request (priorities + message), which means changing preferences correctly
 * produces a new key and a genuine refetch. It is in-memory only: a hard reload clears it, which is
 * the behaviour you want for a demo.
 *
 * In-flight requests are cached too, so two components mounting at once share one network call
 * rather than racing (this also absorbs React StrictMode's double-invoke).
 *
 * Failures are NOT cached — the entry is dropped so a retry can succeed after, say, a 429.
 *
 * Chat deliberately does not use this: the same question asked twice should get a fresh answer.
 */

const inFlight = new Map<string, Promise<ConnieResponse>>();
const resolved = new Map<string, ConnieResponse>();

// History is part of the key: the same question after a different conversation is a different
// question. (Chat doesn't use the cache anyway, but a stale hit here would be a nasty bug.)
const cacheKey = (o: CallConnieOptions) =>
  `${o.priorities?.trim() ?? ''}::${(o.history ?? []).map((t) => `${t.role}:${t.text}`).join('|')}::${o.message}`;

/** Already-resolved response for this exact request, or null. Synchronous — safe in render/init. */
export function peekConnieCache(opts: CallConnieOptions): ConnieResponse | null {
  return resolved.get(cacheKey(opts)) ?? null;
}

/** Like `callConnie`, but returns the cached response (or the in-flight promise) when we've
 *  already asked this exact question with these exact priorities. */
export function callConnieCached(opts: CallConnieOptions): Promise<ConnieResponse> {
  const key = cacheKey(opts);

  const done = resolved.get(key);
  if (done) return Promise.resolve(done);

  const pending = inFlight.get(key);
  if (pending) return pending;

  const p = callConnie(opts)
    .then((r) => {
      resolved.set(key, r);
      inFlight.delete(key);
      return r;
    })
    .catch((err) => {
      inFlight.delete(key); // don't cache failures — a 429 should be retryable
      throw err;
    });

  inFlight.set(key, p);
  return p;
}

/** Drop everything — e.g. if you add a "re-analyze" affordance. */
export function clearConnieCache(): void {
  inFlight.clear();
  resolved.clear();
}

/**
 * Dig the ChatOutput message text out of Langflow's nested run response.
 * The exact path shifts slightly between Langflow versions, so try the known shapes.
 * If this throws, log `payload` once and adjust the path for your version.
 */
function extractMessageText(payload: unknown): string {
  const p = payload as any;
  const out = p?.outputs?.[0]?.outputs?.[0];
  const candidate =
    out?.results?.message?.text ??
    out?.results?.message?.data?.text ??
    out?.outputs?.message?.message ??
    out?.artifacts?.message ??
    out?.messages?.[0]?.message;

  if (typeof candidate !== 'string') {
    throw new Error(
      'Could not locate message text in Langflow response. Raw payload: ' +
        JSON.stringify(payload).slice(0, 600),
    );
  }
  return candidate;
}

/**
 * Parse Connie's text into a typed ConnieResponse.
 * The prompt tells the agent to return pure JSON, but we strip stray ```json fences defensively.
 */
export function parseConnieResponse(raw: string): ConnieResponse {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let obj: unknown;
  try {
    obj = JSON.parse(cleaned);
  } catch {
    throw new Error('Connie did not return valid JSON: ' + cleaned.slice(0, 400));
  }

  if (!obj || typeof obj !== 'object' || !('response_type' in obj)) {
    throw new Error('Connie JSON missing response_type: ' + cleaned.slice(0, 400));
  }
  return obj as ConnieResponse;
}
