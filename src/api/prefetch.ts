/**
 * Demo pre-warm
 * =============
 * Fires the heavy Connie calls in the background as soon as the app loads, so that by the time you
 * navigate to Product Insights / Annotations / Decision Support during a demo, the answers are
 * already in the session cache and the screens render instantly.
 *
 * WHY THIS EXISTS: a `product_insights` call is ~20s (tool-calling loop + live web searches + a big
 * JSON generation). That's fine to pay once, up front, while the presenter is still on the
 * onboarding screens — but painful to pay live in front of an audience.
 *
 * The messages/priorities below MUST match what the screens send, or the cache keys won't line up
 * and the screen will fetch again. If you change a product name in `productInsights/screens.tsx`
 * or the annotation prompt, change it here too. (Kept as literals rather than imported to avoid
 * pulling screen components into the app-load path.)
 *
 * Calls are spaced out (`STAGGER_MS`) to stay under the Vertex per-minute rate limit — firing them
 * all at once is exactly what trips a 429.
 */

import { callConnieCached, type CallConnieOptions } from './connieClient';
import { ANNOTATION_REQUEST_MESSAGE } from './connieRequests';

/** Gap between warm calls AFTER each finishes, to let the per-minute Vertex quota recover.
 *  Each product_insights call makes several Vertex calls internally, so on a low student-tier
 *  per-minute quota, back-to-back warm calls still trip a 429 even when run sequentially. A longer
 *  gap spaces the Vertex usage out across the per-minute window. Slower to finish warming, but it
 *  actually completes instead of throttling the later (not-recommended) cards. */
const GAP_MS = 10000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Warm the cache for a demo. `priorities` should be the same string the screens will send
 * (from `preferencesToPriorities`) so the keys match. Best-effort: failures are swallowed, since a
 * miss just means the screen fetches normally.
 *
 * SEQUENTIAL, on purpose. Each `product_insights` call internally makes several Vertex calls (the
 * tool-calling loop), so firing the whole queue at once bursts far past a student-account
 * per-minute quota and trips a 429 "Resource exhausted". Awaiting each call means only ONE heavy
 * request is ever in flight, which keeps us under quota. The trade-off is that warming everything
 * takes a few minutes — fine, because it runs in the background while you're on the onboarding
 * screens, and the demo-critical calls are ordered first.
 */
export async function warmConnieForDemo(priorities?: string): Promise<void> {
  const p = priorities || undefined;

  const queue: CallConnieOptions[] = [
    // Product Insights first — all three cards on that one screen. The NOT RECOMMENDED cards fetch
    // lazily on click, so warming them here is what makes them open instantly instead of live.
    { message: 'What are the key insights on the Baby Trend Passport Switch 6-in-1?', priorities: p }, // recommended (green)
    { message: 'What are the key insights on the Dream On Me Aero Travel Umbrella Stroller?', priorities: p }, // not-rec (left grey)
    { message: 'What are the key insights on the Graco Ready2Grow 2.0 Double Stroller?', priorities: p }, // not-rec (right grey)
    // Inline annotations — same message the annotations screen sends (shared constant), so the
    // cache key matches and the screen opens warm.
    { message: ANNOTATION_REQUEST_MESSAGE }, // annotations
    // Decision Support ranking.
    { message: 'Rank these strollers for me', priorities: p }, // decision support
  ];

  console.info('%c[Connie] Warming demo… (open Product Insights only once this says "ready")', 'color:#7a9');
  for (let i = 0; i < queue.length; i++) {
    // AWAIT each — one heavy call at a time, so we never pile up concurrent Vertex requests.
    try {
      await callConnieCached(queue[i]);
      console.info(`%c[Connie] warmed ${i + 1}/${queue.length}`, 'color:#7a9');
    } catch {
      /* best-effort; the screen will fetch on its own if this one missed (e.g. a transient 429) */
    }
    await sleep(GAP_MS); // brief breather so the per-minute quota can recover before the next
  }
  console.info('%c[Connie] Warm complete — cards are ready, open away.', 'color:#3a7; font-weight:bold');
}
