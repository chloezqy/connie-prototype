import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { routes } from '@/app/routes'
import { useCollabStore } from '@/store/useCollabStore'
import { NaviRail } from '@/components/connie/NaviRail'
import { ProductBackdrop } from '@/components/connie/RetailBackdrop'
import { DimOverlay } from '@/components/connie/DimOverlay'
import { ANNOTATION_REQUEST_MESSAGE } from '@/api/connieRequests'
import { cn } from '@/lib/cn'
import { LOADING_MS, MAX_LOADING_MS } from '@/lib/timing'
import { callConnieCached, peekConnieCache } from '@/api/connieClient'
import { isInlineAnnotations, type Evidence, type InlineAnnotation } from '@/types/connie-contract'
import { cleanEvidence } from '@/lib/sourceFilter'

/* ---------- Annotation asset paths (public/figma) ---------- */
const asset = {
  xcircle: '/figma/annot-xcircle.svg',
  link: '/figma/annot-link.svg',
  arrow: '/figma/annot-arrow.svg',
  x: '/figma/annot-x.svg',
  avatarCr: '/figma/annot-avatar-cr.png',
  avatarReddit: '/figma/annot-avatar-reddit.png',
  avatarInstagram: '/figma/annot-avatar-instagram.png',
}

/* ---------- Geometry ---------- */
const FRAME_W = 1440
const FRAME_H = 900
const CALLOUT_W = 520
/** Roughly how tall each surface renders — used to flip it above a highlight low on the page. */
const CALLOUT_H = 280
const VERIFYING_H = 76
/** A drag shorter than this is a click, not a selection. */
const MIN_DRAG_PX = 40

type Rect = { left: number; top: number; width: number; height: number }

/**
 * Anchor a floating surface to the highlight it belongs to: directly below when there's room,
 * flipped above when there isn't, always inside the frame.
 *
 * `h` is the surface's own height, so the small verifying card sits tight against the highlight
 * instead of being positioned as if it were the (much taller) verdict callout.
 */
function anchorTo(r: Rect, h: number): CSSProperties {
  const below = r.top + r.height + 14
  const fitsBelow = below + h <= FRAME_H - 16
  return {
    left: Math.min(Math.max(r.left - 8, 16), FRAME_W - CALLOUT_W - 16),
    top: fitsBelow ? below : Math.max(16, r.top - h - 14),
  }
}

/* ---------- Connie annotation callout ---------- */

type Source = {
  avatar: string
  name: string
  quote: string
  chip: string
  ring?: boolean
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
              className={cn('size-[16px] rounded-full object-cover', ring && 'border-[0.5px] border-white')}
            />
            <p className="whitespace-nowrap text-[12px] font-semibold leading-[16px] text-fg-primary">{name}</p>
          </div>
          <p className="w-full text-[12px] font-normal leading-[17px] text-fg-primary">{quote}</p>
        </div>
        {/* max-w-full + truncate: these are real link titles now, and a nowrap chip just ran off
            the edge of the card. */}
        <div className="flex max-w-full items-center gap-[4px] rounded-[80px] border-[0.5px] border-border-subtle bg-white py-[2px] pl-[8px] pr-[10px]">
          <img alt="" src={asset.link} className="size-[14px] shrink-0" />
          <p className="truncate text-[10px] leading-[20px] tracking-[0.1px] text-[#222]">{chip}</p>
          <img alt="" src={asset.arrow} className="size-[12px] shrink-0" />
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
      className="absolute z-20 flex flex-col items-start gap-[12px] overflow-clip rounded-md border-[0.5px] border-[#c5c5c5] bg-bg-secondary p-[24px] shadow-panel"
      style={{ width: CALLOUT_W, ...style }}
    >
      <div className="flex w-full flex-col items-start gap-[6px] pr-[28px]">
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
        className="absolute right-[22px] top-[22px] block cursor-pointer"
      >
        <img alt="" src={asset.x} className="size-[18px]" />
      </button>
    </div>
  )
}

function SourceRow({ children }: { children: ReactNode }) {
  return <div className="flex w-full items-start gap-[12px] rounded-[8px] p-[8px]">{children}</div>
}

/* ---------- Source content (Figma copy, verbatim) ---------- */
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

