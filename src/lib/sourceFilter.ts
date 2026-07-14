import type { Evidence } from '@/types/connie-contract'

/**
 * Direct Consumer Reports competitors — independent product testing / review authorities.
 * Their content is excluded from Connie's evidence so a CR-branded tool never cites a competitor.
 * Match is a case-insensitive substring against the source name + URL. Extend as needed.
 */
const COMPETITOR_PATTERNS = [
  'wirecutter',
  'babygearlab',
  'reviewed.com',
  'goodhousekeeping',
  'good housekeeping',
  'bestreviews',
  'consumersearch',
  'rtings',
]

export function isCompetitorSource(e: { source_name?: string; source_url?: string | null }): boolean {
  const hay = `${e.source_name ?? ''} ${e.source_url ?? ''}`.toLowerCase()
  return COMPETITOR_PATTERNS.some((p) => hay.includes(p))
}

/**
 * YouTube, detected by content rather than by `source_type`.
 *
 * The agent routinely returns YouTube evidence tagged `source_type: "web"` — e.g.
 * `{ source_type: "web", source_name: "Simply Cherished Life (YouTube)",
 *    source_url: "https://www.youtube.com/watch?v=…" }`.
 * Checking `source_type !== 'youtube'` alone therefore lets it through. The prompt's SOURCING
 * INTEGRITY rule has the same blind spot, which is why this filter, not the prompt, is the
 * enforcement point.
 */
const YOUTUBE_PATTERNS = ['youtube.com', 'youtu.be', 'youtube', 'yt.be']

export function isYouTubeSource(e: {
  source_type?: string
  source_name?: string
  source_url?: string | null
}): boolean {
  if (e.source_type === 'youtube') return true
  const hay = `${e.source_name ?? ''} ${e.source_url ?? ''}`.toLowerCase()
  return YOUTUBE_PATTERNS.some((p) => hay.includes(p))
}

/**
 * Clean an evidence list for display: drop YouTube (not a real retrieval source, and the claim
 * chain that produced it was deleted from the flow for fabricating citations) and any
 * direct-competitor sources. Use everywhere evidence is rendered so the rules are consistent.
 */
export function cleanEvidence(evidence: Evidence[]): Evidence[] {
  return evidence.filter((e) => !isYouTubeSource(e) && !isCompetitorSource(e))
}
