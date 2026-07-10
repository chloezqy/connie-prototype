import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { NaviRail } from '@/components/connie/NaviRail'
import { IconX, IconCheck, IconInfo, IconStar, IconShare, IconCaretLeft, IconCaretRight } from '@/components/icons'
import { routes } from '@/app/routes'
import { useJourneyStore } from '@/store/useJourneyStore'
import { usePreferences } from '@/store/usePreferences'

/** Shared onboarding backdrop — the dimmed Google "best stroller 2026" page (from Figma). */
export const onboardingGoogleBg = '/figma/onboarding-google-bg.png'

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
  prioritiesInfo: '/figma/priorities-info.svg',
  permInfo: '/figma/perm-info.svg',
  permReader: '/figma/perm-reader.svg',
  permNote: '/figma/perm-note.svg',
  permBlock: '/figma/perm-block.svg',
  installNav: '/figma/install-nav.png',
  installHero: '/figma/install-hero-mockup.png',
  installCrLogo: '/figma/install-cr-logo.png',
  installSoftStar: '/figma/install-softstar.svg',
  installSealCheck: '/figma/install-sealcheck.svg',
  installMedal: '/figma/install-medal.svg',
}

/* ---------- Shared onboarding primitives ---------- */

/** Connie onboarding panel — absolute 520px card at left 864 / top 72 (Figma). */
function Panel({
  gap,
  center = false,
  style,
  children,
}: {
  gap: number
  center?: boolean
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <div
      className={`absolute flex flex-col overflow-clip rounded-md border border-border-subtle bg-bg-secondary p-[36px] shadow-panel ${
        center ? 'items-center' : 'items-start'
      }`}
      style={{ left: 864, top: 72, width: 520, gap, ...style }}
    >
      {children}
    </div>
  )
}

function CloseX({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex w-full flex-col items-end">
      <button aria-label="Close" onClick={onClick} className="text-fg-primary">
        <IconX size={22} />
      </button>
    </div>
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

/* N0 — Chrome Web Store install (node 1052:7120) */
export function InstallScreen() {
  const navigate = useNavigate()
  const setInstalled = useJourneyStore((s) => s.setInstalled)
  const install = () => {
    setInstalled(true)
    navigate(routes.welcome)
  }
  const metaText = "font-medium text-[16.337px]"
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
        {/* Green Connie card */}
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
        {/* Mockup screenshot card */}
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

/* N1 — Welcome (node 1052:2134) */
export function WelcomeScreen() {
  const navigate = useNavigate()
  return (
    <FigmaFrame backdrop={onboardingGoogleBg}>
      {/* Connie panel — 1052:2135 */}
      <div
        className="absolute flex flex-col items-start gap-[20px] overflow-clip rounded-md border border-border-subtle bg-bg-secondary p-[36px] shadow-panel"
        style={{ left: 864, top: 72, width: 520 }}
      >
        <div className="flex w-full flex-col items-end">
          <button aria-label="Close" onClick={() => navigate('/')} className="text-fg-primary">
            <IconX size={22} />
          </button>
        </div>
        <div className="flex w-full flex-col gap-[8px]">
          <p className="text-eyebrow font-semibold uppercase text-fg-brand">WELCOME · JUST INSTALLED</p>
          <p className="text-title1 font-semibold text-fg-primary">
            Know what's worth buying, before you buy.
          </p>
        </div>
        <p className="w-full text-body text-fg-secondary">
          Consumer Reports’ (“CR”) lab results plus honest takes from shoppers like you, right on the
          product page. Free, no sponsors.
        </p>
        <button
          onClick={() => navigate(routes.memberCheck)}
          className="flex h-[48px] w-full items-center justify-center rounded-pill bg-brand text-body font-semibold text-fg-inverse"
        >
          Get started
        </button>
      </div>

      <NaviRail />
    </FigmaFrame>
  )
}

/* N2 — Member check (node 1052:2148) */
export function MemberCheckScreen() {
  const navigate = useNavigate()
  const setMember = useJourneyStore((s) => s.setMember)
  return (
    <FigmaFrame backdrop={onboardingGoogleBg}>
      <Panel gap={20}>
        <CloseX onClick={() => navigate('/')} />
        <div className="flex w-full flex-col gap-[8px]">
          <p className="text-eyebrow font-semibold uppercase text-fg-brand">LOGIN OR SIGN UP</p>
          <p className="text-title1 font-semibold text-fg-primary">
            Nice to meet you! New here, or a CR member?
          </p>
        </div>
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
      <NaviRail />
    </FigmaFrame>
  )
}

/* M1 — Member log in (node 1052:5317) */
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
    <FigmaFrame backdrop={onboardingGoogleBg}>
      <Panel gap={18}>
        <CloseX onClick={() => navigate('/')} />
        <div className="flex w-full flex-col gap-[8px]">
          <p className="text-eyebrow font-semibold uppercase text-fg-brand">CR MEMBERS</p>
          <p className="w-full text-[24px] font-semibold leading-[28px] tracking-[-0.1px] text-fg-primary">
            Welcome! Log in to sync Connie with your CR Profile.
          </p>
        </div>
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
      <NaviRail />
    </FigmaFrame>
  )
}

/* N3 — Promise (node 1052:2165) */
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
    <FigmaFrame backdrop={onboardingGoogleBg}>
      <Panel gap={20}>
        <CloseX onClick={() => navigate('/')} />
        <div className="flex w-full flex-col gap-[8px]">
          <p className="text-eyebrow font-semibold uppercase text-fg-brand">A QUICK PROMISE</p>
          <p className="text-title1 font-semibold text-fg-primary">Three promises from CR to you.</p>
        </div>
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
      <NaviRail />
    </FigmaFrame>
  )
}

