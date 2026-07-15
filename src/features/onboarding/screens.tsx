import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import {
  BrowserChrome,
  CHROME_H,
  GoogleFavicon,
  ChromeStoreFavicon,
} from '@/components/browser/BrowserChrome'
import { GoogleNewTab } from '@/components/browser/GoogleNewTab'
import { GoogleResults } from '@/components/browser/GoogleResults'
import { ConnieHeader } from '@/components/connie/ConnieHeader'
import { NaviRail } from '@/components/connie/NaviRail'
import {
  IconCheck,
  IconInfo,
  IconStar,
  IconShare,
  IconPlus,
  IconX,
  IconCaretLeft,
  IconCaretRight,
  IconShieldCheck,
  IconTag,
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
  commReviewSites: '/figma/comm-reviewsites.svg',
  permReader: '/figma/perm-reader.svg',
  permNote: '/figma/perm-note.svg',
  permBlock: '/figma/perm-block.svg',
  installHero: '/figma/install-hero-mockup.png',
  installCrLogo: '/figma/install-cr-logo.png',
  installSoftStar: '/figma/install-softstar.svg',
  installSealCheck: '/figma/install-sealcheck.svg',
  installMedal: '/figma/install-medal.svg',
  installThumb1: '/figma/install-thumb-1.png',
  installThumb2: '/figma/install-thumb-2.png',
  installThumb3: '/figma/install-thumb-3.png',
  installWebstoreNav: '/figma/install-webstore-nav.png',
  installPromo: '/figma/install-promo.png',
  cwsIcon: '/figma/cws-icon.png',
  cSquare: '/figma/C_square.png',
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

/* ---------- N0 · Chrome Web Store install ----------
 * The full Chrome Web Store listing, reproduced frame-for-frame from Figma (N0). The browser
 * chrome stays pinned at the top; the listing itself scrolls, so the whole page — hero, gallery,
 * and the Overview copy below the fold — is reachable.
 *
 * Installing an extension doesn't navigate you anywhere: you stay on the listing, the button
 * flips to "Added", and Chrome drops the icon into the toolbar. So the story here is
 * click Add → see it added → open a new tab yourself. */
export function InstallScreen() {
  const navigate = useNavigate()
  const installed = useJourneyStore((s) => s.hasInstalled)
  const setInstalled = useJourneyStore((s) => s.setInstalled)
  /** Chrome's install confirmation. It sits over the "Added to Chrome" button, so it clears
   *  itself after a beat rather than hiding the state change it's announcing. */
  const [toast, setToast] = useState(false)
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(false), 4000)
    return () => window.clearTimeout(t)
  }, [toast])
  const metaText = 'font-medium text-[16.337px]'

  /** The gallery images, in Figma order: the Connie promo panel then the three screenshots.
   *  The gallery shows two at a time; the arrows (and thumbnails) slide the pair. */
  const gallery = [asset.installPromo, asset.installThumb1, asset.installThumb2, asset.installThumb3]
  const [galleryStart, setGalleryStart] = useState(0)
  const maxStart = gallery.length - 2
  const showPair = (start: number) => setGalleryStart(Math.max(0, Math.min(maxStart, start)))

  /** The Overview copy, verbatim from Figma. Feature rows carry an emoji title + a description. */
  const features = [
    ['🔎 Get instant product insights', "See CR's expert ratings and real owner sentiment the moment you land on a product page. No searching required."],
    ['📝 Spot the claims that matter', 'Our inline annotations flag misleading marketing claims right where they appear, so you know when promised features actually holds up.'],
    ['✅ Decide with confidence', "Tell us what matters most to you. Whether that's price, durability, safety, or all three. Connie ranks your options based on your priorities, not the retailer's."],
    ['⚖️ CR data meets real opinions', "We reconcile Consumer Reports' rigorous testing with what actual owners are saying, so you get the full picture, not just a star rating."],
    ['🛍 Works where you shop', 'Connie surfaces insights on the store sites you already use: no extra steps, no extra tabs.'],
  ]

  return (
    <FigmaFrame bg="#f7f8fa">
      {/* The same browser chrome as every other screen — the Web Store is just another tab. */}
      <BrowserChrome
        tabs={[
          { title: 'Baby registry checklist', favicon: <GoogleFavicon size={14} /> },
          { title: 'Connie — Chrome Web Store', favicon: <ChromeStoreFavicon />, active: true },
          { title: 'Inbox (3)', favicon: <GoogleFavicon size={14} /> },
        ]}
        url="https://chromewebstore.google.com/detail/connie"
        showExtension={installed}
        highlightExtension={false}
        onNewTab={() => navigate(routes.search)}
        highlightNewTab={installed}
      />

      {/* Chrome's own "extension added" confirmation, anchored under the toolbar icon. */}
      {toast && (
        <div
          className="absolute z-20 w-[340px] rounded-[10px] border border-[#dadce0] bg-white p-[18px] shadow-[0px_8px_24px_rgba(0,0,0,0.18)]"
          style={{ right: 40, top: CHROME_H + 8 }}
        >
          <div className="flex items-start gap-[12px]">
            <img src="/figma/C.png" alt="" className="size-[32px] shrink-0 object-contain" />
            <div className="flex flex-col gap-[6px]">
              <p className="text-[15px] font-medium text-[#202124]">
                Connie has been added to Chrome
              </p>
              <p className="text-[13px] leading-[18px] text-[#5f6368]">
                Open a new tab and click the Connie icon to get set up.
              </p>
            </div>
            <button
              aria-label="Dismiss"
              onClick={() => setToast(false)}
              className="-mr-[4px] -mt-[4px] shrink-0 text-[16px] leading-none text-[#5f6368]"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* The Web Store listing — scrolls beneath the fixed browser chrome. */}
      <div
        className="absolute left-0 w-[1440px] overflow-y-auto bg-white"
        style={{ top: CHROME_H, height: 900 - CHROME_H }}
      >
        <div className="relative w-[1440px]" style={{ height: 1497 }}>
          {/* The Web Store's own page nav — coded, using the real store icon image. */}
          <div className="absolute left-0 top-0 h-[106px] w-[1440px] bg-white">
            <div className="flex h-[54px] items-center">
              <div className="flex items-center gap-[8px] pl-[24px]">
                <img src={asset.cwsIcon} alt="" className="size-[30px] object-contain" />
                <span className="text-[15px] text-[#5f6368]">chrome web store</span>
              </div>
              <div className="mx-auto flex h-[40px] w-[560px] items-center gap-[12px] rounded-full bg-[#f1f3f4] px-[20px] text-[#5f6368]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
                <span className="text-[14px]">Search extensions and themes</span>
              </div>
              <div className="flex items-center gap-[18px] pr-[28px] text-[#5f6368]">
                <span className="text-[18px] leading-none">⋮</span>
                <span className="text-[16px] leading-none">▦</span>
                <span className="inline-block size-[28px] rounded-full bg-[#c9e26a]" />
              </div>
            </div>
            <div className="flex h-[52px] items-center gap-[28px] border-b border-[#ececec] pl-[24px] text-[14px]">
              <span className="text-[#5f6368]">Discover</span>
              <span className="relative flex h-full items-center font-medium text-[#1a73e8]">
                Extensions
                <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-t-full bg-[#1a73e8]" />
              </span>
              <span className="text-[#5f6368]">Themes</span>
            </div>
          </div>

          {/* Listing content — Figma container 1332:3267 (left 76, top 116). */}
          <div className="absolute w-[1296px]" style={{ left: 76, top: 116 }}>
            {/* Header */}
            <div className="absolute flex flex-col gap-[26px]" style={{ left: 133, top: 0, width: 1021 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[15px]">
                  <img
                    alt=""
                    src={asset.cSquare}
                    className="size-[58px] shrink-0 rounded-[10px] object-cover"
                  />
                  <p className="text-[29.788px] font-bold text-black">
                    Connie: Consumer Reports AI Shopping Assistant
                  </p>
                </div>
                {installed ? (
                  <div className="flex h-[37px] items-center justify-center gap-[7px] rounded-full border border-[#dadce0] bg-white px-[18px]">
                    <IconCheck size={15} className="text-[#188038]" />
                    <span className="whitespace-nowrap text-[13.254px] font-medium text-[#5f6368]">
                      Added to Chrome
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setInstalled(true)
                      setToast(true)
                    }}
                    className="flex h-[37px] w-[142px] items-center justify-center rounded-full bg-[#0e4dca] text-[13.254px] font-medium text-white transition-colors hover:bg-[#0b3ea6]"
                  >
                    Add to Chrome
                  </button>
                )}
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

            {/* Hero gallery — a two-up carousel of the Figma images; arrows slide the pair. */}
            <div className="absolute" style={{ left: 0, top: 210, width: 1296, height: 353 }}>
              <img
                alt=""
                src={gallery[galleryStart]}
                className="absolute top-0 rounded-[7px] object-cover shadow-[0px_0px_5px_1px_rgba(0,0,0,0.25)]"
                style={{ left: 57, width: 564, height: 353 }}
              />
              <img
                alt=""
                src={gallery[galleryStart + 1]}
                className="absolute top-0 rounded-[7px] object-cover shadow-[0px_0px_5px_1px_rgba(0,0,0,0.25)]"
                style={{ left: 665, width: 564, height: 353 }}
              />
              <button
                aria-label="Previous images"
                disabled={galleryStart === 0}
                onClick={() => showPair(galleryStart - 1)}
                className="absolute left-[0px] top-[157px] flex size-[36px] items-center justify-center rounded-full text-[#5f6368] transition enabled:hover:bg-[#f1f3f4] disabled:opacity-30"
              >
                <IconCaretLeft size={24} />
              </button>
              <button
                aria-label="Next images"
                disabled={galleryStart === maxStart}
                onClick={() => showPair(galleryStart + 1)}
                className="absolute left-[1239px] top-[157px] flex size-[36px] items-center justify-center rounded-full text-[#5f6368] transition enabled:hover:bg-[#f1f3f4] disabled:opacity-30"
              >
                <IconCaretRight size={24} />
              </button>
            </div>

            {/* Thumbnail strip — click to jump; the visible pair is outlined. */}
            <div className="absolute flex items-center gap-[16px]" style={{ left: 464, top: 600 }}>
              {gallery.map((src, i) => {
                const active = i === galleryStart || i === galleryStart + 1
                return (
                  <button
                    key={src}
                    aria-label={`Show image ${i + 1}`}
                    onClick={() => showPair(i === maxStart + 1 ? maxStart : i)}
                    className={`h-[49px] w-[78px] overflow-hidden rounded-[6px] ${
                      active ? 'border-2 border-[#0e4dca]' : 'border border-[#e0e0e0]'
                    }`}
                  >
                    <img alt="" src={src} className="h-full w-full object-cover" />
                  </button>
                )
              })}
            </div>

            {/* Overview */}
            <div className="absolute" style={{ left: 133, top: 711, width: 996 }}>
              <p className="text-[26.307px] font-bold text-black">Overview</p>
              <div className="mt-[30px] flex flex-col gap-[17px] text-[16px] text-black">
                <p className="leading-[24px]">Shop confidently with Consumer Reports, right in your browser.</p>
                <p className="leading-[22px]">
                  Connie is a free browser extension from Consumer Reports that brings trusted,
                  unbiased product research to you as you shop. No more juggling tabs or guessing
                  which reviews to trust. It’s AI that shops on your side.
                </p>
                <p className="leading-[22px]">
                  By installing the extension you agree to the additional Connie Terms &amp;
                  Conditions: <span className="font-medium text-[#3086ff]">http://consumerreports.org/</span>
                </p>
                {features.map(([title, body]) => (
                  <p key={title} className="leading-[22px]">
                    {title}
                    <br />
                    {` ${body}`}
                  </p>
                ))}
                <p className="leading-[22px]">
                  Please see our Privacy Policy at{' '}
                  <span className="font-medium text-[#296be5]">http://consumerreports.org/</span>
                </p>
                <p className="leading-[22px]">
                  Connie is built by Consumer Reports, a nonprofit with no ads and no financial ties
                  to the brands we cover.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
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
          <OutlineButton onClick={() => navigate(routes.signup)}>Create account</OutlineButton>
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
        <p className="text-title1 font-semibold text-fg-primary">
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
      </Panel>
    </FigmaFrame>
  )
}

/* M2 — Create a CR account.
 * The mirror of M1: same panel, same field styling. Signing up asks for the two things a new
 * account genuinely needs (a name to greet her by, and credentials), and nothing it doesn't. */
function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  )
}

