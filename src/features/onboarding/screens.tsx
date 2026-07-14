import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { BrowserChrome, CHROME_H, GoogleFavicon } from '@/components/browser/BrowserChrome'
import { GoogleNewTab } from '@/components/browser/GoogleNewTab'
import { GoogleResults } from '@/components/browser/GoogleResults'
import { ConnieHeader } from '@/components/connie/ConnieHeader'
import { NaviRail } from '@/components/connie/NaviRail'
import {
  IconCheck,
  IconInfo,
  IconStar,
  IconShare,
  IconCaretLeft,
  IconCaretRight,
  IconShieldCheck,
  IconTag,
  IconSparkle,
  IconHandTap,
  IconLeaf,
} from '@/components/icons'
import { routes } from '@/app/routes'
import { useJourneyStore } from '@/store/useJourneyStore'
import { usePreferences } from '@/store/usePreferences'

/* ---------- Onboarding asset paths (public/figma) ---------- */
const asset = {
  promiseNoSponsors: '/figma/promise-no-sponsors.svg',
  promiseLock: '/figma/promise-lock.svg',
  promiseFlask: '/figma/promise-flask.svg',
  commInstagram: '/figma/comm-instagram.png',
  commReddit: '/figma/comm-reddit.svg',
  commYoutube: '/figma/comm-youtube.svg',
  commTiktok: '/figma/comm-tiktok.svg',
  commPinterest: '/figma/comm-pinterest.svg',
  commGoogle: '/figma/comm-google.svg',
  permReader: '/figma/perm-reader.svg',
  permNote: '/figma/perm-note.svg',
  permBlock: '/figma/perm-block.svg',
  installHero: '/figma/install-hero-mockup.png',
  installCrLogo: '/figma/install-cr-logo.png',
  installSoftStar: '/figma/install-softstar.svg',
  installSealCheck: '/figma/install-sealcheck.svg',
  installMedal: '/figma/install-medal.svg',
}

/** The query the shopper runs once onboarding is done. */
const SEARCH_QUERY = 'best stroller 2026'

/* ---------- Shared onboarding primitives ---------- */

/**
 * The Connie extension popup. It hangs off the extension icon in the browser toolbar (hence the
 * caret), and carries the shared Connie header — the same one every other Connie panel wears.
 */
