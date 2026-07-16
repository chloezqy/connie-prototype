/**
 * Shared Connie request messages
 * ==============================
 * The demo warm (`prefetch.ts`) and the screens must send the BYTE-IDENTICAL message for a given
 * call, or their cache keys won't match and the screen re-fetches instead of using the warmed
 * result. Anything sent from more than one place lives here so there's a single source of truth.
 */

import { ABOUT_BULLETS } from '@/components/retail/AmazonProductPage';

/** The inline-annotations request. Sends the page's actual bold marketing claims so the agent
 *  verifies them instead of asking us to provide them. The fold claim is the one CR contradicts. */
export const ANNOTATION_REQUEST_MESSAGE =
  'Verify these marketing claims from the Baby Trend Passport Switch 6-in-1 Amazon product ' +
  'page. For each claim, reconcile it against Consumer Reports lab data and community feedback, ' +
  'and return an inline_annotations response (one entry per claim). Flag any claim that the CR ' +
  'lab data contradicts as "misleading". For every misleading claim, include TWO evidence ' +
  'items: the Consumer Reports lab finding first, then a real community or owner quote (Reddit ' +
  'or a parenting forum) that echoes it, so the shopper sees both the lab data and social ' +
  'proof.\n\nClaims:\n' +
  ABOUT_BULLETS.map((b, i) => `${i + 1}. "${b.lead} ${b.rest}"`).join('\n');
