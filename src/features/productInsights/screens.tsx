import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { routes } from '@/app/routes'
import { callConnie } from '@/api/connieClient'
import { isProductInsights, type ProductInsightsPayload } from '@/types/connie-contract'
import {
  usePreferences,
  preferencesToPriorities,
  ALL_PREFERENCES,
  ALL_COMMUNITIES,
} from '@/store/usePreferences'
import { communityPosts, type CommunitySource } from '@/mocks/communityPosts'
import { cleanEvidence } from '@/lib/sourceFilter'
import { NaviRail } from '@/components/connie/NaviRail'
import { RetailBackdrop } from '@/components/connie/RetailBackdrop'
import { IconHeart } from '@/components/icons'

/* The three strollers below are the ones actually visible on the retail backdrop
 * (`public/figma/insights-bg.png`, an Amazon search page). They must stay in sync with the
 * CR dataset — see `backend-data/README.md`. If you change the roster, change it in three
 * places: this file, the CR data file, and the roster count in the Langflow prompt. */

/** Centre product (green badge, left: 796) — drives the live product_insights request. */
const LIVE_PRODUCT = 'Baby Trend Passport Switch 6-in-1'

/** The two not-recommended strollers, keyed by which grey badge opens them.
 *  `pos` anchors each panel near its product card (panel is 540 wide in a 1440 frame, so the
 *  right-hand one is clamped to stay on canvas). Both panels remain draggable. */
const NOT_REC_PRODUCTS = {
  left: {
    name: 'Dream On Me Aero Travel Umbrella Stroller',
    pos: { left: 176, top: 170 },
  },
  right: {
    name: 'Graco Ready2Grow 2.0 Double Stroller',
    pos: { left: 880, top: 170 },
  },
} as const

type NotRecSlot = keyof typeof NOT_REC_PRODUCTS

/* ------------------------------------------------------------------ *
 * Product Insights — faithful reproduction of Figma frames
 *   1052:2526  base (RECOMMENDED panel on the Amazon page)
 *   1052:2688  expanded row (Top Rated → CR + Reddit detail)
 *   1052:2633  scrolled (rows + heads-up + LIKE THIS REC footer)
 *   1052:2880  info tooltip ("BASED ON" popover)
 *   1052:2545  NOT RECOMMENDED variant
 *   1052:2652  navi-bar menu open (no panel)
 *   1052:2670  collapsed (launcher only)
 * ------------------------------------------------------------------ */

const A = '/figma/insights-'
const bg = `${A}bg.png`

type Variant = 'collapsed' | 'menu' | 'recommended' | 'expanded' | 'tooltip' | 'notrec'

/* ---------------------------------------------------------------- Sources */
function Sources({
  imgs,
  size = 16,
  className,
}: {
  imgs: string[]
  size?: number
  className?: string
}) {
  return (
    <div className={`flex items-center gap-[2px] ${className ?? ''}`}>
      <div className="relative h-[28px] opacity-80" style={{ width: 28 }}>
        <img
          src={imgs[0]}
          alt=""
          className="absolute top-[6px] rounded-full border-[0.5px] border-white object-cover"
          style={{ left: 0, width: size, height: size }}
        />
        <img
          src={imgs[1]}
          alt=""
          className="absolute top-[6px] rounded-full border-[0.5px] border-white object-cover"
          style={{ left: 11, width: size, height: size }}
        />
      </div>
      <span className="whitespace-nowrap text-[12px] font-semibold leading-[16px] text-fg-secondary">+1</span>
    </div>
  )
}

/* ------------------------------------------------------------ Recommended row */
type DetailBlock = { source: string; text: string; chipImg: string; chipLabel: string }
type RowData = {
  icon: string
  iconSize: number
  title: string
  subtitle: string
  sources: string[]
  detail: DetailBlock[]
}

const av5 = `${A}av5.png`
const av7 = `${A}av7.png`
const av18 = `${A}av18.png`

