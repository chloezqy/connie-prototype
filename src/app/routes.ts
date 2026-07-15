/** Typed route constants + prototype flow order for the clickthrough. */
export const routes = {
  install: '/onboarding/install',
  search: '/onboarding/search',
  results: '/onboarding/results',
  welcome: '/onboarding/welcome',
  memberCheck: '/onboarding/member-check',
  login: '/onboarding/login',
  signup: '/onboarding/signup',
  promise: '/onboarding/promise',
  surveyCommunities: '/onboarding/survey/communities',
  surveyPriorities: '/onboarding/survey/priorities',
  permissions: '/onboarding/permissions',
  done: '/onboarding/done',

  /** The Amazon page she lands on from Google — Connie's first tooltip lives here. */
  tour: '/browse/tour',
  insights: '/browse/insights',
  annotations: '/browse/annotations',
  priorities: '/browse/priorities',
  decision: '/browse/decision',
  collaborate: '/browse/collaborate',
  postPurchase: '/browse/post-purchase',
  chat: '/browse/chat',

  ds: '/ds',
} as const

/**
 * The prototype's story, in order.
 *
 * Install from the Web Store → open a new tab → click the toolbar icon → onboard → back to the
 * new tab (now with the "C") → search → Google results → the Amazon page (Connie's first tooltip)
 * → insights → the product page → chat → ranking → share → the post-purchase check-in.
 *
 * `search` appears once here but is visited twice: before onboarding (no launcher) and after
 * (`?ready=1`, launcher shown).
 */
export const flowOrder: string[] = [
  routes.install,
  routes.search,
  routes.welcome,
  routes.memberCheck,
  routes.login,
  routes.signup,
  routes.promise,
  routes.surveyCommunities,
  routes.surveyPriorities,
  routes.permissions,
  routes.done,
  routes.results,
  routes.tour,
  routes.insights,
  routes.annotations,
  routes.priorities,
  routes.decision,
  routes.collaborate,
  routes.postPurchase,
  routes.chat,
]

export function nextRoute(current: string): string | null {
  const i = flowOrder.indexOf(current)
  if (i === -1 || i === flowOrder.length - 1) return null
  return flowOrder[i + 1]
}
