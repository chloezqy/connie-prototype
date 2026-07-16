import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { routes } from '@/app/routes'
import { callConnieCached, peekConnieCache } from '@/api/connieClient'
import { isProductInsights, type ProductInsightsPayload } from '@/types/connie-contract'
import {
  usePreferences,
  preferencesToPriorities,
  ALL_PREFERENCES,
  ALL_COMMUNITIES,
} from '@/store/usePreferences'
import { communityPosts, type CommunitySource } from '@/mocks/communityPosts'
import { cleanEvidence } from '@/lib/sourceFilter'
import { LOADING_MS, MAX_LOADING_MS } from '@/lib/timing'
import { NaviRail } from '@/components/connie/NaviRail'
import { RetailBackdrop } from '@/components/connie/RetailBackdrop'
import {
  badgePos,
  cardOverlayBox,
  SEARCH_GRID,
  SEARCH_PRODUCT_COUNT,
} from '@/components/retail/AmazonSearchPage'
import { AMAZON_PRODUCTS } from '@/mocks/retail'
import { DimOverlay } from '@/components/connie/DimOverlay'
import {
  IconHeart,
  IconShieldCheck,
  IconTag,
  IconHandTap,
  IconLeaf,
} from '@/components/icons'

/* The three strollers below are the ones on the mocked Amazon search page behind this screen.
 * Their names/prices/photos live in `src/mocks/retail.ts` — the page and Connie's cards both read
 * from there, so they can't drift. This file only names them for the backend calls.
 *
 * They must stay in sync with the CR dataset — see `backend-data/README.md`. If you change the
 * roster, change it in three places: `mocks/retail.ts`, the CR data file, and the roster count in
 * the Langflow prompt. */

/** Centre product (green badge) — drives the live product_insights request. */
const LIVE_PRODUCT = AMAZON_PRODUCTS.babytrend.name

/** Panel width, and the furthest left it can start while staying on a 1440 canvas. */
const PANEL_W = 540
const PANEL_MAX_LEFT = 1440 - PANEL_W - 16

/** Anchor a panel under the card at column `i % 3`, clamped onto the canvas. Derived from the
 *  search page's own layout, so a panel points at the product it's describing. Still draggable.
 *  Row-2 products borrow row 1's top: their own row starts below the fold, so a panel anchored
 *  there would open off-canvas. */
function panelPosFor(i: number) {
  return {
    left: Math.min(SEARCH_GRID.lefts[i % 3], PANEL_MAX_LEFT),
    top: SEARCH_GRID.cardTop + 56,
  }
}

/**
 * Every stroller Connie passes on, keyed by which grey badge opens it — the two flanking the pick
 * in row 1, plus all three in the cut-off second row.
 */
const NOT_REC_PRODUCTS = {
  left: { name: AMAZON_PRODUCTS.aero.amazonTitle.split(',')[0], pos: panelPosFor(0) },
  right: { name: AMAZON_PRODUCTS.graco.amazonTitle.split(',')[0], pos: panelPosFor(2) },
  row2a: { name: AMAZON_PRODUCTS.evenflo.amazonTitle.split(',')[0], pos: panelPosFor(3) },
  row2b: { name: AMAZON_PRODUCTS.joie.amazonTitle.split(',')[0], pos: panelPosFor(4) },
  row2c: { name: AMAZON_PRODUCTS.aero.amazonTitle.split(',')[0], pos: panelPosFor(5) },
} as const

type NotRecSlot = keyof typeof NOT_REC_PRODUCTS
const NOT_REC_SLOTS = Object.keys(NOT_REC_PRODUCTS) as NotRecSlot[]

