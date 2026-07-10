import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { CRLauncher } from '@/components/connie/CRLauncher'
import { cn } from '@/lib/cn'
import { callConnie } from '@/api/connieClient'
import { isInlineAnnotations, type Evidence, type InlineAnnotation } from '@/types/connie-contract'

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

/** Connie Navi bar — collapsed icon rail. Absolute left 51 / top 523 (Figma 1052:5191). */
function NaviBar() {
  return (
    <div
      className="absolute flex items-center rounded-[8px] border-[0.5px] border-border-subtle bg-white p-[10px] drop-shadow-[0px_0px_7.5px_rgba(5,5,0,0.16)]"
      style={{ left: 51, top: 523 }}
    >
      <div className="flex flex-col items-start gap-[16px]">
        <div className="flex flex-col items-start gap-[16px]">
          <img alt="" src={asset.naviChat} className="size-[40px]" />
          <img alt="" src={asset.naviHeart} className="size-[40px]" />
        </div>
        <div className="h-[2px] w-[40px] bg-[#e1e1e1]" />
        <div className="flex flex-col items-start gap-[16px]">
          <img alt="" src={asset.naviGear} className="size-[40px]" />
          <img alt="" src={asset.naviQuestion} className="size-[40px]" />
        </div>
      </div>
    </div>
  )
}

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
}: {
  style: CSSProperties
  icon: string
  title: string
  subtitle: string
  children?: ReactNode
  onClose: () => void
}) {
  return (
    <div
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
  youtube: asset.avatarReddit,
  web: asset.avatarInstagram,
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
  if (evidence.length === 0) return null
  return (
    <SourceRow>
      {evidence.slice(0, 2).map((e, i) => (
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
  const initial = (params.get('state') as StateKey) || 'base'
  const [state, setStateRaw] = useState<StateKey>(
    STATE_ORDER.some((s) => s.key === initial) ? initial : 'base',
  )

  const setState = (s: StateKey) => {
    setStateRaw(s)
    const next = new URLSearchParams(params)
    next.set('state', s)
    setParams(next, { replace: true })
  }

  // Fetch live inline annotations once; index them by verdict so each callout can use its own.
  const [annById, setAnnById] = useState<Record<string, InlineAnnotation>>({})
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    callConnie({ message: 'Verify the marketing claims on this UppaBaby Vista V2 product page.' })
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
  const annBoth = annById['verified_by_both']
  const annComm = annById['verified_by_community_only']
  const annMis = annById['misleading']
  const annUnv = annById['unverifiable']

  return (
    <FigmaFrame backdrop={asset.backdrop} backdropOpacity={state === 'base' ? 1 : 0.7}>
      {/* Highlighted claim(s) on the retailer page */}
      {(state === 'base' || state === 'misleading') && (
        <Highlight left={597} top={569} width={248} color="#ae0d00" opacity={0.3} />
      )}
      {state === 'verified-both' && (
        <Highlight left={601} top={570} width={244} color="#00803e" />
      )}
      {state === 'verified-community' && (
        <>
          <Highlight left={598} top={401} width={368} color="#003866" />
          <Highlight left={601} top={570} width={244} color="rgba(0,128,62,0.2)" />
        </>
      )}
      {state === 'unverifiable' && (
        <Highlight left={598} top={570} width={249} color="#ffa500" />
      )}

      {/* Verified — CR + community (1052:2759) */}
      {state === 'verified-both' && (
        <Callout
          style={{ left: 802, top: 598 }}
          icon={asset.check}
          title={annBoth?.verdict_label ?? 'Verified claim'}
          subtitle={annBoth?.explanation ?? 'Matches what our testers and real users are saying. '}
          onClose={() => setState('base')}
        >
          {annBoth ? (
            <LiveSources evidence={annBoth.evidence} />
          ) : (
            <SourceRow>
              <SourceCard
                avatar={asset.avatarCr}
                name="Consumer Reports "
                quote={crPaddingQuote}
                chip="Baby Trend Stroller Review"
              />
              <SourceCard
                avatar={asset.avatarReddit}
                name="Reddit"
                quote={redditComfyQuote}
                chip="Best Strollers: Thread"
              />
            </SourceRow>
          )}
        </Callout>
      )}

      {/* Verified — community, not CR (1052:2806) */}
      {state === 'verified-community' && (
        <Callout
          style={{ left: 802, top: 598 }}
          icon={asset.check}
          title={annComm?.verdict_label ?? 'Verified claim'}
          subtitle={
            annComm?.explanation ??
            "Our testers haven't reviewed this product, but it matches what real users are saying."
          }
          onClose={() => setState('base')}
        >
          {annComm ? (
            <LiveSources evidence={annComm.evidence} />
          ) : (
            <SourceRow>
              <SourceCard
                avatar={asset.avatarReddit}
                name="Reddit"
                quote={redditComfyQuoteAlt}
                chip="Best Strollers: Thread"
                fixed={false}
              />
              <SourceCard
                avatar={asset.avatarInstagram}
                name="Instagram"
                quote={instagramQuote}
                chip="@dad_at_home’s post"
                ring={false}
                fixed={false}
              />
            </SourceRow>
          )}
        </Callout>
      )}

      {/* Misleading — CR + community (1052:2717) */}
      {state === 'misleading' && (
        <Callout
          style={{ left: 802, top: 598 }}
          icon={asset.xcircle}
          title={annMis?.verdict_label ?? 'Misleading claim'}
          subtitle={annMis?.explanation ?? "Doesn't match what our testers and real users are saying."}
          onClose={() => setState('base')}
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
              <SourceCard
                avatar={asset.avatarReddit}
                name="Reddit"
                quote={redditFussQuote}
                chip="Best Strollers: Thread"
              />
            </SourceRow>
          )}
        </Callout>
      )}

      {/* Unable to verify (1052:2855) — offset callout at left 741 / top 609 */}
      {state === 'unverifiable' && (
        <Callout
          style={{ left: 741, top: 609 }}
          icon={asset.question}
          title={annUnv?.verdict_label ?? 'Unable to verify claim'}
          subtitle={
            annUnv?.explanation ??
            'Connie didn’t have enough info to confirm or dispute this claim. Add more trusted sources to help verify it.'
          }
          onClose={() => setState('base')}
        >
          <div className="flex w-full flex-col items-center gap-[12px] py-[8px]">
            <button className="flex flex-col items-start rounded-[48px] bg-[#404040] px-[24px] py-[8px]">
              <span className="whitespace-nowrap text-[14px] font-semibold leading-[24px] text-white">
                Add more sources
              </span>
            </button>
          </div>
        </Callout>
      )}

      <NaviBar />
      <CRLauncher style={{ left: 52, top: 792 }} />

      {/* Dev control — switch between the five states (not part of the Figma frame) */}
      <div className="fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 gap-[4px] rounded-pill border border-border-subtle bg-white/95 p-[4px] shadow-panel backdrop-blur">
        {STATE_ORDER.map((s) => (
          <button
            key={s.key}
            onClick={() => setState(s.key)}
            className={cn(
              'rounded-pill px-[12px] py-[4px] text-[12px] font-medium transition-colors',
              state === s.key ? 'bg-brand text-white' : 'text-fg-secondary hover:text-fg-primary',
            )}
          >
            {s.short}
          </button>
        ))}
      </div>
    </FigmaFrame>
  )
}