const rows: RowData[] = [
  {
    icon: `${A}toprated.svg`,
    iconSize: 20,
    title: 'Top Rated',
    subtitle: 'No bumps in the road here. CR and parents agree: this one earns its reputation.',
    sources: [av5, av7],
    detail: [
      {
        source: 'Consumer Reports',
        text: 'Our lab testers scored this 91/100, with top marks across maneuverability, ease of use, and safety. Lab testers found it outperforms most competing strollers in these areas.',
        chipImg: av7,
        chipLabel: 'Baby Trend Stroller Review',
      },
      {
        source: 'Reddit',
        text: 'Users in r/BeyondtheBump and r/Parenting highly recommend this stroller as a long-term investment. Of 719 Reddit mentions surveyed, 567 were positive, with praise centered on ride smoothness, durability, and resale value.',
        chipImg: av5,
        chipLabel: 'Best Strollers: Thread',
      },
    ],
  },
  {
    icon: `${A}city.svg`,
    iconSize: 18,
    title: 'City Certified',
    subtitle: 'Built for the urban jungle. Handles sidewalks and curbs effortlessly and folds compactly.',
    sources: [av18, av7],
    detail: [
      {
        source: 'Consumer Reports',
        text: 'Compact fold and tight turning radius scored highly in our urban maneuverability tests.',
        chipImg: av7,
        chipLabel: 'City Stroller Guide',
      },
      {
        source: 'Reddit',
        text: 'City parents repeatedly call out how easily it clears curbs and fits through doorways.',
        chipImg: av5,
        chipLabel: 'r/Parenting Thread',
      },
    ],
  },
  {
    icon: `${A}sketch.svg`,
    iconSize: 20,
    title: 'Built to Last',
    subtitle: 'High-quality fabrics and wheels that make resale easy and hand-me-downs an option.',
    sources: [av5, av7],
    detail: [
      {
        source: 'Consumer Reports',
        text: 'Frame and fabric held up through our accelerated wear testing with minimal degradation.',
        chipImg: av7,
        chipLabel: 'Durability Report',
      },
      {
        source: 'Reddit',
        text: 'Owners frequently mention strong resale value and passing units down between siblings.',
        chipImg: av5,
        chipLabel: 'Resale Thread',
      },
    ],
  },
  {
    icon: `${A}cloud.svg`,
    iconSize: 20,
    title: 'Ride in Comfort',
    subtitle: 'Plush seat, smooth suspension, happy kid. Fewer complaints from the passenger seat.',
    sources: [av5, av7],
    detail: [
      {
        source: 'Consumer Reports',
        text: 'Suspension smoothed out rough pavement better than most competitors in our ride tests.',
        chipImg: av7,
        chipLabel: 'Comfort Review',
      },
      {
        source: 'Reddit',
        text: 'Parents note their kids nap more easily thanks to the padded, reclining seat.',
        chipImg: av5,
        chipLabel: 'r/BeyondtheBump',
      },
    ],
  },
  {
    icon: `${A}fold.svg`,
    iconSize: 28,
    title: 'No-Fuss Fold',
    subtitle: 'Snaps open and folds shut in seconds — one hand, no wrestling.',
    sources: [av5, av7],
    detail: [
      {
        source: 'Consumer Reports',
        text: 'The one-hand fold engaged reliably every time in our repeated open/close trials.',
        chipImg: av7,
        chipLabel: 'Fold Mechanism Test',
      },
      {
        source: 'Reddit',
        text: 'Frequent flyers love how quickly it collapses at the gate and in the trunk.',
        chipImg: av5,
        chipLabel: 'Travel Thread',
      },
    ],
  },
]

/* --------- map a live product_insights payload -> the screen's RowData[] --------- */
const CATEGORY_ICON: Record<string, { icon: string; size: number }> = {
  safety: { icon: `${A}toprated.svg`, size: 20 },
  maneuverability: { icon: `${A}city.svg`, size: 18 },
  fold: { icon: `${A}fold.svg`, size: 28 },
  ease_of_use: { icon: `${A}sketch.svg`, size: 20 },
  service: { icon: `${A}sketch.svg`, size: 20 },
  durability: { icon: `${A}sketch.svg`, size: 20 },
  value: { icon: `${A}toprated.svg`, size: 20 },
  comfort: { icon: `${A}cloud.svg`, size: 20 },
}
// Honest source badges: consumer_reports -> CR, reddit -> Reddit, web -> link glyph.
// (Avoids the old decorative face that read as "Instagram" for web sources.)
const SOURCE_AVATAR: Record<string, string> = {
  consumer_reports: av7,
  reddit: av5,
  youtube: `${A}link.svg`,
  web: `${A}link.svg`,
}

/** Avatars for the illustrative community posts — every community offered in onboarding. */
const COMMUNITY_AVATAR: Record<CommunitySource, string> = {
  Instagram: '/figma/comm-instagram.png',
  Reddit: '/figma/comm-reddit.svg',
  YouTube: '/figma/comm-youtube.svg',
  Tiktok: '/figma/comm-tiktok.svg',
  Pinterest: '/figma/comm-pinterest.svg',
  'Online blogs': '/figma/comm-google.svg',
}

/**
 * Build rows from the live product_insights payload, and append ILLUSTRATIVE community posts
 * (Instagram/Reddit) for the sources the shopper connected in onboarding. Real CR + web evidence
 * always comes first; community posts are authored samples (see mocks/communityPosts.ts).
 */
function insightsToRows(payload: ProductInsightsPayload, connectedSources: string[]): RowData[] {
  return payload.insights
    // Never show an insight whose real evidence is entirely youtube/competitors — no unbacked claims.
    .filter((ins) => cleanEvidence(ins.evidence ?? []).length > 0)
    .map((ins) => {
      const meta = CATEGORY_ICON[ins.category] ?? { icon: `${A}toprated.svg`, size: 20 }
      const evidence = cleanEvidence(ins.evidence ?? [])
    const realDetail = evidence.map((e) => ({
      source: e.source_name,
      text: e.quote,
      chipImg: SOURCE_AVATAR[e.source_type] ?? av5,
      chipLabel: e.source_name,
    }))
    const communityDetail = (communityPosts[ins.category] ?? [])
      .filter((p) => connectedSources.includes(p.source))
      .map((p) => ({
        source: p.source,
        text: p.quote,
        chipImg: COMMUNITY_AVATAR[p.source],
        chipLabel: p.handle,
      }))
    const detail = [...realDetail, ...communityDetail]
    return {
      icon: meta.icon,
      iconSize: meta.size,
      title: ins.label,
      subtitle: ins.summary,
      // Avatar stack: lead with a CR/web badge, then the connected community icons.
      sources: [...new Set(detail.map((d) => d.chipImg))].slice(0, 2),
      detail,
    }
  })
}

function CaretButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-bg-tertiary"
      aria-label="Toggle details"
    >
      <img
        src={`${A}caret.svg`}
        alt=""
        className={`h-[9px] w-[12px] transition-transform ${open ? 'rotate-180' : ''}`}
      />
    </button>
  )
}

