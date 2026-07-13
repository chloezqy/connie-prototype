import { create } from 'zustand'

/**
 * The shopper's selected shopping preferences (from onboarding survey N4b).
 * These drive the live personalization: passed into callConnie() for Decision Support and
 * Product Insights, and shown in the "BASED ON · Preferences" popover.
 */
const DEFAULT_PREFERENCES = ['Long-term reliability', 'Ease of use']
/**
 * Communities connected during onboarding (N4a) — pre-selected to match the design, the same way
 * the two default preferences are. Deselecting or adding any community in onboarding is respected
 * everywhere (Sources popover, insight cards, annotations).
 * Consumer Reports is always implicit and shown separately.
 */
const DEFAULT_SOURCES = ['Instagram', 'Reddit']

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
