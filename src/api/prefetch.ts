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

/** Space calls out so we don't trip the ~15 req/min Vertex limit. */
const STAGGER_MS = 4000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Warm the cache for a demo. `priorities` should be the same string the screens will send
 * (from `preferencesToPriorities`) so the keys match. Best-effort: failures are swallowed, since a
 * miss just means the screen fetches normally.
 *
 * Ordered by when you'll hit each screen in the demo, most important first.
 */
export async function warmConnieForDemo(priorities?: string): Promise<void> {
  const p = priorities || undefined;

  const queue: CallConnieOptions[] = [
    // Product Insights first — all three cards on that one screen, so the NOT RECOMMENDED cards
    // (which fetch lazily on click and otherwise make you wait live) are warm by the time you open
    // them, exactly like the recommended card.
    { message: 'What are the key insights on the Baby Trend Passport Switch 6-in-1?', priorities: p }, // recommended (green)
    { message: 'What are the key insights on the Dream On Me Aero Travel Umbrella Stroller?', priorities: p }, // not-rec (left grey)
    { message: 'What are the key insights on the Graco Ready2Grow 2.0 Double Stroller?', priorities: p }, // not-rec (right grey)
    // Then the other screens, in demo order.
    { message: 'Verify the marketing claims on this Baby Trend Passport Switch 6-in-1 product page.' }, // annotations
    { message: 'Rank these strollers for me', priorities: p }, // decision support
  ];

  for (let i = 0; i < queue.length; i++) {
    // Fire and forget — callConnieCached stores the result in the module-level cache on success.
    callConnieCached(queue[i]).catch(() => {
      /* best-effort warm; the screen will retry on its own if this missed */
    });
    if (i < queue.length - 1) await sleep(STAGGER_MS);
  }
}