function InsightRow({
  row,
  first,
  last,
  open,
  onToggle,
}: {
  row: RowData
  first: boolean
  last: boolean
  open: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`relative flex w-full flex-col border-[0.5px] border-[#dfdfd9] bg-white ${
        first ? 'rounded-t-[16px]' : '-mt-[0.5px]'
      } ${last && !open ? 'rounded-b-[16px]' : ''}`}
    >
      <div className="flex items-center justify-between overflow-hidden pb-[20px] pl-[16px] pr-[20px] pt-[16px]">
        <div className="relative flex w-[350px] items-start">
          <div className="flex flex-1 items-start gap-[12px]">
            <div className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-bg-secondary">
              <img src={row.icon} alt="" style={{ width: row.iconSize, height: row.iconSize }} />
            </div>
            <div className="flex flex-1 flex-col gap-[4px]">
              <p className="text-[16px] font-semibold leading-[24px] text-fg-primary">{row.title}</p>
              <p className="text-[14px] leading-[20px] text-[#282923]">{row.subtitle}</p>
            </div>
          </div>
          <Sources imgs={row.sources} className="absolute left-[286px] top-[-2px]" />
        </div>
        <CaretButton open={open} onClick={onToggle} />
      </div>

      {open && (
        <div className="flex flex-col gap-[20px] border-t-[0.5px] border-[#dadada] px-[24px] pb-[16px] pt-[16px]">
          {row.detail.map((d) => (
            <div key={d.source} className="flex flex-col gap-[12px]">
              <div className="flex flex-col gap-[2px]">
                <p className="text-[14px] font-semibold leading-[20px] text-[#272727]">{d.source}</p>
                <p className="text-[14px] leading-[20px] text-[#242424]">{d.text}</p>
              </div>
              <div className="flex w-fit items-center gap-[4px] rounded-full border border-border-subtle bg-white py-[4px] pl-[8px] pr-[12px]">
                <img
                  src={d.chipImg}
                  alt=""
                  className="size-[16px] rounded-full border-[0.5px] border-white object-cover"
                />
                <span className="whitespace-nowrap text-[11px] leading-[16px] text-[#222]">{d.chipLabel}</span>
                <img src={`${A}arrowupright.svg`} alt="" className="size-[12px]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------------------- Popover */
/** Chip in the BASED ON popover. Clickable when `onClick` is given; muted when not selected. */
function Chip({
  img,
  label,
  pencil = true,
  selected = true,
  onClick,
}: {
  img?: string
  label: string
  pencil?: boolean
  selected?: boolean
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`flex h-[34px] items-center gap-[6px] rounded-full border-[0.5px] bg-white py-[6px] pl-[8px] pr-[16px] ${
        selected ? 'border-border-strong' : 'border-dashed border-border-subtle opacity-45'
      } ${onClick ? 'cursor-pointer transition-opacity hover:opacity-100' : ''}`}
    >
      {img && <img src={img} alt="" className="size-[20px] rounded-full border-[0.5px] border-white object-cover" />}
      <span className="whitespace-nowrap text-[14px] leading-[20px] text-[#21211f]">{label}</span>
      {pencil && <img src={`${A}pencil.svg`} alt="" className="size-[16px]" />}
    </Tag>
  )
}

/** Community source name -> icon (shared onboarding assets). CR is always shown. */
const COMMUNITY_ICON: Record<string, string> = {
  Instagram: '/figma/comm-instagram.png',
  Reddit: '/figma/comm-reddit.svg',
  YouTube: '/figma/comm-youtube.svg',
  Tiktok: '/figma/comm-tiktok.svg',
  Pinterest: '/figma/comm-pinterest.svg',
  'Online blogs': '/figma/comm-google.svg',
}

function BasedOnPopover({
  onClose,
  preferences,
  sources,
  onMouseEnter,
  onMouseLeave,
}: {
  onClose: () => void
  preferences: string[]
  sources: string[]
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  // The pencils mean these are editable — toggle a source/preference right here.
  const toggleSource = usePreferences((s) => s.toggleSource)
  const togglePreference = usePreferences((s) => s.togglePreference)
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute z-20 flex flex-col gap-[8px] overflow-hidden rounded-[16px] border-[0.5px] border-border-subtle bg-bg-secondary pb-[16px] pl-[32px] pr-[40px] pt-[24px] shadow-[0px_0px_15px_0px_rgba(5,5,0,0.16)]"
      style={{ left: 731, top: 85, width: 520 }}
    >
      <p className="text-[16px] font-semibold leading-[24px] text-fg-primary">BASED ON:</p>
      <div className="flex flex-col gap-[20px] pb-[12px] pr-[4px] pt-[4px]">
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center gap-[8px]">
            <div className="flex items-center gap-[8px]">
              <img src={`${A}link.svg`} alt="" className="size-[18px]" />
              <span className="text-[16px] leading-[24px] text-fg-primary">Sources:</span>
            </div>
            <div className="flex flex-wrap items-center gap-[8px]">
              {ALL_COMMUNITIES.map((s) => (
                <Chip
                  key={s}
                  img={COMMUNITY_ICON[s]}
                  label={s}
                  selected={sources.includes(s)}
                  onClick={() => toggleSource(s)}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start pl-[94px]">
            <Chip img={av7} label="Consumer Reports" pencil={false} />
          </div>
        </div>
        <div className="flex items-start gap-[8px]">
          <div className="flex shrink-0 items-center gap-[8px] pt-[6px]">
            <img src={`${A}sliders.svg`} alt="" className="size-[20px]" />
            <span className="text-[16px] leading-[24px] text-fg-primary">Preferences:</span>
          </div>
          <div className="flex flex-wrap items-center gap-[8px]">
            {ALL_PREFERENCES.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={preferences.includes(p)}
                onClick={() => togglePreference(p)}
              />
            ))}
          </div>
        </div>
      </div>
      <button onClick={onClose} className="absolute left-[475.5px] top-[22.5px] size-[20px]" aria-label="Close">
        <img src={`${A}x.svg`} alt="" className="size-full" />
      </button>
    </div>
  )
}

/* ------------------------------------------- Insight rows shimmer (in-panel) */
/** Placeholder rows shown while a panel's insights are still being generated.
 *  Same yellow-green gradient as GeneratingOverlay / VerifyingCard so it reads as one animation.
 *  This exists so a panel NEVER shows fabricated mock rows while live data is still in flight —
 *  the mock is only a failure fallback, not a loading state. */
function InsightRowsShimmer({ count = 4 }: { count?: number }) {
  return (
    <div className="flex w-full flex-col" aria-busy="true" aria-label="Generating insights">
      <div className="flex items-center gap-[8px] pb-[12px]">
        <img src={`${A}shootingstar.svg`} alt="" className="size-[16px]" />
        <span className="text-[13px] font-semibold leading-[18px] text-fg-secondary">
          Analyzing this stroller…
        </span>
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-[12px] border-b border-border-subtle py-[18px] last:border-b-0"
        >
          <div
            className="size-[36px] shrink-0 animate-pulse rounded-[8px] bg-gradient-to-br from-[rgba(217,237,226,0.9)] to-[rgba(251,245,221,0.9)]"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
            <div
              className="h-[16px] w-[45%] animate-pulse rounded-[4px] bg-gradient-to-r from-[rgba(217,237,226,0.9)] to-[rgba(251,245,221,0.9)]"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
            <div
              className="h-[12px] w-full animate-pulse rounded-[4px] bg-gradient-to-r from-[rgba(217,237,226,0.7)] to-[rgba(251,245,221,0.7)]"
              style={{ animationDelay: `${i * 0.12 + 0.06}s` }}
            />
            <div
              className="h-[12px] w-[70%] animate-pulse rounded-[4px] bg-gradient-to-r from-[rgba(217,237,226,0.7)] to-[rgba(251,245,221,0.7)]"
              style={{ animationDelay: `${i * 0.12 + 0.12}s` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* --------------------------------------------------- Insight panel (shared) */
type Verdict = 'recommended' | 'notrec'
/** Same fun fact on both the recommended and not-recommended cards. */
const FUN_FACT =
  "The first stroller, built in 1733, wasn't pushed at all — it was pulled by a goat or pony as a decorative novelty for wealthy families."
const VERDICT_CFG: Record<
  Verdict,
  { icon: string; title: string; funFact: string; headsUp: { title: string; text: string } }
> = {
  recommended: {
    icon: `${A}star.svg`,
    title: 'RECOMMENDED',
    funFact: FUN_FACT,
    headsUp: {
      title: 'Heads up on comfort',
      text: 'Great pick overall - just note a few users noted that the seat was less comfortable than expected.',
    },
  },
  notrec: {
    icon: `${A}xcircle.svg`,
    title: 'NOT RECOMMENDED',
    funFact: FUN_FACT,
    headsUp: {
      title: 'One thing in its favor',
      text: "It's among the cheapest options on the shelf - but our testers found the tradeoffs rarely worth it.",
    },
  },
}

/**
 * The floating Connie insight card. RECOMMENDED and NOT RECOMMENDED share this exact layout,
 * colors, spacing, and type - only the verdict icon/title and the row/copy content differ.
 */
function InsightPanel({
  verdict,
  initialExpanded,
  initialTooltip,
  onClose,
  rows,
  preferences,
  sources,
  initialPos,
  loading = false,
}: {
  verdict: Verdict
  initialExpanded: number | null
  initialTooltip: boolean
  onClose: () => void
  rows: RowData[]
  preferences: string[]
  sources: string[]
  /** Where the panel first appears — lets NOT RECOMMENDED anchor to its own product card. */
  initialPos?: { left: number; top: number }
  /** Live insights still in flight — show the shimmer instead of falling back to mock rows. */
  loading?: boolean
}) {
  const cfg = VERDICT_CFG[verdict]
  const [openRow, setOpenRow] = useState<number | null>(initialExpanded)
  const [tooltip, setTooltip] = useState(initialTooltip)
  const [saved, setSaved] = useState(false)

  // The BASED ON popover is interactive (editable chips), so hovering off the ⓘ must not close it
  // instantly — keep it open with a grace period, and while the cursor is over the popover itself.
  const closeTimer = useRef<number | null>(null)
  const openTip = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setTooltip(true)
  }
  const closeTipSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setTooltip(false), 300)
  }

  // Draggable panel position (Figma default 736 / 287).
  const [pos, setPos] = useState(initialPos ?? { left: 736, top: 287 })
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const onDragStart = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, left: pos.left, top: pos.top }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onDragMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    setPos({ left: d.left + (e.clientX - d.x), top: d.top + (e.clientY - d.y) })
  }
  const onDragEnd = () => {
    dragRef.current = null
  }

  return (
    <>
      <div
        className="absolute flex flex-col overflow-hidden rounded-[16px] border-[0.5px] border-[#c5c5c5] bg-bg-secondary shadow-[0px_0px_15px_0px_rgba(5,5,0,0.16)]"
        style={{ left: pos.left, top: pos.top, width: 540, height: 536 }}
      >
        {/* header — drag handle */}
        <div
          className="shrink-0 cursor-grab touch-none pl-[36px] pr-[56px] pt-[28px] active:cursor-grabbing"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
        >
          <div className="flex h-[40px] w-full items-center justify-between px-[8px]">
            <div className="flex items-center gap-[12px]">
              <div className="flex items-center gap-[10px]">
                <img src={cfg.icon} alt="" className="size-[20px]" />
                <span className="whitespace-nowrap text-[18px] font-semibold leading-[22px] tracking-[-0.25px] text-fg-primary">
                  {cfg.title}
                </span>
              </div>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onMouseEnter={openTip}
                onMouseLeave={closeTipSoon}
                onClick={() => setTooltip((t) => !t)}
                aria-label="Based on"
                className="size-[24px]"
              >
                <img src={`${A}info.svg`} alt="" className="size-full" />
              </button>
            </div>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setSaved((s) => !s)}
              className={`flex h-[40px] w-[104px] items-center justify-center gap-[8px] rounded-[24px] border ${
                saved ? 'border-brand bg-brand' : 'border-border-subtle bg-white'
              }`}
            >
              <span
                className={`text-[16px] font-semibold leading-[24px] tracking-[-0.25px] ${
                  saved ? 'text-fg-inverse' : 'text-fg-secondary'
                }`}
              >
                {saved ? 'Saved' : 'Save'}
              </span>
              <IconHeart
                size={16}
                className={saved ? 'text-fg-inverse' : 'text-fg-secondary'}
                style={saved ? { fill: 'currentColor' } : undefined}
              />
            </button>
          </div>
        </div>

        {/* scrollable body — extra right gutter so the scrollbar isn't flush to the edge */}
        <div className="scrollbar-thin mr-[18px] min-h-0 flex-1 overflow-y-auto pl-[36px] pr-[38px] pt-[16px]">
          <div className="flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[24px]">
              {/* DID YOU KNOW — inside the card */}
              <div className="relative flex w-full flex-col gap-[4px] overflow-hidden rounded-[8px] bg-gradient-to-r from-[rgba(217,237,226,0.3)] to-[rgba(251,245,221,0.3)] px-[24px] py-[20px]">
                <div className="flex w-full items-center gap-[8px]">
                  <img src={`${A}shootingstar.svg`} alt="" className="size-[20px]" />
                  <span className="text-[14px] font-semibold leading-[20px] text-[#282923]">DID YOU KNOW?</span>
                </div>
                <p className="w-[330px] text-[14px] leading-[20px] text-[#282923]">{cfg.funFact}</p>
                <img
                  src={`${A}didyouknow.png`}
                  alt=""
                  className="absolute left-[359px] top-[16px] size-[88px] rounded-[8px] object-cover opacity-15"
                />
              </div>

              {/* rows — shimmer while live insights are generating, never mock-then-swap */}
              {loading ? (
                <InsightRowsShimmer />
              ) : (
                <div className="flex w-full flex-col">
                  {rows.map((row, i) => (
                    <InsightRow
                      key={row.title}
                      row={row}
                      first={i === 0}
                      last={i === rows.length - 1}
                      open={openRow === i}
                      onToggle={() => setOpenRow((cur) => (cur === i ? null : i))}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* heads up — yellow on RECOMMENDED (nothing red on a recommended pick), red on NOT REC */}
            <div className="py-[8px]">
              <div
                className={`flex w-full items-start gap-[8px] pb-[20px] pl-[16px] pr-[20px] pt-[16px] ${
                  verdict === 'recommended' ? 'bg-[rgba(255,247,214,0.8)]' : 'bg-[rgba(255,240,244,0.7)]'
                }`}
              >
                <img src={`${A}warning.svg`} alt="" className="h-[23.625px] w-[20px] shrink-0" />
                <div className="flex flex-1 flex-col gap-[4px]">
                  <p className="text-[16px] font-semibold leading-[24px] text-fg-primary">{cfg.headsUp.title}</p>
                  <p className="text-[14px] leading-[20px] text-fg-primary">{cfg.headsUp.text}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="shrink-0 pb-[12px] pl-[36px] pr-[56px]">
          <div className="flex w-full items-center justify-center gap-[10px] border-t border-border-subtle py-[8px]">
            <span className="whitespace-nowrap text-[12px] font-semibold leading-[16px] text-[#585858]">
              LIKE THIS REC?
            </span>
            <div className="flex gap-[6px]">
              <button className="flex size-[30px] items-center justify-center rounded-full border border-border-subtle bg-white">
                <img src={`${A}thumbup.svg`} alt="Like" className="h-[13px] w-[13.7px]" />
              </button>
              <button className="flex size-[30px] items-center justify-center rounded-full border border-border-subtle bg-white">
                <img src={`${A}thumbdown.svg`} alt="Dislike" className="h-[13px] w-[13.7px]" />
              </button>
            </div>
          </div>
        </div>

        {/* close */}
        <button onClick={onClose} className="absolute left-[498.5px] top-[22.5px] size-[20px]" aria-label="Close">
          <img src={`${A}x.svg`} alt="" className="size-full" />
        </button>
      </div>

      {tooltip && (
        <BasedOnPopover
          onClose={() => setTooltip(false)}
          preferences={preferences}
          sources={sources}
          onMouseEnter={openTip}
          onMouseLeave={closeTipSoon}
        />
      )}
    </>
  )
}

/* ---- Not-Recommended rows — same RowData shape as the recommended card ---- */
const notRecRows: RowData[] = [
  {
    icon: `${A}toprated.svg`,
    iconSize: 20,
    title: 'Low Rated',
    subtitle: 'Bumpy road ahead. CR and parents agree: this one falls short of its price.',
    sources: [av5, av7],
    detail: [
      {
        source: 'Consumer Reports',
        text: 'Our lab testers scored this 54/100, with low marks for maneuverability, ease of use, and safety.',
        chipImg: av7,
        chipLabel: 'Baby Trend Stroller Review',
      },
      {
        source: 'Reddit',
        text: 'Of 512 Reddit mentions surveyed, most were negative, citing a rough ride and poor durability.',
        chipImg: av5,
        chipLabel: 'Worst Strollers: Thread',
      },
    ],
  },
  {
    icon: `${A}city.svg`,
    iconSize: 18,
    title: 'Poor Maneuverability',
    subtitle: "Not built for the urban jungle. Struggles with sidewalks and curbs, and doesn't fold well.",
    sources: [av18, av7],
    detail: [
      {
        source: 'Consumer Reports',
        text: 'A wide turning radius and bulky fold scored poorly in our urban maneuverability tests.',
        chipImg: av7,
        chipLabel: 'City Stroller Guide',
      },
      {
        source: 'Reddit',
        text: 'City parents repeatedly complain it snags on curbs and barely fits through doorways.',
        chipImg: av5,
        chipLabel: 'r/Parenting Thread',
      },
    ],
  },
  {
    icon: `${A}sketch.svg`,
    iconSize: 20,
    title: 'Falls Apart Fast',
    subtitle: 'Cheap fabrics and wobbly wheels that make resale and hand-me-downs difficult.',
    sources: [av5, av7],
    detail: [
      {
        source: 'Consumer Reports',
        text: 'Frame and fabric showed heavy wear partway through our accelerated wear testing.',
        chipImg: av7,
        chipLabel: 'Durability Report',
      },
      {
        source: 'Reddit',
        text: 'Owners frequently mention weak resale value and parts failing within the first year.',
        chipImg: av5,
        chipLabel: 'Resale Thread',
      },
    ],
  },
  {
    icon: `${A}cloud.svg`,
    iconSize: 20,
    title: 'Bumpy Ride',
    subtitle: "Suspension doesn't do much to soften bumps or uneven pavement.",
    sources: [av5, av7],
    detail: [
      {
        source: 'Consumer Reports',
        text: 'Suspension transmitted most road vibration in our ride tests, worse than competitors.',
        chipImg: av7,
        chipLabel: 'Comfort Review',
      },
      {
        source: 'Reddit',
        text: 'Parents note their kids fuss on longer walks over the stiff, jarring ride.',
        chipImg: av5,
        chipLabel: 'r/BeyondtheBump',
      },
    ],
  },
  {
    icon: `${A}fold.svg`,
    iconSize: 28,
    title: 'Difficult to Fold',
    subtitle: 'Takes both hands and a few extra steps to close properly.',
    sources: [av18, av7],
    detail: [
      {
        source: 'Consumer Reports',
        text: 'The fold mechanism jammed intermittently across our repeated open/close trials.',
        chipImg: av7,
        chipLabel: 'Fold Mechanism Test',
      },
      {
        source: 'Reddit',
        text: 'Frequent flyers gripe that it takes two hands and real effort to collapse at the gate.',
        chipImg: av5,
        chipLabel: 'Travel Thread',
      },
    ],
  },
]

/* ----------------------------------------------- "Generating insights" overlay */
/** The product-image squares Connie's badges land on (frame coords). */
const PRODUCT_SQUARES = [
  { left: 30, top: 132, width: 352, height: 346 },
  { left: 452, top: 132, width: 358, height: 346 },
  { left: 885, top: 132, width: 348, height: 346 },
]

/** Yellow-green "AI is generating insights" shimmer over each product image, shown on load. */
function GeneratingOverlay() {
  return (
    <>
      {PRODUCT_SQUARES.map((s, i) => (
        <div
          key={i}
          className="pointer-events-none absolute animate-pulse overflow-hidden rounded-[8px] bg-gradient-to-br from-[rgba(217,237,226,0.85)] to-[rgba(251,245,221,0.85)]"
          style={{ left: s.left, top: s.top, width: s.width, height: s.height }}
        >
          <span className="absolute left-[12px] top-[12px] flex items-center gap-[6px] rounded-full bg-white/70 px-[10px] py-[4px] text-[12px] font-semibold text-[#282923]">
            <img src={`${A}shootingstar.svg`} alt="" className="size-[14px]" />
            Analyzing…
          </span>
        </div>
      ))}
    </>
  )
}

/* -------------------------------------------------------- Product badges */
function ProductBadges({
  onOpen,
  onOpenNotRec,
}: {
  onOpen: () => void
  onOpenNotRec: (slot: NotRecSlot) => void
}) {
  return (
    <>
      {/* Centre card — Baby Trend Passport Switch 6-in-1 (recommended). */}
      <button
        onClick={onOpen}
        className="pointer-events-auto absolute flex items-center justify-center rounded-full bg-rating-excellent"
        style={{ left: 796, top: 101, width: 45, height: 45 }}
        aria-label={`Open Connie insights for the ${LIVE_PRODUCT}`}
      >
        <img src={`${A}chatblob.png`} alt="" className="size-[28px] object-contain" />
      </button>
      {/* Right card — Graco Ready2Grow 2.0 (not recommended). */}
      <button
        onClick={() => onOpenNotRec('right')}
        className="pointer-events-auto absolute flex items-center justify-center rounded-full bg-[#9d9d9d]"
        style={{ left: 1215, top: 101, width: 45, height: 45 }}
        aria-label={`See why the ${NOT_REC_PRODUCTS.right.name} isn't recommended`}
      >
        <img src={`${A}chatcircle.svg`} alt="" className="size-[28px]" />
      </button>
      {/* Left card — Dream On Me Aero (not recommended). */}
      <button
        onClick={() => onOpenNotRec('left')}
        className="pointer-events-auto absolute flex items-center justify-center rounded-full bg-[#9d9d9d]"
        style={{ left: 356, top: 100, width: 45, height: 45 }}
        aria-label={`See why the ${NOT_REC_PRODUCTS.left.name} isn't recommended`}
      >
        <img src={`${A}chatcircle.svg`} alt="" className="size-[28px]" />
      </button>
    </>
  )
}

/* --------------------------------------------------------- State switcher */
function StateSwitcher({
  current,
  onSelect,
}: {
  current: Variant
  onSelect: (v: Variant) => void
}) {
  const navigate = useNavigate()
  const items: { v: Variant; label: string }[] = [
    { v: 'collapsed', label: 'Collapsed' },
    { v: 'menu', label: 'Menu' },
    { v: 'recommended', label: 'Recommended' },
    { v: 'expanded', label: 'Expanded' },
    { v: 'tooltip', label: 'Tooltip' },
    { v: 'notrec', label: 'Not rec.' },
  ]
  return (
    <div className="absolute left-[12px] top-[12px] z-30 flex flex-wrap items-center gap-[4px] rounded-[10px] border border-border-subtle bg-white/95 p-[6px] shadow-subtle">
      {items.map((it) => (
        <button
          key={it.v}
          onClick={() => onSelect(it.v)}
          className={`rounded-[6px] px-[8px] py-[4px] text-[12px] font-medium ${
            current === it.v ? 'bg-brand text-fg-inverse' : 'text-fg-secondary hover:bg-bg-tertiary'
          }`}
        >
          {it.label}
        </button>
      ))}
      <button
        onClick={() => navigate(routes.annotations)}
        className="rounded-[6px] px-[8px] py-[4px] text-[12px] font-medium text-fg-brand hover:bg-bg-tertiary"
      >
        Annotations →
      </button>
    </div>
  )
}

/* ============================================================ Screen */
export function ProductInsightsScreen() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  // Default to no card — the retail page with badges only. The card opens when a star is clicked.
  const variant = (params.get('v') as Variant) || 'collapsed'
  const setVariant = (v: Variant) => setParams({ v }, { replace: true })
  /** Which grey badge opened the NOT RECOMMENDED panel — the two open different products. */
  const notRecSlot: NotRecSlot = params.get('p') === 'right' ? 'right' : 'left'
  const openNotRec = (slot: NotRecSlot) => setParams({ v: 'notrec', p: slot }, { replace: true })

  const showRecommended = variant === 'recommended' || variant === 'expanded' || variant === 'tooltip'

  // Fetch live product_insights on load. Until it returns (or if the backend is unreachable),
  // the baked rows show so the screen never breaks; live data swaps in when it arrives.
  // Keep the raw payload, not the mapped rows — so connecting/disconnecting a community in
  // onboarding re-derives the rows immediately (no stale community posts, no refetch needed).
  const [livePayload, setLivePayload] = useState<ProductInsightsPayload | null>(null)
  const preferences = usePreferences((s) => s.preferences)
  const sources = usePreferences((s) => s.sources)
  // Refetch whenever the preferences change (they drive the backend's insight ordering).
  // Keyed on the priority string, so StrictMode's double-invoke is skipped but a real
  // preference edit in the BASED ON popover triggers a fresh, correctly-ordered fetch.
  const priorityKey = preferencesToPriorities(preferences)
  const lastFetched = useRef<string | null>(null)
  useEffect(() => {
    if (lastFetched.current === priorityKey) return
    lastFetched.current = priorityKey
    callConnie({
      message: `What are the key insights on the ${LIVE_PRODUCT}?`,
      priorities: priorityKey || undefined,
    })
      .then((r) => {
        if (isProductInsights(r) && r.product_insights.insights.length > 0) {
          setLivePayload(r.product_insights)
        } else {
          console.warn('[Connie] Product Insights fell back to mock rows: backend returned', r)
        }
      })
      .catch((err) => {
        console.warn('[Connie] Product Insights fetch failed, showing mock:', err)
      })
      // Settled either way — the shimmer's job is to cover the wait, not to hide a failure.
      .finally(() => setInsightsSettled(true))
  }, [priorityKey])
  const liveRows = livePayload ? insightsToRows(livePayload, sources) : null
  const panelRows = liveRows && liveRows.length > 0 ? liveRows : rows

  // NOT RECOMMENDED cards — live insights for the two not-recommended strollers on the page.
  // Fetched lazily (only when a panel is opened) and cached per slot, so we don't spend Vertex
  // quota on page load and don't refetch when the user reopens the same card.
  const [notRecPayloads, setNotRecPayloads] = useState<
    Partial<Record<NotRecSlot, ProductInsightsPayload>>
  >({})
  // Keyed on `slot|priorities`: StrictMode's double-invoke is skipped, but switching badges or
  // editing preferences in the BASED ON popover triggers a fresh, correctly-ordered fetch.
  const notRecFetched = useRef<Set<string>>(new Set())
  // Has this slot's fetch finished (either way)? Drives the in-panel shimmer, so a NOT RECOMMENDED
  // card never shows mock rows while its real insights are still being generated.
  const [notRecSettled, setNotRecSettled] = useState<Partial<Record<NotRecSlot, boolean>>>({})
  useEffect(() => {
    if (variant !== 'notrec') return
    const key = `${notRecSlot}|${priorityKey}`
    if (notRecFetched.current.has(key)) return
    notRecFetched.current.add(key)
    setNotRecSettled((prev) => ({ ...prev, [notRecSlot]: false }))
    callConnie({
      message: `What are the key insights on the ${NOT_REC_PRODUCTS[notRecSlot].name}?`,
      priorities: priorityKey || undefined,
    })
      .then((r) => {
        if (isProductInsights(r) && r.product_insights.insights.length > 0) {
          setNotRecPayloads((prev) => ({ ...prev, [notRecSlot]: r.product_insights }))
        } else {
          // Wrong response_type, or zero insights — the panel will silently show baked rows,
          // which look plausible enough to be mistaken for live data. Say so.
          console.warn(
            `[Connie] NOT RECOMMENDED (${notRecSlot}) fell back to mock rows: backend returned`,
            r,
          )
        }
      })
      .catch((err) => {
        // Keep baked rows, but never fail silently — a 429 from the Vertex quota looks exactly
        // like "the mock was always there" otherwise.
        console.warn(`[Connie] NOT RECOMMENDED (${notRecSlot}) fetch failed, showing mock:`, err)
      })
      // Settled either way: live data replaces the shimmer, a failure falls back to mock rows.
      .finally(() => setNotRecSettled((prev) => ({ ...prev, [notRecSlot]: true })))
  }, [variant, notRecSlot, priorityKey])
  const notRecPayload = notRecPayloads[notRecSlot] ?? null
  const notRecLive = notRecPayload ? insightsToRows(notRecPayload, sources) : null
  const notRecPanelRows = notRecLive && notRecLive.length > 0 ? notRecLive : notRecRows
  /** Shimmer until this badge's fetch settles. Reopening an already-fetched card is instant. */
  const notRecLoading = notRecSettled[notRecSlot] !== true

  // "Generating insights" shimmer over the product images, before the badges appear.
  //
  // Chloe's version was a blind `setTimeout(…, 5000)` — it cleared after 5s whether or not the
  // backend had answered, so a slow call (or a Vertex 429) would reveal the badges and then serve
  // mock rows behind an animation that claimed we'd analysed the page. Now it holds until the real
  // fetch settles, with her 5s as a FLOOR so it never flashes, and a 20s ceiling so a hung backend
  // can't trap the user behind a permanent shimmer.
  const MIN_SHIMMER_MS = 5000
  const MAX_SHIMMER_MS = 20000
  const [minShimmerDone, setMinShimmerDone] = useState(false)
  const [insightsSettled, setInsightsSettled] = useState(false)
  useEffect(() => {
    const min = window.setTimeout(() => setMinShimmerDone(true), MIN_SHIMMER_MS)
    const max = window.setTimeout(() => setInsightsSettled(true), MAX_SHIMMER_MS)
    return () => {
      window.clearTimeout(min)
      window.clearTimeout(max)
    }
  }, [])
  const generating = !minShimmerDone || !insightsSettled

  const frame: ReactNode = (
    <FigmaFrame>
      {/* Click anywhere on the retail page (behind the retail group / panels / launcher) to open
          the inline-annotation experience — it starts with a short tooltip intro. */}
      <button
        aria-label="Highlight a claim on the page"
        onClick={() => navigate(`${routes.annotations}?intro=1`)}
        className="absolute inset-0 cursor-pointer"
      />

      {/* Shared retail backdrop. While Connie "generates," a shimmer covers the products; the
          chat + green-star badges appear once it finishes. */}
      <RetailBackdrop />
      {generating ? (
        <GeneratingOverlay />
      ) : (
        <ProductBadges onOpen={() => setVariant('recommended')} onOpenNotRec={openNotRec} />
      )}

      {showRecommended && (
        <InsightPanel
          key={variant}
          verdict="recommended"
          initialExpanded={variant === 'expanded' ? 0 : null}
          initialTooltip={variant === 'tooltip'}
          onClose={() => setVariant('collapsed')}
          rows={panelRows}
          // Normally the GeneratingOverlay has already covered this wait, but a deep link
          // (?v=recommended) can open the panel before the fetch settles — shimmer, don't mock.
          loading={!insightsSettled}
          preferences={preferences}
          sources={sources}
        />
      )}

      {variant === 'notrec' && (
        <InsightPanel
          // Remount when the badge or the priorities change, so the panel re-anchors to the
          // product it's describing instead of keeping the previous card's drag position.
          key={`notrec-${notRecSlot}-${priorityKey}`}
          verdict="notrec"
          initialExpanded={null}
          initialTooltip={false}
          onClose={() => setVariant('collapsed')}
          rows={notRecPanelRows}
          loading={notRecLoading}
          preferences={preferences}
          sources={sources}
          // Anchor under the grey card whose badge was clicked. Still draggable.
          initialPos={NOT_REC_PRODUCTS[notRecSlot].pos}
        />
      )}

      <NaviRail forceOpen={variant === 'menu'} />
    </FigmaFrame>
  )

  return frame
}