/** Which of the six cards Connie recommends; every other index gets a grey "why not" badge. */
const RECOMMENDED_INDEX = 1
const NOT_REC_BY_INDEX: Record<number, NotRecSlot> = {
  0: 'left',
  2: 'right',
  3: 'row2a',
  4: 'row2b',
  5: 'row2c',
}

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
export type RowData = {
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

/**
 * The six things Connie says about a recommended stroller.
 *
 * EXPORTED, and reused verbatim by Decision Support's "Show details" grid — the two are the same
 * claims about the same product, so they read from one list rather than two that drift apart.
 * (These are the baked fallback; live `product_insights` replaces them here via `insightsToRows`.)
 */
export const rows: RowData[] = [
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
        chipLabel: 'CR Fold Mechanism Test',
      },
      {
        source: 'Reddit',
        text: 'Frequent flyers love how quickly it collapses at the gate and in the trunk.',
        chipImg: av5,
        chipLabel: 'r/Travel · “Gate-checking strollers”',
      },
    ],
  },
  {
    icon: `${A}safety.svg`,
    iconSize: 20,
    title: 'Safety First',
    subtitle: 'Five-point harness and a brake that held on every incline our testers ran.',
    sources: [av7, av5],
    detail: [
      {
        source: 'Consumer Reports',
        text: 'Passed every stability and brake-hold test at full incline, with no harness slippage across repeated loading.',
        chipImg: av7,
        chipLabel: 'CR Safety Test Report',
      },
      {
        source: 'Reddit',
        text: 'Parents consistently mention the harness staying put even with a determined toddler.',
        chipImg: av5,
        chipLabel: 'r/BeyondTheBump · “Harness escape artists”',
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
/** Chip in the BASED ON popover. Read-only by default; in edit mode it toggles. */
function Chip({
  img,
  icon,
  label,
  selected = true,
  onClick,
}: {
  img?: string
  icon?: ReactNode
  label: string
  selected?: boolean
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`flex h-[32px] items-center gap-[6px] rounded-full border bg-white py-[6px] pl-[8px] pr-[14px] ${
        selected ? 'border-border-strong' : 'border-dashed border-border-subtle text-fg-secondary opacity-55'
      } ${onClick ? 'cursor-pointer transition-opacity hover:opacity-100' : ''}`}
    >
      {img && <img src={img} alt="" className="size-[18px] rounded-full border-[0.5px] border-white object-cover" />}
      {icon}
      <span className="whitespace-nowrap text-[14px] leading-[20px] text-[#21211f]">{label}</span>
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

/** One glyph per shopping value, shared with onboarding N4b so a value looks the same everywhere. */
const PREFERENCE_ICON: Record<string, (p: { size?: number; className?: string }) => JSX.Element> = {
  'Long-term reliability': IconShieldCheck,
  'Value for price': IconTag,
  'Ease of use': IconHandTap,
  Sustainability: IconLeaf,
}

/** A labelled row in the popover: icon + caption + its chips. */
function BasedOnRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-[10px]">
      <div className="flex w-[104px] shrink-0 items-center gap-[8px] pt-[6px]">
        {icon}
        <span className="text-[14px] font-semibold leading-[20px] text-fg-secondary">{label}</span>
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-[6px]">{children}</div>
    </div>
  )
}

/**
 * "BASED ON" — what actually drove this rec.
 *
 * By default it shows ONLY what's in play: CR, the communities the shopper connected, and the
 * values they picked. The old version listed every option in the catalogue as a dashed ghost
 * chip, so the honest answer ("Reddit + Instagram") was buried in four greyed-out ones it
 * explicitly wasn't based on. Editing still lives here, behind an explicit Edit toggle.
 */
function BasedOnPopover({
  onClose,
  preferences,
  sources,
  pos,
  onMouseEnter,
  onMouseLeave,
}: {
  onClose: () => void
  preferences: string[]
  sources: string[]
  /** Anchors the popover above the card, so it follows the card when it's dragged. */
  pos: { left: number; top: number }
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  const toggleSource = usePreferences((s) => s.toggleSource)
  const togglePreference = usePreferences((s) => s.togglePreference)
  const [editing, setEditing] = useState(false)

  /* Editing offers every named option plus anything she typed under onboarding's "Other" — without
     the second half, a custom source/value would vanish from the list that's meant to edit it. */
  const shownSources = editing
    ? [...ALL_COMMUNITIES, ...sources.filter((s) => !ALL_COMMUNITIES.includes(s))]
    : sources
  const shownPreferences = editing
    ? [...ALL_PREFERENCES, ...preferences.filter((p) => !ALL_PREFERENCES.includes(p))]
    : preferences

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute z-20 flex flex-col gap-[14px] overflow-hidden rounded-[16px] border-[0.5px] border-border-subtle bg-bg-secondary px-[24px] pb-[18px] pt-[20px] shadow-[0px_0px_15px_0px_rgba(5,5,0,0.16)]"
      style={{ left: pos.left - 4, top: Math.max(8, pos.top - 214), width: 520 }}
    >
      {/* pr-[32px] keeps Edit clear of the close button, which is positioned over this row. */}
      <div className="flex items-center justify-between pr-[32px]">
        <p className="text-[12px] font-semibold uppercase leading-[16px] tracking-[1px] text-fg-secondary">
          Based on
        </p>
        <button
          onClick={() => setEditing((e) => !e)}
          className="flex items-center gap-[5px] text-[13px] font-semibold leading-[18px] text-fg-brand"
        >
          <img src={`${A}pencil.svg`} alt="" className="size-[14px]" />
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      <BasedOnRow icon={<img src={`${A}link.svg`} alt="" className="size-[16px]" />} label="Sources">
        <Chip img={av7} label="Consumer Reports" />
        {shownSources.map((s) => (
          <Chip
            key={s}
            img={COMMUNITY_ICON[s]}
            label={s}
            selected={sources.includes(s)}
            onClick={editing ? () => toggleSource(s) : undefined}
          />
        ))}
        {!editing && sources.length === 0 && (
          <span className="text-[13px] leading-[20px] text-fg-secondary">
            No communities connected — CR lab data only.
          </span>
        )}
      </BasedOnRow>

      <BasedOnRow icon={<img src={`${A}sliders.svg`} alt="" className="size-[18px]" />} label="Your values">
        {shownPreferences.map((p) => {
          const Icon = PREFERENCE_ICON[p]
          return (
            <Chip
              key={p}
              icon={Icon ? <Icon size={16} className="text-fg-secondary" /> : undefined}
              label={p}
              selected={preferences.includes(p)}
              onClick={editing ? () => togglePreference(p) : undefined}
            />
          )
        })}
        {!editing && preferences.length === 0 && (
          <span className="text-[13px] leading-[20px] text-fg-secondary">
            Nothing set yet — ranked on CR's overall score.
          </span>
        )}
      </BasedOnRow>

      <button onClick={onClose} className="absolute right-[18px] top-[18px] size-[16px]" aria-label="Close">
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
/** Trivia only rides along on a recommended pick — it's a delight beat, and there's nothing
 *  delightful about a card telling you why the thing you're looking at is a bad buy. */
const FUN_FACT =
  "The first stroller, built in 1733, wasn't pushed at all — it was pulled by a goat or pony as a decorative novelty for wealthy families."
const VERDICT_CFG: Record<Verdict, { icon: string; title: string; funFact: string | null }> = {
  recommended: {
    icon: `${A}star.svg`,
    title: 'RECOMMENDED',
    funFact: FUN_FACT,
  },
  notrec: {
    icon: `${A}xcircle.svg`,
    title: 'NOT RECOMMENDED',
    funFact: null,
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

  // Draggable panel position — defaults under the recommended product's card.
  const [pos, setPos] = useState(initialPos ?? panelPosFor(1))
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
          <div className="flex flex-col gap-[20px] pb-[8px]">
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

            {/* DID YOU KNOW — the tail of the card, after the evidence it's a break from.
                Recommended picks only (see VERDICT_CFG). */}
            {!loading && cfg.funFact && (
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
            )}
          </div>
        </div>

        {/* footer */}
        <div className="shrink-0 pb-[4px] pl-[36px] pr-[56px]">
          <div className="flex w-full items-center justify-center gap-[10px] border-t border-border-subtle py-[6px]">
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
          pos={pos}
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
/** The boxes the "analyzing" shimmer covers — each product's WHOLE card (photo, title, rating,
 *  price and all) plus SEARCH_GRID.cardOverlayPad, because Connie is reading the product, not its
 *  picture. All six on the page, including the row cut off by the fold. */
const PRODUCT_SQUARES = Array.from({ length: SEARCH_PRODUCT_COUNT }, (_, i) => cardOverlayBox(i))

/** Yellow-green "AI is generating insights" shimmer over each product, shown on load. */
function GeneratingOverlay() {
  return (
    <>
      {PRODUCT_SQUARES.map((s, i) => (
        <div
          key={i}
          className="pointer-events-none absolute animate-pulse overflow-hidden rounded-[8px] bg-gradient-to-br from-[rgba(217,237,226,0.85)] to-[rgba(251,245,221,0.85)]"
          style={{ left: s.left, top: s.top, width: s.width, height: s.height }}
        >
          {/* Top-left on every card, so the six labels land on one line per row and read as one
              pass over the page. It also keeps the bottom row's label above the fold.
              `top` clears Amazon's own "Best Seller" flag, which occupies the same corner. */}
          <span className="absolute left-[10px] top-[10px] flex items-center gap-[6px] rounded-full bg-white/70 px-[10px] py-[4px] text-[12px] font-semibold text-[#282923]">
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
  /* One badge per product on the page: the green star on Connie's pick, a grey "why not" circle
     on every other — including the three in the row cut off by the fold. */
  return (
    <>
      {Array.from({ length: SEARCH_PRODUCT_COUNT }, (_, i) => {
        if (i === RECOMMENDED_INDEX) {
          return (
            <button
              key={i}
              onClick={onOpen}
              className="pointer-events-auto absolute flex items-center justify-center rounded-full bg-rating-excellent shadow-subtle"
              style={{ ...badgePos(i), width: 45, height: 45 }}
              aria-label={`Open Connie insights for the ${LIVE_PRODUCT}`}
            >
              <img src={`${A}chatblob.png`} alt="" className="size-[28px] object-contain" />
            </button>
          )
        }
        const slot = NOT_REC_BY_INDEX[i]
        return (
          <button
            key={i}
            onClick={() => onOpenNotRec(slot)}
            className="pointer-events-auto absolute flex items-center justify-center rounded-full bg-[#9d9d9d] shadow-subtle"
            style={{ ...badgePos(i), width: 45, height: 45 }}
            aria-label={`See why the ${NOT_REC_PRODUCTS[slot].name} isn't recommended`}
          >
            <img src={`${A}chatcircle.svg`} alt="" className="size-[28px]" />
          </button>
        )
      })}
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
  const slotParam = params.get('p')
  const notRecSlot: NotRecSlot = NOT_REC_SLOTS.includes(slotParam as NotRecSlot)
    ? (slotParam as NotRecSlot)
    : 'left'
  const openNotRec = (slot: NotRecSlot) => setParams({ v: 'notrec', p: slot }, { replace: true })

  const showRecommended = variant === 'recommended' || variant === 'expanded' || variant === 'tooltip'

  // Fetch live product_insights on load. Until it returns (or if the backend is unreachable),
  // the baked rows show so the screen never breaks; live data swaps in when it arrives.
  // Keep the raw payload, not the mapped rows — so connecting/disconnecting a community in
  // onboarding re-derives the rows immediately (no stale community posts, no refetch needed).
  const preferences = usePreferences((s) => s.preferences)
  const sources = usePreferences((s) => s.sources)
  // Refetch whenever the preferences change (they drive the backend's insight ordering).
  // Keyed on the priority string, so StrictMode's double-invoke is skipped but a real
  // preference edit in the BASED ON popover triggers a fresh, correctly-ordered fetch.
  const priorityKey = preferencesToPriorities(preferences)

  /** Already asked this exact question this session? Seed from the cache so navigating back to
   *  this screen is instant — no refetch, no shimmer, no Vertex quota spent re-deriving an answer
   *  we already have. The cache is module-level, so it survives React unmounting this component. */
  const cachedInsights = () => {
    const hit = peekConnieCache({
      message: `What are the key insights on the ${LIVE_PRODUCT}?`,
      priorities: priorityKey || undefined,
    })
    return hit && isProductInsights(hit) ? hit.product_insights : null
  }
  const [livePayload, setLivePayload] = useState<ProductInsightsPayload | null>(cachedInsights)
  const lastFetched = useRef<string | null>(null)
  useEffect(() => {
    if (lastFetched.current === priorityKey) return
    lastFetched.current = priorityKey
    callConnieCached({
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
  >(() => {
    // Seed both slots from the session cache, same as the recommended card.
    const seed: Partial<Record<NotRecSlot, ProductInsightsPayload>> = {}
    for (const slot of NOT_REC_SLOTS) {
      const hit = peekConnieCache({
        message: `What are the key insights on the ${NOT_REC_PRODUCTS[slot].name}?`,
        priorities: priorityKey || undefined,
      })
      if (hit && isProductInsights(hit)) seed[slot] = hit.product_insights
    }
    return seed
  })
  // Keyed on `slot|priorities`: StrictMode's double-invoke is skipped, but switching badges or
  // editing preferences in the BASED ON popover triggers a fresh, correctly-ordered fetch.
  const notRecFetched = useRef<Set<string>>(new Set())
  // Has this slot's fetch finished (either way)? Drives the in-panel shimmer, so a NOT RECOMMENDED
  // card never shows mock rows while its real insights are still being generated.
  const [notRecSettled, setNotRecSettled] = useState<Partial<Record<NotRecSlot, boolean>>>(() => {
    // A slot seeded from the cache is already settled — no shimmer on a revisit.
    const seed: Partial<Record<NotRecSlot, boolean>> = {}
    for (const slot of NOT_REC_SLOTS) {
      if (
        peekConnieCache({
          message: `What are the key insights on the ${NOT_REC_PRODUCTS[slot].name}?`,
          priorities: priorityKey || undefined,
        })
      )
        seed[slot] = true
    }
    return seed
  })
  // Fetch BOTH not-recommended products in the background on mount — not lazily on click. The
  // recommended card already fetches on mount, which is why it feels ready and the grey cards did
  // not: nothing happened for them until the badge was clicked. Now they load alongside it, so by
  // the time a grey badge is clicked its data is already in flight or done. Staggered a few seconds
  // apart so all three product_insights calls don't fire simultaneously and trip the Vertex quota.
  useEffect(() => {
    const timers: number[] = []
    NOT_REC_SLOTS.forEach((slot, i) => {
      const key = `${slot}|${priorityKey}`
      if (notRecFetched.current.has(key)) return
      notRecFetched.current.add(key)
      timers.push(
        window.setTimeout(
          () => {
            callConnieCached({
              message: `What are the key insights on the ${NOT_REC_PRODUCTS[slot].name}?`,
              priorities: priorityKey || undefined,
            })
              .then((r) => {
                if (isProductInsights(r) && r.product_insights.insights.length > 0) {
                  setNotRecPayloads((prev) => ({ ...prev, [slot]: r.product_insights }))
                } else {
                  console.warn(
                    `[Connie] NOT RECOMMENDED (${slot}) fell back to mock rows: backend returned`,
                    r,
                  )
                }
              })
              .catch((err) => {
                console.warn(`[Connie] NOT RECOMMENDED (${slot}) fetch failed, showing mock:`, err)
              })
              // Settled either way: live data replaces the shimmer, a failure falls back to mock.
              .finally(() => setNotRecSettled((prev) => ({ ...prev, [slot]: true })))
          },
          // Recommended fetches at mount (0s); offset the grey cards so the three don't stack.
          4000 * (i + 1),
        ),
      )
    })
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [priorityKey])
  const notRecPayload = notRecPayloads[notRecSlot] ?? null
  const notRecLive = notRecPayload ? insightsToRows(notRecPayload, sources) : null
  const notRecPanelRows = notRecLive && notRecLive.length > 0 ? notRecLive : notRecRows

  // The 5s "Analyzing…" beat plays the FIRST time each NOT RECOMMENDED card is opened, then never
  // again — so reopening a card you've already seen shows its data instantly, exactly like the
  // recommended card. `notRecShown` remembers which slots have already played their beat.
  const notRecShown = useRef<Set<NotRecSlot>>(new Set())
  const [notRecMinDone, setNotRecMinDone] = useState<Partial<Record<NotRecSlot, boolean>>>({})
  useEffect(() => {
    if (variant !== 'notrec') return
    if (notRecShown.current.has(notRecSlot)) {
      // Already revealed once — skip the beat, show the retained data immediately.
      setNotRecMinDone((prev) => ({ ...prev, [notRecSlot]: true }))
      return
    }
    setNotRecMinDone((prev) => ({ ...prev, [notRecSlot]: false }))
    const t = window.setTimeout(() => {
      setNotRecMinDone((prev) => ({ ...prev, [notRecSlot]: true }))
      notRecShown.current.add(notRecSlot) // don't replay the beat on future opens
    }, LOADING_MS)
    return () => window.clearTimeout(t)
  }, [variant, notRecSlot])

  /** Shimmer until BOTH the 5s beat has played AND this badge's fetch has settled. */
  const notRecLoading = !(notRecSettled[notRecSlot] === true && notRecMinDone[notRecSlot] === true)

  // "Generating insights" shimmer over the product images, before the badges appear.
  //
  // Chloe's version was a blind `setTimeout(…, 5000)` — it cleared after a fixed delay whether or
  // not the backend had answered, so a slow call (or a Vertex 429) would reveal the badges and then
  // serve mock rows behind an animation that claimed we'd analysed the page. Now it holds until the
  // real fetch settles, with LOADING_MS as a FLOOR so it never flashes, and a ceiling so a hung
  // backend can't trap the user behind a permanent shimmer.
  //
  // The "Analyzing…" beat ALWAYS plays for LOADING_MS, even when the answer is already cached from
  // the demo warm — that 5-second moment is the signature of the product, and skipping it (just
  // because data is ready) makes the reveal feel like a page that didn't do anything.
  //
  //   minShimmerDone  = the 5s floor. Always runs.
  //   insightsSettled = data is ready. TRUE immediately if warmed/cached; otherwise set when the
  //                     fetch finishes, with MAX_LOADING_MS as a hung-backend ceiling.
  //
  // The overlay clears only when BOTH are true, so:
  //   • warmed  → 5s of "Analyzing…", then the real data appears (the experience you want)
  //   • cold    → shimmer holds until the data actually lands (never mock-then-swap)
  const alreadyCached = livePayload !== null
  const [minShimmerDone, setMinShimmerDone] = useState(false)
  const [insightsSettled, setInsightsSettled] = useState(alreadyCached)
  useEffect(() => {
    const min = window.setTimeout(() => setMinShimmerDone(true), LOADING_MS)
    const max = alreadyCached
      ? undefined
      : window.setTimeout(() => setInsightsSettled(true), MAX_LOADING_MS)
    return () => {
      window.clearTimeout(min)
      if (max) window.clearTimeout(max)
    }
  }, [alreadyCached])
  const generating = !minShimmerDone || !insightsSettled

  /** Any Connie card open? It gets the 10% scrim under it, and the page stops being clickable. */
  const panelOpen = showRecommended || variant === 'notrec'

  const frame: ReactNode = (
    <FigmaFrame>
      {/* Click a product on the retail page to open its detail page, where the inline-annotation
          experience lives. Only while no card is open — otherwise the scrim closes the card. */}
      {!panelOpen && (
        <button
          aria-label="Open the product page"
          onClick={() => navigate(routes.annotations)}
          className="absolute inset-0 cursor-pointer"
        />
      )}

      {/* Shared retail backdrop — full colour. While Connie "generates," a shimmer covers the
          products; the chat + green-star badges appear once it finishes. */}
      <RetailBackdrop />
      {generating ? (
        <GeneratingOverlay />
      ) : (
        <ProductBadges onOpen={() => setVariant('recommended')} onOpenNotRec={openNotRec} />
      )}

      {/* 10% scrim between the full-colour page and the card. */}
      {panelOpen && <DimOverlay onClick={() => setVariant('collapsed')} />}

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