function Panel({
  gap,
  center = false,
  style,
  onClose,
  children,
}: {
  gap: number
  center?: boolean
  style?: CSSProperties
  onClose: () => void
  children: ReactNode
}) {
  return (
    <>
      {/* Caret pointing up at the toolbar's Connie icon. */}
      <div
        className="absolute z-10"
        style={{
          left: 1351,
          top: CHROME_H - 1,
          width: 0,
          height: 0,
          borderLeft: '9px solid transparent',
          borderRight: '9px solid transparent',
          borderBottom: '9px solid var(--color-bg-secondary)',
        }}
      />
      <div
        className={`absolute flex flex-col overflow-y-auto rounded-md border border-border-subtle bg-bg-secondary p-[28px] shadow-panel ${
          center ? 'items-center' : 'items-start'
        }`}
        style={{ left: 864, top: CHROME_H + 8, width: 520, maxHeight: 900 - CHROME_H - 24, gap, ...style }}
      >
        <ConnieHeader onClose={onClose} />
        {children}
      </div>
    </>
  )
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-[48px] w-full shrink-0 items-center justify-center rounded-pill text-body font-semibold text-fg-inverse ${
        disabled ? 'bg-bg-disabled' : 'bg-brand'
      }`}
    >
      {children}
    </button>
  )
}

function OutlineButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-[48px] w-full items-center justify-center rounded-pill border border-border-black bg-bg-primary text-body font-semibold text-fg-primary"
    >
      {children}
    </button>
  )
}

/** The browser tabs shown across the onboarding + search screens. */
const TABS = (activeTitle: string) => [
  { title: 'Baby registry checklist', favicon: <GoogleFavicon size={14} /> },
  { title: activeTitle, active: true },
  { title: 'Inbox (3)', favicon: <GoogleFavicon size={14} /> },
]

/* ---------- N0 · Chrome Web Store install ---------- */
export function InstallScreen() {
  const navigate = useNavigate()
  const setInstalled = useJourneyStore((s) => s.setInstalled)
  const install = () => {
    setInstalled(true)
    navigate(routes.search)
  }
  const metaText = 'font-medium text-[16.337px]'
  return (
    <FigmaFrame>
      {/* Navigation bar — approximated Chrome Web Store chrome */}
      <div className="absolute left-0 top-0 flex h-[106px] w-[1440px] items-center border-b border-[#ececec] bg-white">
        <div className="flex items-center gap-[10px] pl-[20px]">
          <span
            className="inline-block size-[26px] rounded-full"
            style={{
              background:
                'conic-gradient(#ea4335 0 25%, #4285f4 25% 50%, #34a853 50% 75%, #fbbc05 75% 100%)',
            }}
          />
          <span className="text-[15px] text-[#5f6368]">chrome web store</span>
        </div>
        <div className="mx-auto flex h-[42px] w-[520px] items-center gap-[10px] rounded-full bg-[#f1f3f4] px-[18px] text-[#5f6368]">
          <span className="text-[15px]">🔍</span>
          <span className="text-[14px]">Search extensions and themes</span>
        </div>
        <div className="flex items-center gap-[16px] pr-[24px] text-[#5f6368]">
          <span className="text-[18px]">⋮</span>
          <span className="text-[16px]">▦</span>
          <span className="inline-block size-[26px] rounded-full bg-[#cfcfcf]" />
        </div>
      </div>

      {/* Header */}
      <div className="absolute flex flex-col gap-[26px]" style={{ left: 209, top: 116, width: 1021 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[15px]">
            <div className="relative size-[58px] rounded-[10px] bg-[#c4e860]">
              <span className="absolute left-[10.66px] top-[1px] font-serif text-[47.637px] font-bold leading-none text-[#16120f]">
                C
              </span>
              <img
                alt=""
                src={asset.installSoftStar}
                className="absolute left-[9px] top-[11.35px] size-[14.286px]"
              />
            </div>
            <p className="text-[29.788px] font-bold text-black">
              Connie: Consumer Reports AI Shopping Assistant
            </p>
          </div>
          <button
            onClick={install}
            className="flex h-[37px] w-[142px] items-center justify-center rounded-full bg-[#6699f2] text-[13.254px] font-medium text-white"
          >
            Add to Chrome
          </button>
        </div>

        <div className="flex items-center gap-[19px]">
          <div className="flex items-center gap-[3px]">
            <img alt="" src={asset.installSealCheck} className="size-[21px]" />
            <span className={`${metaText} text-[#0e4dca]`}>http://consumerreports.org/</span>
          </div>
          <div className="flex items-center gap-[6px]">
            <img alt="" src={asset.installMedal} className="size-[19px]" />
            <span className={`${metaText} text-[#146129]`}>Featured</span>
          </div>
          <div className="flex items-center gap-[4px]">
            <span className={`${metaText} text-[#1d1d1d]`}>4.9</span>
            <IconStar size={16} className="text-[#f6b01e]" />
            <span className="text-[16.337px] text-[#1d1d1d]">
              (<span className="text-[#296be5]">3.4K ratings</span>)
            </span>
            <IconInfo size={19} className="text-[#5f6368]" />
          </div>
          <div className="flex items-center gap-[7px]">
            <IconShare size={17} className="text-[#0e4dca]" />
            <span className="text-[16.337px] text-[#0e4dca]">Share</span>
          </div>
        </div>

        <div className="flex items-center gap-[9px]">
          <div className="flex h-[35px] w-[81px] items-center rounded-[8px] bg-[#eef2f8] pl-[11px] text-[13.576px] text-[#333334]">
            Extension
          </div>
          <div className="flex h-[35px] w-[81px] items-center rounded-[8px] bg-[#eef2f8] pl-[11px] text-[13.576px] text-[#333334]">
            Shopping
          </div>
          <span className="text-[13.576px] text-[#333334]">10,000 users</span>
        </div>
      </div>

      {/* Hero gallery */}
      <div className="absolute" style={{ left: 76, top: 326, width: 1296, height: 353 }}>
        <div
          className="absolute top-0 rounded-[7px] bg-[#c4e860] shadow-[0px_0px_5px_1px_rgba(0,0,0,0.25)]"
          style={{ left: 57, width: 564, height: 353 }}
        >
          <div className="relative h-full">
            <img
              alt=""
              src={asset.installSoftStar}
              className="absolute left-[108.28px] top-[98.13px] size-[29.045px]"
            />
            <p className="absolute left-[111.65px] top-[77.09px] font-serif text-[96.848px] font-bold leading-none text-[#16120f]">
              Connie
            </p>
            <p className="absolute left-[151px] top-[182px] text-[26.336px] font-light text-[#16120f]">
              Shop with confidence.
            </p>
            <p className="absolute right-[305px] top-[248.09px] text-right text-[9.471px] text-[#16120f]">
              Built &amp; backed by
            </p>
            <img
              alt=""
              src={asset.installCrLogo}
              className="absolute left-[268.42px] top-[241px] h-[28.592px] w-[112.127px] object-contain"
            />
          </div>
        </div>
        <img
          alt=""
          src={asset.installHero}
          className="absolute top-0 rounded-[7px] object-cover shadow-[0px_0px_5px_1px_rgba(0,0,0,0.25)]"
          style={{ left: 665, width: 564, height: 353 }}
        />
        <IconCaretLeft size={24} className="absolute left-[12px] top-[170px] text-[#5f6368]" />
        <IconCaretRight size={24} className="absolute left-[1251px] top-[170px] text-[#5f6368]" />
      </div>

      {/* Thumbnail strip */}
      <div className="absolute flex items-center gap-[16px]" style={{ left: 446, top: 716 }}>
        <div className="relative h-[49px] w-[78px] rounded-[6px] border-2 border-[#0e4dca] bg-[#c4e860]">
          <span className="absolute left-[14.49px] top-[11px] font-serif text-[14.014px] font-bold text-[#16120f]">
            Connie
          </span>
        </div>
        <img alt="" src={asset.installHero} className="h-[49px] w-[78px] rounded-[6px] object-cover" />
        <div className="h-[49px] w-[78px] rounded-[6px] bg-[#ececec]" />
        <div className="h-[49px] w-[78px] rounded-[6px] bg-[#ececec]" />
        <div className="h-[49px] w-[78px] rounded-[6px] bg-[#ececec]" />
        <div className="h-[49px] w-[78px] rounded-[6px] bg-[#ececec]" />
      </div>

      <p className="absolute left-[209px] top-[827px] text-[26.307px] font-bold text-black">Overview</p>
    </FigmaFrame>
  )
}