/* N4a — Survey · Communities (nodes 1052:2203 empty / 1052:2254 selected) */
const COMMUNITIES = [
  { name: 'Instagram', icon: asset.commInstagram, round: true },
  { name: 'Reddit', icon: asset.commReddit, round: false },
  { name: 'YouTube', icon: asset.commYoutube, round: false },
  { name: 'Tiktok', icon: asset.commTiktok, round: false },
  { name: 'Pinterest', icon: asset.commPinterest, round: false },
  { name: 'Online blogs', icon: asset.commGoogle, round: false },
]

export function SurveyCommunitiesScreen() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string[]>([])
  const toggle = (n: string) =>
    setSelected((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]))
  const canContinue = selected.length > 0
  return (
    <FigmaFrame backdrop={onboardingGoogleBg}>
      <Panel gap={24}>
        <CloseX onClick={() => navigate('/')} />
        <div className="flex w-full flex-col gap-[8px]">
          <p className="text-eyebrow font-semibold uppercase text-fg-brand">QUESTION 1 OF 2</p>
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
      <NaviRail />
    </FigmaFrame>
  )
}

/* N4b — Survey · Priorities (nodes 1052:2305 empty / 1052:2337 selected) */
const PRIORITIES = [
  'Long-term reliability',
  'Value for money',
  'Aesthetics',
  'Ease of use',
  'Sustainability',
  'Brand ethics',
]

