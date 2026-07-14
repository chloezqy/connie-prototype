import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { CRLauncher } from '@/components/connie/CRLauncher'
import { NaviRail } from '@/components/connie/NaviRail'
import { routes } from '@/app/routes'
import { cn } from '@/lib/cn'
import { callConnie } from '@/api/connieClient'
import { isInlineAnnotations, type Evidence, type InlineAnnotation } from '@/types/connie-contract'
import { cleanEvidence } from '@/lib/sourceFilter'
import { usePreferences } from '@/store/usePreferences'

/* ---------- Annotation asset paths (public/figma) ---------- */
const asset = {
  backdrop: '/figma/annot-backdrop.png',
  check: '/figma/annot-check.svg',
  xcircle: '/figma/annot-xcircle.svg',
  question: '/figma/annot-question.svg',
  link: '/figma/annot-link.svg',
  arrow: '/figma/annot-arrow.svg',
  x: '/figma/annot-x.svg',
  avatarCr: '/figma/annot-avatar-cr.png',
  avatarReddit: '/figma/annot-avatar-reddit.png',
  avatarInstagram: '/figma/annot-avatar-instagram.png',
  naviChat: '/figma/annot-navi-chat.svg',
  naviHeart: '/figma/annot-navi-heart.svg',
  naviLine: '/figma/annot-navi-line.svg',
  naviGear: '/figma/annot-navi-gear.svg',
  naviQuestion: '/figma/annot-navi-question.svg',
}

/* ---------- State model — five variants of one inline-annotation experience ---------- */
type StateKey = 'base' | 'verified-both' | 'verified-community' | 'misleading' | 'unverifiable'

const STATE_ORDER: { key: StateKey; short: string }[] = [
  { key: 'base', short: 'Base' },
  { key: 'verified-both', short: 'CR + community' },
  { key: 'verified-community', short: 'Community only' },
  { key: 'misleading', short: 'Misleading' },
  { key: 'unverifiable', short: 'Unable to verify' },
]

/* ---------- Retailer-page chrome (persists across all states) ---------- */

/** A highlighted claim swatch drawn over the retailer page. */
function Highlight({
  left,
  top,
  width,
  height = 21,
  color,
  opacity = 1,
}: {
  left: number
  top: number
  width: number
  height?: number
  color: string
  opacity?: number
}) {
  return (
    <div
      className="absolute rounded-[4px]"
      style={{ left, top, width, height, background: color, opacity }}
    />
  )
}

/* ---------- Connie annotation callout ---------- */

type Source = {
  avatar: string
  name: string
  quote: string
  chip: string
  /** Instagram avatar has no white ring in Figma. */
  ring?: boolean
  /** Fixed 220px cards (CR/community pair) vs. flex-fill cards (community-only). */
  fixed?: boolean
}

function SourceCard({ avatar, name, quote, chip, ring = true, fixed = true }: Source) {
  return (
    <div
      className={cn(
        'flex flex-col items-start rounded-[8px] border-[0.5px] border-border-subtle bg-bg-primary px-[16px] pb-[20px] pt-[16px]',
        fixed ? 'w-[220px] shrink-0' : 'min-w-0 flex-1',
      )}
    >
      <div className="flex w-full flex-col items-start gap-[12px] overflow-clip rounded-[8px]">
        <div className="flex w-full flex-col items-start gap-[4px]">
          <div className="flex items-center gap-[6px]">
            <img
              alt=""
              src={avatar}
              className={cn(
                'size-[16px] rounded-full object-cover',
                ring && 'border-[0.5px] border-white',
              )}
            />
            <p className="whitespace-nowrap text-[12px] font-semibold leading-[16px] text-fg-primary">
              {name}
            </p>
          </div>
          <p className="w-full text-[12px] font-normal leading-[17px] text-fg-primary">{quote}</p>
        </div>
        <div className="flex items-center gap-[4px] rounded-[80px] border-[0.5px] border-border-subtle bg-white py-[2px] pl-[8px] pr-[12px]">
          <img alt="" src={asset.link} className="size-[14px]" />
          <p className="whitespace-nowrap text-[10px] leading-[20px] tracking-[0.1px] text-[#222]">
            {chip}
          </p>
          <img alt="" src={asset.arrow} className="size-[12px]" />
        </div>
      </div>
    </div>
  )
}

