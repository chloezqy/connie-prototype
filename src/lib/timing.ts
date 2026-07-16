/**
 * Every Connie "thinking / generating / verifying" animation runs for the same beat, so the
 * product reads as one system rather than a set of screens with their own tempo.
 *
 * Where a real backend call is involved this is a FLOOR, not the resolve condition — the shimmer
 * still holds until the fetch settles (see `MAX_LOADING_MS` for the hung-backend ceiling).
 */
export const LOADING_MS = 5000

/** Ceiling for a hung backend, so a shimmer can never trap the user permanently. */
export const MAX_LOADING_MS = 45000
