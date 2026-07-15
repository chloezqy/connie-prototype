import { create } from 'zustand'

/**
 * The shopper's selected shopping preferences (from onboarding survey N4b).
 * These drive the live personalization: passed into callConnie() for Decision Support and
 * Product Insights, and shown in the "BASED ON · Preferences" popover.
 */
/**
 * Deliberately EMPTY, for the same reason as DEFAULT_SOURCES below: what you care about when
 * shopping is the shopper's answer to give, not ours to assume. Nothing is pre-selected in N4b.
 * Downstream (Decision Support, Product Insights) already treats "no priorities" as unset rather
 * than as a filter, so an untouched survey personalizes nothing rather than personalizing wrongly.
 */
const DEFAULT_PREFERENCES: string[] = []
/**
 * Communities connected during onboarding (N4a). Deliberately EMPTY: which communities you trust
 * is the shopper's answer to give, not ours to assume — nothing is pre-selected, and N4a's Next
 * button stays disabled until at least one is picked.
 *
 * Whatever is picked here is respected everywhere (Sources popover, insight cards, annotations).
 * Consumer Reports is always implicit and shown separately.
 */
const DEFAULT_SOURCES: string[] = []

/** Everything offered in onboarding — also used by the editable "BASED ON" popover. */
export const ALL_PREFERENCES = [
  'Long-term reliability',
  'Value for price',
  'Ease of use',
  'Sustainability',
]
export const ALL_COMMUNITIES = [
  'Instagram',
  'Reddit',
  'YouTube',
  'Tiktok',
  'Pinterest',
  'Online blogs',
  'Review sites',
]

interface PreferencesState {
  preferences: string[]
  sources: string[]
  setPreferences: (p: string[]) => void
  togglePreference: (label: string) => void
  setSources: (s: string[]) => void
  toggleSource: (label: string) => void
}

export const usePreferences = create<PreferencesState>((set) => ({
  preferences: DEFAULT_PREFERENCES,
  sources: DEFAULT_SOURCES,
  setPreferences: (p) => set({ preferences: p }),
  togglePreference: (label) =>
    set((s) => ({
      preferences: s.preferences.includes(label)
        ? s.preferences.filter((x) => x !== label)
        : [...s.preferences, label],
    })),
  setSources: (s) => set({ sources: s }),
  toggleSource: (label) =>
    set((st) => ({
      sources: st.sources.includes(label)
        ? st.sources.filter((x) => x !== label)
        : [...st.sources, label],
    })),
}))

/** Comma-separated preferences for callConnie({ priorities }). Empty string if none selected. */
export function preferencesToPriorities(preferences: string[]): string {
  return preferences.join(', ')
}
