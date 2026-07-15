import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { warmConnieForDemo } from './api/prefetch'
import { usePreferences, preferencesToPriorities } from './store/usePreferences'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

// Pre-warm the heavy Connie calls in the background while the user is on the intro/onboarding
// screens, so the demo screens are instant when reached. Opt-in via ?warm=1 (or VITE_PREWARM), so
// it never fires during normal dev and spend quota unexpectedly.
const wantsWarm =
  new URLSearchParams(window.location.search).has('warm') ||
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_PREWARM === '1'
if (wantsWarm) {
  const priorities = preferencesToPriorities(usePreferences.getState().preferences)
  // Defer so it never competes with first paint.
  setTimeout(() => void warmConnieForDemo(priorities || undefined), 1500)
}