export function SignupScreen() {
  const navigate = useNavigate()
  const setMember = useJourneyStore((s) => s.setMember)
  /** Unchecked by default — agreeing to terms is the shopper's action to take, not a default. */
  const [agreed, setAgreed] = useState(false)
  return (
    <FigmaFrame>
      <OnboardingBackdrop />
      <Panel gap={18} onClose={() => navigate(routes.search)}>
        <p className="text-title1 font-semibold text-fg-primary">
          Create your CR account to get the most out of Connie.
        </p>
        <p className="w-full text-body text-fg-secondary">
          Your saved products, ratings, and priorities sync across every device you shop on.
        </p>
        <Field icon={<UserIcon />} placeholder="Full name" type="text" hint="How Connie will greet you" />
        <Field icon={<MailIcon />} placeholder="Email" type="email" hint="We’ll send you a confirmation to this email" />
        <Field icon={<LockIcon />} placeholder="Password" type="password" hint="Must contain 8 characters" />
        <Field
          icon={<LockIcon />}
          placeholder="Confirm password"
          type="password"
          hint="Re-enter your password to confirm"
        />
        <button
          onClick={() => setAgreed(!agreed)}
          role="checkbox"
          aria-checked={agreed}
          className="flex w-full items-start gap-[10px] text-left"
        >
          <span
            className={`mt-[2px] flex size-[20px] shrink-0 items-center justify-center rounded-[4px] border-2 ${
              agreed ? 'border-brand bg-brand text-fg-inverse' : 'border-border-strong'
            }`}
          >
            {agreed && <IconCheck size={13} />}
          </span>
          <span className="text-[14px] leading-[20px] text-fg-secondary">
            I agree to CR’s <span className="text-fg-brand underline">Terms of Use</span> and{' '}
            <span className="text-fg-brand underline">Privacy Policy</span>.
          </span>
        </button>
        <PrimaryButton
          disabled={!agreed}
          onClick={() => {
            setMember(true)
            navigate(routes.promise)
          }}
        >
          Create account
        </PrimaryButton>
        <button
          onClick={() => navigate(routes.login)}
          className="w-full text-center text-body text-fg-brand underline"
        >
          Already have an account? Log in
        </button>
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
const COMMUNITIES: { name: string; icon: string; round: boolean }[] = [
  { name: 'Instagram', icon: asset.commInstagram, round: true },
  { name: 'Reddit', icon: asset.commReddit, round: false },
  { name: 'YouTube', icon: asset.commYoutube, round: false },
  { name: 'Tiktok', icon: asset.commTiktok, round: false },
  { name: 'Pinterest', icon: asset.commPinterest, round: false },
  { name: 'Online blogs', icon: asset.commGoogle, round: false },
  { name: 'Review sites', icon: asset.commReviewSites, round: false },
]

/** The chip styling every option on this question shares — the named ones and the custom ones. */
const chipBase =
  'flex items-center justify-center gap-[8px] overflow-clip rounded-pill bg-bg-primary px-[18px] py-[11px]'
const chipOn = 'border-2 border-border-black'
const chipOff = 'border border-border-subtle'

/** The green step eyebrow survives only on the two survey questions, where it's a progress cue. */
function StepEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-eyebrow font-semibold uppercase text-fg-brand">{children}</p>
}

export function SurveyCommunitiesScreen() {
  const navigate = useNavigate()
  const selected = usePreferences((s) => s.sources)
  const toggle = usePreferences((s) => s.toggleSource)

  /** Anything she typed under "Other" — i.e. a chosen source that isn't one of the named ones. */
  const named = COMMUNITIES.map((c) => c.name)
  const custom = selected.filter((s) => !named.includes(s))

  /* "Other" is a disclosure, not an answer: it opens the field. It stays open while there are
     custom sources, because closing it would hide the chips it created. */
  const [otherOpen, setOtherOpen] = useState(custom.length > 0)
  const [draft, setDraft] = useState('')

  const addCustom = () => {
    const value = draft.trim()
    if (!value || selected.includes(value)) return setDraft('')
    toggle(value)
    setDraft('')
  }

  const canContinue = selected.length > 0

  return (
    <FigmaFrame>
      <OnboardingBackdrop />
      <Panel gap={24} onClose={() => navigate(routes.search)}>
        <div className="flex w-full flex-col gap-[8px]">
          <StepEyebrow>Question 1 of 2</StepEyebrow>
          <p className="text-title1 font-semibold text-fg-primary">Where do you go for second opinions?</p>
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
                className={`${chipBase} ${selected.includes(c.name) ? chipOn : chipOff}`}
              >
                <img
                  alt=""
                  src={c.icon}
                  className={`size-[22px] shrink-0 object-cover ${c.round ? 'rounded-full' : ''}`}
                />
                <span className="whitespace-nowrap text-body text-fg-primary">{c.name}</span>
              </button>
            ))}

            {/* Whatever she named under "Other" — same chips as the rest, tap to remove. */}
            {custom.map((name) => (
              <button
                key={name}
                onClick={() => toggle(name)}
                aria-label={`Remove ${name}`}
                className={`${chipBase} ${chipOn}`}
              >
                <span className="whitespace-nowrap text-body text-fg-primary">{name}</span>
                <IconX size={14} className="shrink-0 text-fg-secondary" />
              </button>
            ))}

            <button
              onClick={() => setOtherOpen((o) => !o)}
              aria-expanded={otherOpen}
              className={`${chipBase} ${otherOpen ? chipOn : chipOff}`}
            >
              <IconPlus size={18} className="shrink-0 text-fg-primary" />
              <span className="whitespace-nowrap text-body text-fg-primary">Other</span>
            </button>
          </div>

          {otherOpen && (
            <div className="flex w-full flex-col gap-[8px]">
              <div className="flex w-full items-center gap-[8px]">
                <input
                  value={draft}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                  placeholder="Which one? e.g. Wirecutter, a parenting forum…"
                  aria-label="Add another source"
                  className="h-[44px] min-w-0 flex-1 rounded-[8px] border border-border-strong bg-bg-primary px-[14px] text-body text-fg-primary outline-none placeholder:text-fg-secondary focus:border-brand"
                />
                <button
                  onClick={addCustom}
                  disabled={!draft.trim()}
                  className="flex h-[44px] shrink-0 items-center justify-center rounded-pill bg-brand px-[18px] text-body font-semibold text-fg-inverse disabled:bg-bg-disabled"
                >
                  Add
                </button>
              </div>
              <p className="text-utility text-fg-secondary">
                Add as many as you like — press Enter after each.
              </p>
            </div>
          )}
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
  { label: 'Ease of use', Icon: IconHandTap },
  { label: 'Sustainability', Icon: IconLeaf },
]