/* ---------- The new tab · the shopper's home base ----------
 * Before onboarding: no "C" on the page — the extension only exists as a toolbar icon, and
 * clicking it is what opens onboarding. After onboarding (`?ready=1`, set by the Done screen)
 * the "C" launcher appears, and the shopper runs their first search. */
export function SearchScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const onboarded = useJourneyStore((s) => s.onboardingComplete) || params.get('ready') === '1'
  const [query, setQuery] = useState(onboarded ? SEARCH_QUERY : '')

  const search = () => navigate(`${routes.results}?q=${encodeURIComponent(query)}`)

  return (
    <FigmaFrame>
      <BrowserChrome
        tabs={TABS('New Tab')}
        onExtensionClick={() => navigate(routes.welcome)}
        highlightExtension={!onboarded}
      />
      <GoogleNewTab
        query={query}
        onQuery={setQuery}
        onSearch={search}
        onShortcut={(label) => label === 'Amazon' && navigate(routes.tour)}
      />

      {!onboarded && (
        /* Coach mark pointing at the toolbar icon — the extension's only entry point. */
        <div className="absolute flex flex-col items-end" style={{ right: 44, top: CHROME_H + 14 }}>
          <div
            style={{
              width: 0,
              height: 0,
              marginRight: 34,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid var(--color-fg-primary)',
            }}
          />
          <span className="whitespace-nowrap rounded-[8px] bg-fg-primary px-[14px] py-[9px] text-[14px] font-medium text-white shadow-panel">
            👋 Connie's installed — click the icon to get set up
          </span>
        </div>
      )}

      {/* The launcher only exists once onboarding is done. */}
      {onboarded && <NaviRail />}
    </FigmaFrame>
  )
}

