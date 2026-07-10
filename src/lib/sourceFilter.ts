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
 * Clean an evidence list for display: drop `youtube` (not a real retrieval source) and any
 * direct-competitor sources. Use everywhere evidence is rendered so the rules are consistent.
 */
export function cleanEvidence(evidence: Evidence[]): Evidence[] {
  return evidence.filter((e) => e.source_type !== 'youtube' && !isCompetitorSource(e))
}