export function SurveyPrioritiesScreen() {
  const navigate = useNavigate()
  const selected = usePreferences((s) => s.preferences)
  const toggle = usePreferences((s) => s.togglePreference)

  /** Anything she typed under "Other" — a chosen value that isn't one of the named ones. */
  const named = PRIORITIES.map((p) => p.label)
  const custom = selected.filter((s) => !named.includes(s))

  /* Same disclosure as Q1: "Other" opens the field rather than being an answer itself, and stays
     open while there are custom values, because closing it would hide the chips it created. */
  const [otherOpen, setOtherOpen] = useState(custom.length > 0)
  const [draft, setDraft] = useState('')

  const addCustom = () => {
    const value = draft.trim()
    if (!value || selected.includes(value)) return setDraft('')
    toggle(value)
    setDraft('')
  }

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
        <div className="flex w-full flex-col gap-[15px]">
          <div className="flex w-full flex-col">
            <p className="w-full text-body text-fg-primary">
              What are some values that show up on every purchase? Pick as many as you like.
            </p>
          </div>
          {/* Tight padding on purpose: it's what keeps the pills to two rows inside the 520px
              panel instead of orphaning the last one. */}
          <div className="flex w-full flex-wrap gap-[9px]">
            {PRIORITIES.map(({ label, Icon }) => {
              const on = selected.includes(label)
              return (
                <button
                  key={label}
                  onClick={() => toggle(label)}
                  className={`flex h-[46px] items-center justify-center gap-[6px] overflow-clip rounded-pill bg-bg-primary px-[12px] py-[11px] ${
                    on ? 'border-2 border-border-black' : 'border border-border-subtle'
                  }`}
                >
                  <Icon size={20} className="shrink-0 text-fg-primary" />
                  <span className="whitespace-nowrap text-body text-fg-primary">{label}</span>
                </button>
              )
            })}

            {/* Whatever she named under "Other" — same chips as the rest, tap to remove. */}
            {custom.map((label) => (
              <button
                key={label}
                onClick={() => toggle(label)}
                aria-label={`Remove ${label}`}
                className="flex h-[46px] items-center justify-center gap-[6px] overflow-clip rounded-pill border-2 border-border-black bg-bg-primary px-[12px] py-[11px]"
              >
                <span className="whitespace-nowrap text-body text-fg-primary">{label}</span>
                <IconX size={14} className="shrink-0 text-fg-secondary" />
              </button>
            ))}

            <button
              onClick={() => setOtherOpen((o) => !o)}
              aria-expanded={otherOpen}
              className={`flex h-[46px] items-center justify-center gap-[6px] overflow-clip rounded-pill bg-bg-primary px-[12px] py-[11px] ${
                otherOpen ? 'border-2 border-border-black' : 'border border-border-subtle'
              }`}
            >
              <IconPlus size={18} className="shrink-0 text-fg-primary" />
              <span className="whitespace-nowrap text-body text-fg-primary">Other</span>
            </button>
          </div>

          {otherOpen && (
            <div className="flex w-full flex-col gap-[8px]">
              <div className="flex w-full items-center gap-[8px]">
                <input
                  value={draft}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                  placeholder="What else? e.g. Safety, Resale value…"
                  aria-label="Add another value"
                  className="h-[44px] min-w-0 flex-1 rounded-[8px] border border-border-strong bg-bg-primary px-[14px] text-body text-fg-primary outline-none placeholder:text-fg-secondary focus:border-brand"
                />
                <button
                  onClick={addCustom}
                  disabled={!draft.trim()}
                  className="flex h-[44px] shrink-0 items-center justify-center rounded-pill bg-brand px-[18px] text-body font-semibold text-fg-inverse disabled:bg-bg-disabled"
                >
                  Add
                </button>
              </div>
              <p className="text-utility text-fg-secondary">
                Add as many as you like — press Enter after each.
              </p>
            </div>
          )}
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