/* ---------- Google results · "best stroller 2026" ---------- */
export function ResultsScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = params.get('q') || SEARCH_QUERY
  return (
    <FigmaFrame>
      <BrowserChrome
        tabs={TABS(`${query} - Google Search`)}
        url={`https://www.google.com/search?q=${query.replace(/ /g, '+')}`}
      />
      <GoogleResults query={query} onAmazon={() => navigate(routes.tour)} />
      <NaviRail />
    </FigmaFrame>
  )
}

/* ---------- The onboarding popup, screen by screen ---------- */

/** Shared shell: the browser + new tab page sitting behind the popup. */
function OnboardingBackdrop() {
  return (
    <>
      <BrowserChrome tabs={TABS('New Tab')} highlightExtension />
      <GoogleNewTab query="" onQuery={() => {}} onSearch={() => {}} autoFocus={false} />
      {/* 10% scrim — the page stays full colour behind the popup. */}
      <div aria-hidden className="absolute inset-0" style={{ background: 'rgba(5,5,0,0.1)' }} />
    </>
  )
}

/* N1 — Welcome */
export function WelcomeScreen() {
  const navigate = useNavigate()
  return (
    <FigmaFrame>
      <OnboardingBackdrop />
      <Panel gap={20} onClose={() => navigate(routes.search)}>
        <p className="text-title1 font-semibold text-fg-primary">
          Know what's worth buying, before you buy.
        </p>
        <p className="w-full text-body text-fg-secondary">
          Consumer Reports’ (“CR”) lab results plus honest takes from shoppers like you, right on the
          product page. Free, no sponsors.
        </p>
        <PrimaryButton onClick={() => navigate(routes.memberCheck)}>Get started</PrimaryButton>
      </Panel>
    </FigmaFrame>
  )
}

/* N2 — Member check */
export function MemberCheckScreen() {
  const navigate = useNavigate()
  const setMember = useJourneyStore((s) => s.setMember)
  return (
    <FigmaFrame>
      <OnboardingBackdrop />
      <Panel gap={20} onClose={() => navigate(routes.search)}>
        <p className="text-title1 font-semibold text-fg-primary">
          Nice to meet you! New here, or a CR member?
        </p>
        <p className="w-full text-body text-fg-secondary">
          Log in to CR to sync your favorite products or create an account.
        </p>
        <div className="flex w-full flex-col gap-[12px]">
          <PrimaryButton onClick={() => navigate(routes.login)}>Log in to CR</PrimaryButton>
          <OutlineButton
            onClick={() => {
              setMember(true)
              navigate(routes.promise)
            }}
          >
            Create account
          </OutlineButton>
          <button
            onClick={() => {
              setMember(false)
              navigate(routes.promise)
            }}
            className="w-full text-center text-body text-fg-brand underline"
          >
            Continue without an account →
          </button>
        </div>
      </Panel>
    </FigmaFrame>
  )
}

/* M1 — Member log in */
function MailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  )
}
function Field({
  icon,
  placeholder,
  type,
  hint,
}: {
  icon: ReactNode
  placeholder: string
  type: string
  hint: string
}) {
  return (
    <div className="flex w-full flex-col gap-[8px]">
      <div className="flex h-[48px] w-full items-center gap-[8px] rounded-[4px] border border-fg-secondary px-[12px]">
        <span className="text-fg-secondary">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent text-body text-fg-primary outline-none placeholder:text-fg-secondary"
        />
      </div>
      <p className="text-utility text-fg-secondary">{hint}</p>
    </div>
  )
}

