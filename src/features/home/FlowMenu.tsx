import { Link } from 'react-router-dom'
import { routes } from '@/app/routes'
import { IconFeather } from '@/components/icons'

const groups: { title: string; items: { label: string; to: string }[] }[] = [
  {
    title: 'Install & Onboarding',
    items: [
      { label: 'N0 · Chrome Web Store', to: routes.install },
      { label: 'New tab (pre-install)', to: routes.search },
      { label: 'N1 · Welcome', to: routes.welcome },
      { label: 'N2 · Member check', to: routes.memberCheck },
      { label: 'M1 · Log in', to: routes.login },
      { label: 'N3 · Promise', to: routes.promise },
      { label: 'N4a · Communities', to: routes.surveyCommunities },
      { label: 'N4b · Priorities', to: routes.surveyPriorities },
      { label: 'N5 · Permissions', to: routes.permissions },
      { label: 'N6 · Done', to: routes.done },
    ],
  },
  {
    title: 'Search & Browse',
    items: [
      { label: 'New tab (onboarded)', to: `${routes.search}?ready=1` },
      { label: 'Google results', to: routes.results },
      { label: 'Amazon · first tooltip', to: routes.tour },
      { label: 'Product Insights', to: routes.insights },
      { label: 'Inline Annotations', to: routes.annotations },
    ],
  },
  {
    title: 'Decide & Share',
    items: [
      { label: 'Preference Inference', to: routes.priorities },
      { label: 'Decision Support', to: routes.decision },
      { label: 'Share a list', to: routes.collaborate },
      { label: 'Shared list', to: `${routes.collaborate}?stage=shared` },
      { label: 'Post-Purchase', to: routes.postPurchase },
      { label: 'Connie Chat', to: routes.chat },
    ],
  },
  { title: 'Reference', items: [{ label: 'Design System', to: routes.ds }] },
]

export function FlowMenu() {
  return (
    <div className="min-h-screen bg-bg-secondary px-300 py-600">
      <div className="mx-auto max-w-3xl">
        <div className="mb-400 flex items-center gap-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-pill bg-brand text-fg-inverse">
            <IconFeather size={24} />
          </span>
          <div>
            <h1 className="text-h2 font-semibold text-fg-primary">Connie</h1>
            <p className="text-utility text-fg-secondary">Consumer Reports shopping assistant — prototype</p>
          </div>
        </div>

        <Link
          to={routes.install}
          className="mb-400 block rounded-lg bg-brand px-300 py-200 text-body font-medium text-fg-inverse"
        >
          ▶ Start the full flow
        </Link>

        <div className="space-y-400">
          {groups.map((g) => (
            <section key={g.title}>
              <h2 className="mb-100 text-utility font-semibold uppercase tracking-wide text-fg-secondary">
                {g.title}
              </h2>
              <div className="grid grid-cols-2 gap-100 sm:grid-cols-3">
                {g.items.map((it) => (
                  <Link
                    key={it.to}
                    to={it.to}
                    className="rounded-sm border border-border-subtle bg-bg-primary px-200 py-100 text-body text-fg-primary transition-colors hover:border-border-brand hover:bg-bg-secondary"
                  >
                    {it.label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