export function SurveyPrioritiesScreen() {
  const navigate = useNavigate()
  const selected = usePreferences((s) => s.preferences)
  const toggle = usePreferences((s) => s.togglePreference)
  return (
    <FigmaFrame backdrop={onboardingGoogleBg}>
      <Panel gap={24}>
        <CloseX onClick={() => navigate('/')} />
        <div className="flex w-full flex-col gap-[8px]">
          <p className="text-eyebrow font-semibold uppercase text-fg-brand">QUESTION 2 OF 2</p>
          <p className="text-title1 font-semibold text-fg-primary">
            What do you usually care about when shopping?
          </p>
        </div>
        <div className="flex w-full flex-col gap-[20px]">
          <p className="w-full text-body text-fg-primary">
            What are some values that show up on every purchase? Pick as many as you like.
          </p>
          <div className="flex w-full flex-wrap gap-[8px]">
            {PRIORITIES.map((p) => {
              const on = selected.includes(p)
              return (
                <button
                  key={p}
                  onClick={() => toggle(p)}
                  className={`flex h-[46px] items-center justify-center overflow-clip rounded-pill bg-bg-primary px-[18px] py-[11px] ${
                    on ? 'border-2 border-border-black' : 'border border-border-subtle'
                  }`}
                >
                  <span className="whitespace-nowrap text-body text-fg-primary">{p}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex w-full items-start gap-[12px] overflow-clip rounded-md bg-bg-tertiary py-[16px] pl-[16px] pr-[18px]">
          <img alt="" src={asset.prioritiesInfo} className="size-[22px] shrink-0" />
          <p className="flex-1 text-body text-fg-secondary">
            These two are all we ask up front. More specific priorities like budget, must-haves come up
            in chat as you shop, only when they’re relevant.
          </p>
        </div>
        <PrimaryButton onClick={() => navigate(routes.permissions)}>Next</PrimaryButton>
      </Panel>
      <NaviRail />
    </FigmaFrame>
  )
}

/* N5 — Permissions (node 1052:2385) */
function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`relative h-[32px] w-[64px] shrink-0 rounded-full ${on ? 'bg-brand' : 'bg-bg-disabled'}`}>
      <span
        className={`absolute top-[4px] size-[24px] rounded-full bg-white shadow-sm ${
          on ? 'left-[36px]' : 'left-[4px]'
        }`}
      />
    </div>
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

export function PermissionsScreen() {
  const navigate = useNavigate()
  const grant = useJourneyStore((s) => s.grantPermissions)
  const [allTabs, setAllTabs] = useState(true)
  const [manual, setManual] = useState(false)
  return (
    <FigmaFrame backdrop={onboardingGoogleBg}>
      <div
        className="absolute flex flex-col gap-[26px] overflow-y-auto rounded-md border border-border-subtle bg-bg-secondary p-[36px] shadow-panel"
        style={{ left: 864, top: 72, width: 520, maxHeight: 804 }}
      >
        <CloseX onClick={() => navigate('/')} />
        <div className="flex w-full flex-col gap-[7px]">
          <p className="text-eyebrow font-semibold uppercase text-fg-brand">PERMISSIONS</p>
          <p className="text-title1 font-semibold text-fg-primary">Connie's ready when you are.</p>
        </div>

        <div className="flex w-full flex-col gap-[14px]">
          <p className="w-full text-body text-fg-secondary">
            Connie only reads pages you’re on then adds CR and communities’ takes. Here's exactly what
            this means:
          </p>
          <div className="flex w-full flex-col overflow-clip rounded-md bg-bg-tertiary">
            <div className="flex w-full items-center gap-[9px] overflow-clip px-[18px] pb-[13px] pt-[15px]">
              <img alt="" src={asset.permInfo} className="size-[17px] shrink-0" />
              <span className="whitespace-nowrap text-utility font-semibold uppercase text-fg-secondary">
                WHAT THIS MEANS
              </span>
            </div>
            <div className="h-[1.5px] w-full bg-border-subtle" />
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
          <div className="flex w-full flex-col overflow-clip rounded-md border-[1.5px] border-border-subtle bg-white">
            <button
              onClick={() => setAllTabs((v) => !v)}
              className="flex w-full items-center gap-[12px] overflow-clip px-[18px] py-[15px] text-left"
            >
              <div className="flex flex-1 flex-col gap-[2px] text-body leading-[24px]">
                <p className="font-semibold text-fg-primary">Active across all tabs</p>
                <p className="text-fg-secondary">
                  Retailers, search, reviews & AI chats; anywhere you shop or research
                </p>
              </div>
              <Toggle on={allTabs} />
            </button>
            <div className="h-[1.5px] w-full bg-border-subtle" />
            <button
              onClick={() => setManual((v) => !v)}
              className="flex w-full items-center gap-[12px] overflow-clip px-[18px] py-[15px] text-left"
            >
              <div className="flex flex-1 flex-col gap-[2px] text-body leading-[24px]">
                <p className="font-semibold text-fg-primary">Only when I open it</p>
                <p className="text-fg-secondary">Manual, Connie stays idle until you click it</p>
              </div>
              <Toggle on={manual} />
            </button>
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
      </div>
      <NaviRail />
    </FigmaFrame>
  )
}

/* N6 — Done (node 1052:2369) */
export function DoneScreen() {
  const navigate = useNavigate()
  const complete = useJourneyStore((s) => s.completeOnboarding)
  const finish = () => {
    complete()
    navigate('/browse/tour')
  }
  return (
    <FigmaFrame backdrop={onboardingGoogleBg}>
      <Panel gap={20} center>
        <CloseX onClick={finish} />
        <div className="flex size-[84px] items-center justify-center rounded-[20px] bg-brand text-fg-inverse">
          <IconCheck size={46} />
        </div>
        <p className="w-full text-center text-[24px] font-semibold leading-[28px] tracking-[-0.1px] text-fg-primary">
          You're all set! Connie's ready for you.
        </p>
        <p className="w-full text-center text-body text-fg-secondary">
          Open any product on Amazon, Target, or a review site and CR's take shows up right on the page.
        </p>
      </Panel>

      {/* Highlighted "Amazon" retailer on the page behind */}
      <button
        onClick={finish}
        className="absolute flex h-[23px] w-[80px] items-center justify-center bg-bg-tertiary p-[3px]"
        style={{ left: 360, top: 474 }}
      >
        <span className="whitespace-nowrap text-title4 font-semibold text-fg-secondary">Amazon</span>
      </button>

      <NaviRail />
    </FigmaFrame>
  )
}