export function LoginScreen() {
  const navigate = useNavigate()
  const setMember = useJourneyStore((s) => s.setMember)
  return (
    <FigmaFrame>
      <OnboardingBackdrop />
      <Panel gap={18} onClose={() => navigate(routes.search)}>
        <p className="w-full text-[24px] font-semibold leading-[28px] tracking-[-0.1px] text-fg-primary">
          Welcome! Log in to sync Connie with your CR Profile.
        </p>
        <p className="w-full text-body text-fg-secondary">
          Your saved products, ratings, and priorities follow you here.
        </p>
        <Field icon={<MailIcon />} placeholder="Email" type="email" hint="We’ll send you a confirmation to this email" />
        <Field icon={<LockIcon />} placeholder="Password" type="password" hint="Must contain 8 characters" />
        <button className="text-[14px] font-normal leading-[20px] text-fg-brand underline">
          Forgot password?
        </button>
        <PrimaryButton
          onClick={() => {
            setMember(true)
            navigate(routes.promise)
          }}
        >
          Log in
        </PrimaryButton>
        <OutlineButton onClick={() => navigate(routes.promise)}>Continue with Google</OutlineButton>
      </Panel>
    </FigmaFrame>
  )
}

/* N3 — Promise */
function PromiseCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex w-full items-start gap-[16px] overflow-clip rounded-md border-[1.5px] border-border-subtle bg-white p-[18px]">
      <div className="flex size-[46px] shrink-0 items-center justify-center overflow-clip rounded-sm bg-bg-tertiary">
        <img alt="" src={icon} className="size-[24px]" />
      </div>
      <div className="flex flex-1 flex-col gap-[3px]">
        <p className="text-title4 font-semibold text-fg-primary">{title}</p>
        <p className="text-body text-fg-secondary">{body}</p>
      </div>
    </div>
  )
}

export function PromiseScreen() {
  const navigate = useNavigate()
  return (
    <FigmaFrame>
      <OnboardingBackdrop />
      <Panel gap={20} onClose={() => navigate(routes.search)}>
        <p className="text-title1 font-semibold text-fg-primary">Three promises from CR to you.</p>
        <div className="flex w-full flex-col gap-[12px]">
          <PromiseCard
            icon={asset.promiseNoSponsors}
            title="No paid sponsors"
            body="Picks come from CR testing and your priorities."
          />
          <PromiseCard
            icon={asset.promiseLock}
            title="Your data stays yours"
            body="What you browse is never sold or shared."
          />
          <PromiseCard
            icon={asset.promiseFlask}
            title="Trusted lab results"
            body="CR's own tests and long-term owner reports."
          />
        </div>
        <PrimaryButton onClick={() => navigate(routes.surveyCommunities)}>Got it</PrimaryButton>
      </Panel>
    </FigmaFrame>
  )
}

/* N4a — Survey · Communities. Nothing is pre-selected: these are the shopper's answers to give. */
const COMMUNITIES = [
  { name: 'Instagram', icon: asset.commInstagram, round: true },
  { name: 'Reddit', icon: asset.commReddit, round: false },
  { name: 'YouTube', icon: asset.commYoutube, round: false },
  { name: 'Tiktok', icon: asset.commTiktok, round: false },
  { name: 'Pinterest', icon: asset.commPinterest, round: false },
  { name: 'Online blogs', icon: asset.commGoogle, round: false },
]

/** The green step eyebrow survives only on the two survey questions, where it's a progress cue. */
function StepEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-eyebrow font-semibold uppercase text-fg-brand">{children}</p>
}