/* ---------- Verifying loader ---------- */
function Sparkle({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
      <path d="M12 2l1.7 6.1a3 3 0 0 0 2.2 2.2L22 12l-6.1 1.7a3 3 0 0 0-2.2 2.2L12 22l-1.7-6.1a3 3 0 0 0-2.2-2.2L2 12l6.1-1.7a3 3 0 0 0 2.2-2.2L12 2z" />
    </svg>
  )
}

/** Yellow-green "Connie is verifying" animation, shown while the claim is being checked.
 *  The card itself is opaque — the motion lives in the sparkles and the dots. It used to carry
 *  `animate-pulse`, which faded the whole card to 50% and let the page bleed through it. */
function VerifyingCard({ style }: { style: CSSProperties }) {
  return (
    <div
      className="absolute z-20 flex items-center gap-[14px] overflow-clip rounded-[16px] border-[0.5px] border-[#c5c5c5] bg-gradient-to-r from-[#d9ede2] to-[#fbf5dd] px-[22px] py-[18px] shadow-panel"
      style={{ width: 320, ...style }}
    >
      <div className="relative flex size-[40px] shrink-0 items-center justify-center rounded-[10px] bg-brand">
        <span className="text-[22px] font-semibold leading-none text-white">C</span>
        <Sparkle className="absolute -right-[7px] -top-[7px] size-[16px] animate-pulse text-[#bfd730]" />
        <Sparkle
          className="absolute -bottom-[5px] -left-[5px] size-[11px] animate-pulse text-[#ffd500]"
          style={{ animationDelay: '0.4s' }}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-[3px]">
        <div className="flex items-center gap-[8px]">
          <p className="text-[15px] font-semibold text-fg-primary">Verifying claim</p>
          <span className="flex gap-[3px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-[5px] animate-bounce rounded-full bg-fg-brand"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        </div>
        <p className="text-[12px] leading-[16px] text-fg-secondary">Checking CR tests &amp; community sources</p>
      </div>
    </div>
  )
}

/* ---------- Connie's nudge ---------- */
/** The "bing!" — Connie noticing there are claims on this page worth checking. */
function HighlightNudge({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="absolute z-30 flex w-[330px] flex-col gap-[10px] rounded-[16px] border-[0.5px] border-border-subtle bg-bg-secondary p-[18px] shadow-panel"
      style={{ left: 122, bottom: 44 }}
    >
      <div className="flex items-center gap-[8px]">
        <img src="/figma/C.png" alt="" className="size-[22px] object-contain" />
        <p className="flex-1 text-[14px] font-semibold leading-[20px] text-fg-primary">
          Not sure about a claim here?
        </p>
        <button aria-label="Dismiss" onClick={onDismiss} className="size-[14px] shrink-0">
          <img src={asset.x} alt="" className="size-full" />
        </button>
      </div>
      <p className="text-[14px] leading-[20px] text-fg-secondary">
        Highlight any line on this page and I'll check it against CR's lab tests and what other
        parents actually say.
      </p>
      {/* Tail pointing down-left at the "C". */}
      <div
        className="absolute"
        style={{
          left: -9,
          bottom: 20,
          width: 0,
          height: 0,
          borderTop: '9px solid transparent',
          borderBottom: '9px solid transparent',
          borderRight: '9px solid var(--color-bg-secondary)',
        }}
      />
    </div>
  )
}

/* ---------- Exported screen ---------- */
/**
 * The product detail page. It opens as the pure retailer page — no highlights, nothing drawn on
 * it. Connie nudges from the corner; the shopper drags across any claim; that selection is what
 * gets verified. Connie only ever checks what you point at.
 */
