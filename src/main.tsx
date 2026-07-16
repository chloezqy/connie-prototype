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
// it never fires during normal dev and spends quota unexpectedly.
//
// IMPORTANT: the screens send the user's onboarding PRIORITIES with each request, and priorities
// change while the user is still in onboarding. If we warmed once at page load (empty priorities),
// the cards would then request with the chosen priorities, miss that cache, and cold-fetch anyway.
// So instead we warm 3s AFTER the priorities stop changing — i.e. once onboarding has settled — and
// re-warm if they change again. `warmConnieForDemo` uses the cache, so already-warmed keys are free;
// only the newly-relevant priority set actually spends calls. `lastKey` prevents warming the same
// priority set twice.
const wantsWarm =
  new URLSearchParams(window.location.search).has('warm') ||
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_PREWARM === '1'
if (wantsWarm) {
  let timer: number | undefined
  let lastKey: string | null = null
  const scheduleWarm = () => {
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      const key = preferencesToPriorities(usePreferences.getState().preferences)
      if (key === lastKey) return // this exact priority set is already warmed
      lastKey = key
      void warmConnieForDemo(key || undefined)
    }, 3000)
  }
  scheduleWarm() // fires 3s after load if the user never touches preferences
  usePreferences.subscribe(scheduleWarm) // and re-schedules each time a preference is toggled
}