export function SurveyCommunitiesScreen() {
  const navigate = useNavigate()
  const selected = usePreferences((s) => s.sources)
  const toggle = usePreferences((s) => s.toggleSource)
  const canContinue = selected.length > 0
  return (
    <FigmaFrame>
      <OnboardingBackdrop />
      <Panel gap={24} onClose={() => navigate(routes.search)}>
        <div className="flex w-full flex-col gap-[8px]">
          <StepEyebrow>Question 1 of 2</StepEyebrow>
          <p className="text-title1 font-semibold text-fg-primary">Who do you trust for honest takes?</p>
        </div>
        <div className="flex w-full flex-col gap-[15px]">
          <p className="w-full text-body text-fg-primary">
            Pick the communities you rely on - choose as many as you like.
          </p>
          <div className="flex w-full flex-wrap gap-[9px]">
            {COMMUNITIES.map((c) => (
              <button
                key={c.name}
                onClick={() => toggle(c.name)}
                className={`flex items-center justify-center gap-[8px] overflow-clip rounded-pill bg-bg-primary px-[18px] py-[11px] ${
                  selected.includes(c.name) ? 'border-2 border-border-black' : 'border border-border-subtle'
                }`}
              >
                <img
                  alt=""
                  src={c.icon}
                  className={`size-[22px] shrink-0 object-cover ${c.round ? 'rounded-full' : ''}`}
                />
                <span className="whitespace-nowrap text-body text-fg-primary">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
        <PrimaryButton disabled={!canContinue} onClick={() => navigate(routes.surveyPriorities)}>
          Next
        </PrimaryButton>
      </Panel>
    </FigmaFrame>
  )
}

/* N4b — Survey · Priorities. One icon per value, matching the glyphs used everywhere else. */
type PriorityIcon = (p: { size?: number; className?: string }) => JSX.Element
const PRIORITIES: { label: string; Icon: PriorityIcon }[] = [
  { label: 'Long-term reliability', Icon: IconShieldCheck },
  { label: 'Value for price', Icon: IconTag },
  { label: 'Aesthetics', Icon: IconSparkle },
  { label: 'Ease of use', Icon: IconHandTap },
  { label: 'Sustainability', Icon: IconLeaf },
]

export function SurveyPrioritiesScreen() {
  const navigate = useNavigate()
  const selected = usePreferences((s) => s.preferences)
  const toggle = usePreferences((s) => s.togglePreference)
  return (
    <FigmaFrame>
      <OnboardingBackdrop />
      <Panel gap={24} onClose={() => navigate(routes.search)}>
        <div className="flex w-full flex-col gap-[8px]">
          <StepEyebrow>Question 2 of 2</StepEyebrow>
          <p className="text-title1 font-semibold text-fg-primary">
            What do you usually care about when shopping?
          </p>
        </div>
        <div className="flex w-full flex-col gap-[20px]">
          <div className="flex w-full flex-col gap-[4px]">
            <p className="w-full text-body text-fg-primary">
              What are some values that show up on every purchase? Pick as many as you like.
            </p>
            <p className="w-full text-[14px] leading-[20px] text-fg-secondary">
              You can add more or tweak them later in the chat.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-[8px]">
            {PRIORITIES.map(({ label, Icon }) => {
              const on = selected.includes(label)
              return (
                <button
                  key={label}
                  onClick={() => toggle(label)}
                  className={`flex h-[46px] items-center justify-center gap-[8px] overflow-clip rounded-pill bg-bg-primary px-[18px] py-[11px] ${
                    on ? 'border-2 border-border-black' : 'border border-border-subtle'
                  }`}
                >
                  <Icon size={20} className="shrink-0 text-fg-primary" />
                  <span className="whitespace-nowrap text-body text-fg-primary">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
        <PrimaryButton onClick={() => navigate(routes.permissions)}>Next</PrimaryButton>
      </Panel>
    </FigmaFrame>
  )
}

/* N5 — Permissions */

/** The two "where should Connie appear" options are mutually exclusive, so: radio, not toggle. */
function Radio({ on }: { on: boolean }) {
  return (
    <span
      className={`flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 ${
        on ? 'border-brand' : 'border-border-strong'
      }`}
    >
      {on && <span className="size-[11px] rounded-full bg-brand" />}
    </span>
  )
}

function PermRow({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex w-full items-start gap-[13px] overflow-clip px-[18px] py-[15px]">
      <img alt="" src={icon} className="size-[24px] shrink-0" />
      <div className="flex flex-1 flex-col gap-[2px] text-body leading-[24px]">
        <p className="w-full text-fg-primary">{title}</p>
        <p className="w-full text-fg-secondary">{body}</p>
      </div>
    </div>
  )
}

type Appearance = 'all' | 'manual'

export function PermissionsScreen() {
  const navigate = useNavigate()
  const grant = useJourneyStore((s) => s.grantPermissions)
  const [appearance, setAppearance] = useState<Appearance>('all')

  const option = (key: Appearance, title: string, body: string) => (
    <button
      onClick={() => setAppearance(key)}
      className="flex w-full items-center gap-[12px] overflow-clip px-[18px] py-[15px] text-left"
      role="radio"
      aria-checked={appearance === key}
    >
      <div className="flex flex-1 flex-col gap-[2px] text-body leading-[24px]">
        <p className="font-semibold text-fg-primary">{title}</p>
        <p className="text-fg-secondary">{body}</p>
      </div>
      <Radio on={appearance === key} />
    </button>
  )

  return (
    <FigmaFrame>
      <OnboardingBackdrop />
      <Panel gap={26} onClose={() => navigate(routes.search)}>
        <p className="text-title1 font-semibold text-fg-primary">One last step.</p>

        <div className="flex w-full flex-col gap-[14px]">
          <p className="w-full text-body text-fg-secondary">Here's exactly what this means:</p>
          <div className="flex w-full flex-col overflow-clip rounded-md bg-bg-tertiary">
            <PermRow
              icon={asset.permReader}
              title="Read product info on the page"
              body="To match what you're viewing to CR's data."
            />
            <div className="h-[1.5px] w-full bg-border-subtle" />
            <PermRow
              icon={asset.permNote}
              title="Add CR scores & community notes"
              body="The annotations you'll see while you browse."
            />
            <div className="h-[1.5px] w-full bg-border-subtle" />
            <PermRow
              icon={asset.permBlock}
              title="Never tracks activity in the background"
              body="Connie can't see or touch your passwords or payment info."
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-[16px]">
          <p className="whitespace-nowrap text-[20px] font-semibold leading-[24px] tracking-[-0.5px] text-fg-primary">
            Where should Connie appear?
          </p>
          <div
            role="radiogroup"
            aria-label="Where should Connie appear?"
            className="flex w-full flex-col overflow-clip rounded-md border-[1.5px] border-border-subtle bg-white"
          >
            {option(
              'all',
              'Active across all tabs',
              'Retailers, search, reviews & AI chats; anywhere you shop or research',
            )}
            <div className="h-[1.5px] w-full bg-border-subtle" />
            {option('manual', 'Only when I open it', 'Manual, Connie stays idle until you click it')}
          </div>
        </div>

        <PrimaryButton
          onClick={() => {
            grant()
            navigate(routes.done)
          }}
        >
          Allow &amp; continue
        </PrimaryButton>
      </Panel>
    </FigmaFrame>
  )
}

/* N6 — Done. Closing drops the shopper back on the new tab, now with the "C" launcher. */
export function DoneScreen() {
  const navigate = useNavigate()
  const complete = useJourneyStore((s) => s.completeOnboarding)
  const finish = () => {
    complete()
    navigate(`${routes.search}?ready=1`)
  }
  return (
    <FigmaFrame>
      <OnboardingBackdrop />
      <Panel gap={20} center onClose={finish}>
        <div className="flex size-[84px] items-center justify-center rounded-[20px] bg-brand text-fg-inverse">
          <IconCheck size={46} />
        </div>
        <p className="w-full text-center text-[24px] font-semibold leading-[28px] tracking-[-0.1px] text-fg-primary">
          You're all set! Connie's ready for you.
        </p>
        <p className="w-full text-center text-body text-fg-secondary">
          Search for anything on Amazon, Target, or a review site and CR's take shows up right on the page.
        </p>
        <PrimaryButton onClick={finish}>Start shopping</PrimaryButton>
      </Panel>
    </FigmaFrame>
  )
}