function Callout({
  style,
  icon,
  title,
  subtitle,
  children,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  style: CSSProperties
  icon: string
  title: string
  subtitle: string
  children?: ReactNode
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute flex flex-col items-start gap-[12px] overflow-clip rounded-md border-[0.5px] border-[#c5c5c5] bg-bg-secondary p-[24px] shadow-panel"
      style={{ width: 520, ...style }}
    >
      <div className="flex w-full flex-col items-start gap-[6px]">
        <div className="flex items-center gap-[6px]">
          <img alt="" src={icon} className="size-[20px]" />
          <p className="whitespace-nowrap text-title4 font-semibold text-fg-primary">{title}</p>
        </div>
        <p className="w-full text-[14px] font-normal leading-[20px] text-fg-primary">{subtitle}</p>
      </div>
      {children}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute block cursor-pointer"
        style={{ left: 481.5, top: 21.5 }}
      >
        <img alt="" src={asset.x} className="size-[18px]" />
      </button>
    </div>
  )
}

/** The 8px-padded row that holds a pair of source cards. */
function SourceRow({ children }: { children: ReactNode }) {
  return <div className="flex w-full items-start gap-[12px] rounded-[8px] p-[8px]">{children}</div>
}

/* ---------- Source content (Figma copy, verbatim) ---------- */
const crPaddingQuote =
  '"Padding was generous and well-distributed, supporting comfort across test conditions.”'
const redditComfyQuote =
  '"Genuinely the comfiest stroller we\'ve tried — zero fussing from my toddler..”'
const redditComfyQuoteAlt =
  '“Genuinely the comfiest stroller we\'ve tried — zero fussing from my toddler.”'
const instagramQuote = '"Love it! My daughter doesn\'t even fuss on long walks anymore.'
const crSeatQuote =
  '“Seat cushioning compressed quickly and offered little support during longer rides.”'
const redditFussQuote = '"My daughter fusses to get out after one loop around the block.”'

/* ---------- Live inline_annotations mapping ---------- */
const AV: Record<string, string> = {
  consumer_reports: asset.avatarCr,
  reddit: asset.avatarReddit,
  instagram: asset.avatarInstagram,
  youtube: asset.link, // YouTube is banned in the prompt; neutral icon if it ever appears
  web: asset.link, // honest: a web source shows a link glyph, not an Instagram face
}
const SOURCE_LABEL: Record<string, string> = {
  consumer_reports: 'Consumer Reports',
  reddit: 'Reddit',
  instagram: 'Instagram',
  youtube: 'YouTube',
  web: 'Web',
}

/** Renders a live annotation's evidence as source cards (falls back to nothing if empty). */
function LiveSources({ evidence }: { evidence: Evidence[] }) {
  // Drop youtube + direct competitors (Wirecutter, BabyGearLab, ...) from displayed evidence.
  const shown = cleanEvidence(evidence)
  if (shown.length === 0) return null
  return (
    <SourceRow>
      {shown.slice(0, 2).map((e, i) => (
        <SourceCard
          key={i}
          avatar={AV[e.source_type] ?? asset.avatarReddit}
          name={SOURCE_LABEL[e.source_type] ?? e.source_name}
          quote={e.quote}
          chip={e.source_name}
          fixed={false}
        />
      ))}
    </SourceRow>
  )
}

/* ---------- Exported screen ---------- */
export function AnnotationsScreen() {
  const [params, setParams] = useSearchParams()

  // Intro tooltip — shown once when arriving from the Product Insights page, before the callout.
  const [intro, setIntro] = useState(params.get('intro') === '1')
  const dismissIntro = () => {
    setIntro(false)
    const next = new URLSearchParams(params)
    next.delete('intro')
    setParams(next, { replace: true })
  }

  // On the base screen, hovering the highlighted claim reveals the misleading-claim callout.
  // The callout has clickable source links, so don't close it the instant the cursor leaves the
  // highlight — keep it open with a grace period, and while the cursor is over the callout itself.
  const [showMisleading, setShowMisleading] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const openCallout = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setShowMisleading(true)
  }
  const closeCalloutSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setShowMisleading(false), 300)
  }

  // Fetch live inline annotations once; index them by verdict so each callout can use its own.
  const [annById, setAnnById] = useState<Record<string, InlineAnnotation>>({})
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    // Product must exist in the CR dataset (v5 roster — see `backend-data/README.md`), otherwise
    // the agent has nothing to reconcile the page's claims against.
    callConnie({
      message:
        'Verify the marketing claims on this Baby Trend Passport Switch 6-in-1 product page.',
    })
      .then((r) => {
        if (isInlineAnnotations(r)) {
          const map: Record<string, InlineAnnotation> = {}
          for (const a of r.inline_annotations) map[a.verdict] = a
          setAnnById(map)
        }
      })
      .catch(() => {
        /* keep baked callouts on error */
      })
  }, [])
  // Only use a live annotation if it still has valid evidence after filtering youtube/competitors;
  // otherwise fall back to the designed (evidenced) callout — never show an evidence-less claim.
  const valid = (a?: InlineAnnotation) => (a && cleanEvidence(a.evidence).length > 0 ? a : undefined)
  const connected = usePreferences((s) => s.sources) // communities picked in onboarding
  const annMis = valid(annById['misleading'])

  /* ---- Intro coach mark (arrives from Product Insights via ?intro=1) ---- */
  if (intro) {
    return (
      <FigmaFrame backdrop={asset.backdrop} backdropOpacity={0.4}>
        {/* Highlighted claim the user "pointed to" */}
        <div
          className="absolute rounded-[4px]"
          style={{ left: 597, top: 569, width: 248, height: 21, opacity: 0.3, background: '#ae0d00' }}
        />
        <div
          className="absolute rounded-[4px]"
          style={{ left: 579, top: 565, width: 276, height: 30, border: '2.5px solid #050500' }}
        />

        {/* Dark tooltip bubble + arrow pointing right toward the highlight */}
        <div className="absolute flex items-center" style={{ left: 154, top: 480 }}>
          <div
            className="flex w-[397px] flex-col items-start gap-[18px] overflow-clip rounded-[16px] bg-fg-primary p-[28px]"
            style={{ boxShadow: '0px 10px 28px 0px rgba(0,0,0,0.22)' }}
          >
            <div className="flex items-start rounded-[999px] bg-bg-primary px-[12px] py-[5px]">
              <p className="whitespace-nowrap text-[12px] font-semibold leading-[16px] text-fg-primary">
                INLINE ANNOTATION
              </p>
            </div>
            <p className="text-[16px] font-normal leading-[24px] text-fg-inverse">
              Highlight anything you're unsure about. Connie only checks what you point to and searches
              CR's tests and community live, so the colored flags appear right after you highlight.
            </p>
          </div>
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: '16px solid transparent',
              borderBottom: '16px solid transparent',
              borderLeft: '14px solid #050500',
            }}
          />
        </div>

        {/* Got it pill */}
        <div
          className="absolute flex w-[143px] items-center overflow-clip rounded-[999px] bg-white px-[22px] py-[12px]"
          style={{ left: 647, top: 794, boxShadow: '0px 8px 24px 0px rgba(0,0,0,0.14)' }}
        >
          <button
            onClick={dismissIntro}
            className="flex h-[48px] flex-1 items-center justify-center rounded-[48px] bg-brand text-[16px] font-semibold text-fg-inverse"
          >
            Got it ✓
          </button>
        </div>

        <NaviRail />
      </FigmaFrame>
    )
  }

  return (
    <FigmaFrame backdrop={asset.backdrop} backdropOpacity={showMisleading ? 0.7 : 1}>
      {/* Highlighted claim on the page — hovering it reveals the misleading-claim callout;
          moving off it returns to the base screen. No black border in either state. */}
      <div
        className="absolute cursor-pointer"
        style={{ left: 579, top: 563, width: 276, height: 34 }}
        onMouseEnter={openCallout}
        onMouseLeave={closeCalloutSoon}
        onClick={() => setShowMisleading((s) => !s)}
      >
        <div
          className="absolute rounded-[4px]"
          style={{ left: 18, top: 6, width: 248, height: 21, background: '#ae0d00', opacity: 0.3 }}
        />
      </div>

      {/* Misleading — CR + community (1052:2717) */}
      {showMisleading && (
        <Callout
          style={{ left: 802, top: 598 }}
          icon={asset.xcircle}
          title={annMis?.verdict_label ?? 'Misleading claim'}
          subtitle={annMis?.explanation ?? "Doesn't match what our testers and real users are saying."}
          onClose={() => setShowMisleading(false)}
          onMouseEnter={openCallout}
          onMouseLeave={closeCalloutSoon}
        >
          {annMis ? (
            <LiveSources evidence={annMis.evidence} />
          ) : (
            <SourceRow>
              <SourceCard
                avatar={asset.avatarCr}
                name="Consumer Reports "
                quote={crSeatQuote}
                chip="Baby Trend Stroller Review"
              />
              {connected.includes('Reddit') && (
                <SourceCard
                  avatar={asset.avatarReddit}
                  name="Reddit"
                  quote={redditFussQuote}
                  chip="Best Strollers: Thread"
                />
              )}
            </SourceRow>
          )}
        </Callout>
      )}

      <NaviRail />
    </FigmaFrame>
  )
}