export function AnnotationsScreen() {
  const navigate = useNavigate()
  /** Once the list has been shared, the shopping half of the story is done — this is where the
   *  time-skip into the post-purchase check-in lives. */
  const hasShared = useCollabStore((s) => s.shared)
  type Phase = 'idle' | 'loading' | 'result'
  const [phase, setPhase] = useState<Phase>('idle')
  const [nudge, setNudge] = useState(false)
  /** The live drag, and the committed selection it becomes. */
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const [selection, setSelection] = useState<Rect | null>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)

  /* --- Connie's "bing" a beat after landing on the page. Not once the list has been shared:
         by then the shopper has done the verifying, and the only thing left is the time skip. --- */
  useEffect(() => {
    if (hasShared) return
    const t = window.setTimeout(() => setNudge(true), 900)
    return () => window.clearTimeout(t)
  }, [hasShared])

  /* --- Drag to select --- */
  const pointFromEvent = (e: React.PointerEvent) => {
    const box = surfaceRef.current?.getBoundingClientRect()
    if (!box) return { x: 0, y: 0 }
    // The frame is CSS-scaled to fit the viewport, so map back into frame coordinates.
    const scale = box.width / FRAME_W
    return { x: (e.clientX - box.left) / scale, y: (e.clientY - box.top) / scale }
  }
  const onPointerDown = (e: React.PointerEvent) => {
    if (phase !== 'idle') return
    const { x, y } = pointFromEvent(e)
    setDrag({ x0: x, y0: y, x1: x, y1: y })
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return
    const { x, y } = pointFromEvent(e)
    setDrag((d) => (d ? { ...d, x1: x, y1: y } : d))
  }
  const onPointerUp = () => {
    if (!drag) return
    const rect = dragRect(drag)
    setDrag(null)
    // A short drag is a click, not a selection — leave the page alone.
    if (rect.width < MIN_DRAG_PX) return
    setNudge(false)
    setSelection(rect)
    setVerifyMinDone(false)
    setPhase('loading')
  }

  /** The drag as a text-selection-shaped rect: at least one line tall. */
  const dragRect = (d: { x0: number; y0: number; x1: number; y1: number }): Rect => {
    const left = Math.min(d.x0, d.x1)
    const top = Math.min(d.y0, d.y1)
    const width = Math.abs(d.x1 - d.x0)
    const height = Math.max(Math.abs(d.y1 - d.y0), 22)
    return { left, top: top - 3, width, height }
  }

  /* --- Verify: LOADING_MS floor + the real fetch, whichever is slower --- */
  const [verifyMinDone, setVerifyMinDone] = useState(false)
  useEffect(() => {
    if (phase !== 'loading') return
    const t = window.setTimeout(() => setVerifyMinDone(true), LOADING_MS)
    return () => window.clearTimeout(t)
  }, [phase])

  const dismiss = () => {
    setPhase('idle')
    setSelection(null)
    setVerifyMinDone(false)
  }

  // Fetch live inline annotations once; index them by verdict so each callout can use its own.
  //
  // We send the actual bold marketing claims from the page (the ones the UI highlights), not just
  // "verify the claims" — otherwise the agent has nothing concrete to check and replies with chat
  // asking us to provide them. With the claims in hand it reconciles each against the CR lab data:
  // the "FOLDS WITH ONE HAND" claim is the key one — CR's data says it's a two-step, two-handed,
  // bulky fold, so it should come back `misleading`.
  const ANN_REQUEST = { message: ANNOTATION_REQUEST_MESSAGE }
  /** Seed from the session cache so returning to this screen doesn't re-verify. */
  const cachedAnns = () => {
    const hit = peekConnieCache(ANN_REQUEST)
    if (!hit || !isInlineAnnotations(hit)) return {}
    const map: Record<string, InlineAnnotation> = {}
    for (const a of hit.inline_annotations) map[a.verdict] = a
    return map
  }
  const [annById, setAnnById] = useState<Record<string, InlineAnnotation>>(cachedAnns)
  // Has the fetch finished (either way)? The verify animation must not resolve before this —
  // otherwise the callout opens on a timer and shows the baked copy, which looks entirely real.
  const [annSettled, setAnnSettled] = useState(() => peekConnieCache(ANN_REQUEST) !== null)
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current || annSettled) return
    didFetch.current = true
    // Ceiling: a hung backend must not trap the user in a permanent "Verifying…" state. Keep this
    // comfortably longer than a real call (this one does live web searches) — if it fires
    // mid-flight, the baked callout appears while the real verdict is still coming.
    const cap = window.setTimeout(() => setAnnSettled(true), MAX_LOADING_MS)
    callConnieCached(ANN_REQUEST)
      .then((r) => {
        if (isInlineAnnotations(r)) {
          const map: Record<string, InlineAnnotation> = {}
          for (const a of r.inline_annotations) map[a.verdict] = a
          setAnnById(map)
        } else {
          console.warn('[Connie] Annotations fell back to baked callouts: backend returned', r)
        }
      })
      .catch((err) => {
        console.warn('[Connie] Annotations fetch failed, showing baked callouts:', err)
      })
      .finally(() => {
        window.clearTimeout(cap)
        setAnnSettled(true)
      })
    return () => window.clearTimeout(cap)
  }, [annSettled])
  // Only use a live annotation if it still has valid evidence after filtering youtube/competitors;
  // otherwise fall back to the designed (evidenced) callout — never show an evidence-less claim.
  const valid = (a?: InlineAnnotation) => (a && cleanEvidence(a.evidence).length > 0 ? a : undefined)
  const annMis = valid(annById['misleading'])

  // Promote loading → result only when BOTH are true: the animation has run its minimum, and the
  // real verdict has arrived (or the fetch failed, in which case we fall back to the baked callout
  // rather than hanging). This is what stops the mock from popping up mid-verify.
  useEffect(() => {
    if (phase === 'loading' && verifyMinDone && annSettled) setPhase('result')
  }, [phase, verifyMinDone, annSettled])

  const liveRect = drag ? dragRect(drag) : null
  const shownRect = liveRect ?? selection
  /** Neutral marker while selecting/verifying; the verdict's own colour once it lands. */
  const markColor = phase === 'result' ? '#ae0d00' : '#ffd500'

  return (
    <FigmaFrame>
      {/* The retailer page at full colour, with nothing drawn on it. */}
      <ProductBackdrop />

      {/* Selection surface — the whole page is highlightable. */}
      <div
        ref={surfaceRef}
        className={cn('absolute inset-0', phase === 'idle' && 'cursor-text')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
      />

      {/* The shopper's highlight, drawn exactly where they dragged. */}
      {shownRect && (
        <div
          className="pointer-events-none absolute rounded-[3px] transition-colors"
          style={{
            left: shownRect.left,
            top: shownRect.top,
            width: shownRect.width,
            height: shownRect.height,
            background: markColor,
            opacity: 0.32,
          }}
        />
      )}

      {/* 10% scrim under the verdict — the page stays full colour. */}
      {phase === 'result' && <DimOverlay onClick={dismiss} />}
      {/* The highlight has to stay legible through the scrim, so redraw it on top. */}
      {phase === 'result' && shownRect && (
        <div
          className="pointer-events-none absolute z-10 rounded-[3px]"
          style={{
            left: shownRect.left,
            top: shownRect.top,
            width: shownRect.width,
            height: shownRect.height,
            background: markColor,
            opacity: 0.32,
          }}
        />
      )}

      {phase === 'loading' && selection && <VerifyingCard style={anchorTo(selection, VERIFYING_H)} />}

      {phase === 'result' && selection && (
        <Callout
          style={anchorTo(selection, CALLOUT_H)}
          icon={asset.xcircle}
          title={annMis?.verdict_label ?? 'Misleading claim'}
          subtitle={annMis?.explanation ?? "Doesn't match what our testers and real users are saying."}
          onClose={dismiss}
        >
          {annMis ? (
            <LiveSources evidence={annMis.evidence} />
          ) : (
            /* The designed callout: CR's lab finding beside the community's, which is the whole
               point of the verdict — one source alone doesn't make a claim "misleading". */
            <SourceRow>
              <SourceCard
                avatar={asset.avatarCr}
                name="Consumer Reports"
                quote={crSeatQuote}
                chip="CR Stroller Test Report"
                fixed={false}
              />
              <SourceCard
                avatar={asset.avatarReddit}
                name="Reddit"
                quote={redditFussQuote}
                chip="r/BeyondTheBump · “Seat padding?”"
                fixed={false}
              />
            </SourceRow>
          )}
        </Callout>
      )}

      {nudge && phase === 'idle' && <HighlightNudge onDismiss={() => setNudge(false)} />}

      {/* The scene transition into the post-purchase loop. It only appears once the list has been
          shared, because that's the end of the shopping story — before then there's nothing to
          check in about. Deliberately styled as a chapter marker, not as page furniture: it's the
          prototype's clock, not something the real extension would render. */}
      {hasShared && (
        <button
          onClick={() => navigate(routes.postPurchase)}
          className="absolute left-1/2 top-[104px] z-30 flex -translate-x-1/2 items-center gap-[10px] rounded-pill bg-fg-primary py-[10px] pl-[18px] pr-[16px] text-white shadow-panel transition-transform hover:scale-[1.03]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" strokeLinecap="round" />
          </svg>
          <span className="whitespace-nowrap text-[14px] font-semibold leading-[20px]">
            Two weeks later
          </span>
          <span className="text-[14px] leading-[20px] text-white/60">→</span>
        </button>
      )}

      <NaviRail notify={nudge && phase === 'idle'} />
    </FigmaFrame>
  )
}
