import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { routes } from '@/app/routes'
import { callConnieCached, peekConnieCache } from '@/api/connieClient'
import {
  isDecisionSupport,
  isProductInsights,
  type DecisionSupportPayload,
  type ProductInsightsPayload,
} from '@/types/connie-contract'
import { usePreferences, preferencesToPriorities } from '@/store/usePreferences'
import { cleanEvidence } from '@/lib/sourceFilter'
import { LOADING_MS, MAX_LOADING_MS } from '@/lib/timing'
import { communityPosts, type CommunitySource } from '@/mocks/communityPosts'
import { NaviRail } from '@/components/connie/NaviRail'
import { ProductBackdrop } from '@/components/connie/RetailBackdrop'
import { DimOverlay } from '@/components/connie/DimOverlay'
import {
  IconSafety,
  IconCompass,
  IconFold,
  IconComfort,
  IconWeight,
  IconDurability,
  IconCaretDown,
} from '@/components/icons'

/* ------------------------------------------------------------------ *
 * Decision Support — faithful reproduction of Figma frames
 *   1052:4110  Cards View
 *   1052:3936  Table View
 *   1052:4218  Cards View · Editable Private List (row selected)
 *   1052:4398  Cards View · Editable Private List (all selected)
 *   1052:4512  Cards View · Compare Retailers (price popover)
 *   1052:4656  Cards View · Detailed (Full Review deep-dive)
 *   1052:5377  Expanded Cards View (900px panel, metrics grid)
 *   1052:5762  Expanded Cards View (variant · details collapsed)
 *   1052:5541  Expanded Table View (900px panel)
 *
 * State model (useSearchParams):
 *   view=cards|table   expanded=1   mode=compare|detailed
 * Selection is local interactive state (checkboxes).
 * ------------------------------------------------------------------ */

const A = '/figma/ds-'
const I = '/figma/insights-'
const bg = `${A}bg.png`

const asset = {
  toggleGrid: `${A}toggle-grid.svg`,
  toggleRows: `${A}toggle-rows.svg`,
  filter: `${A}filter.svg`,
  expand: `${A}expand.svg`,
  close: `${A}close.svg`,
  share: `${A}share.svg`,
  trash: `${A}trash.svg`,
  whyCheck: `${A}whyfits-check.svg`,
  // Five distinct product photos. The first three are the strollers actually on the retail page,
  // cropped from that same screenshot — so a card's photo is the product it's describing.
  prodAero: `${A}prod-aero.png`,
  prodBabyTrend: `${A}prod-babytrend.png`,
  prodGraco: `${A}prod-graco.png`,
  prodVista: `${A}prod-vista.png`,
  prodCity: `${A}prod-citymini.png`,
  avCr: `${A}av-cr.png`,
  avReddit: `${A}av-reddit.png`,
  naviChat: `${A}navi-chat.svg`,
  naviHeart: `${A}navi-heart.svg`,
  naviLine: `${A}navi-line.svg`,
  naviGear: `${A}navi-gear.svg`,
  naviQuestion: `${A}navi-question.svg`,
}

type View = 'cards' | 'table'
type Mode = 'compare' | 'detailed' | null

/* -------------------------------------------------------------- Checkbox */
function CheckBox({ checked, onClick }: { checked: boolean; onClick?: () => void }) {
  return (
    <button
      aria-label="Select"
      onClick={onClick}
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border ${
        checked ? 'border-fg-primary bg-fg-primary' : 'border-[#77767b] bg-bg-primary'
      }`}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L20 6" />
        </svg>
      )}
    </button>
  )
}

/* -------------------------------------------------------------- Header */
function PanelHeader({
  view,
  setView,
  expanded,
  toggleExpanded,
  onClose,
}: {
  view: View
  setView: (v: View) => void
  expanded: boolean
  toggleExpanded: () => void
  onClose: () => void
}) {
  const tab = (active: boolean) =>
    `flex size-[32px] items-center justify-center rounded-[4px] ${
      active ? 'bg-border-subtle drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]' : ''
    }`
  return (
    <div className="flex w-full shrink-0 items-center justify-between pb-[12px]">
      <div className="flex items-center rounded-[8px] bg-bg-tertiary p-[4px]">
        <button aria-label="Cards view" onClick={() => setView('cards')} className={tab(view === 'cards')}>
          <img src={asset.toggleGrid} alt="" className="size-[18px]" />
        </button>
        <button aria-label="Table view" onClick={() => setView('table')} className={tab(view === 'table')}>
          <img src={asset.toggleRows} alt="" className="h-[16.667px] w-[15px]" />
        </button>
      </div>
      <div className="flex items-center gap-[8px]">
        <button aria-label="Filter" className="flex size-[32px] items-center justify-center rounded-full">
          <img src={asset.filter} alt="" className="h-[12px] w-[18px]" />
        </button>
        <button
          aria-label={expanded ? 'Collapse' : 'Expand'}
          onClick={toggleExpanded}
          className="flex size-[32px] items-center justify-center rounded-[8px]"
        >
          <img src={asset.expand} alt="" className={`size-[18px] ${expanded ? 'rotate-90' : ''}`} />
        </button>
        <button aria-label="Close" onClick={onClose} className="flex size-[32px] items-center justify-center rounded-full">
          <img src={asset.close} alt="" className="size-[14px]" />
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------- Selection header */
/**
 * Select-all + the actions that operate on a selection.
 *
 * Share and Delete only exist once something is actually selected — they're verbs that need an
 * object, and showing them against an empty selection offers an action that can't do anything.
 */
function SelectionHeader({
  anySelected,
  allChecked,
  toggleAll,
  onShare,
}: {
  anySelected: boolean
  allChecked: boolean
  toggleAll: () => void
  onShare: () => void
}) {
  return (
    <div className="flex h-[28px] w-full shrink-0 items-center gap-[8px] pr-[4px]">
      <button aria-label="Select all" onClick={toggleAll} className="flex size-[24px] items-center justify-center">
        <CheckBox checked={allChecked} />
      </button>
      <div className="flex flex-1 flex-col">
        <p className="text-[14px] leading-[20px] text-fg-primary">Select All</p>
      </div>
      {anySelected && (
        <div className="flex items-center gap-[16px]">
          <button aria-label="Share" onClick={onShare} className="flex items-center gap-[6px]">
            <img src={asset.share} alt="" className="h-[15.75px] w-[12px]" />
            <span className="text-[13px] font-semibold leading-[18px] text-fg-secondary">SHARE</span>
          </button>
          <button aria-label="Delete" className="flex items-center gap-[6px]">
            <img src={asset.trash} alt="" className="h-[13.5px] w-[12px]" />
            <span className="text-[13px] font-semibold leading-[18px] text-fg-secondary">DELETE</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ Retailer mark */
const RETAILER_STYLE: Record<string, { bg: string; fg: string; glyph: string }> = {
  AMAZON: { bg: '#ff9900', fg: '#111', glyph: 'a' },
  WALMART: { bg: '#0071ce', fg: '#fff', glyph: 'W' },
  TARGET: { bg: '#cc0000', fg: '#fff', glyph: '◎' },
  MOCKINGBIRD: { bg: '#2f3a2f', fg: '#fff', glyph: 'M' },
}

/** The retailer's logo chip, sat next to the price. */
function RetailerMark({ retailer }: { retailer: string }) {
  const s = RETAILER_STYLE[retailer.toUpperCase()] ?? { bg: '#77767b', fg: '#fff', glyph: retailer.charAt(0) }
  return (
    <span
      className="flex size-[16px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold leading-none"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.glyph}
    </span>
  )
}

/** Price + a hoverable retailer chip. Hovering it opens the compare-prices popover. */
function PriceRow({ card, onCompareHover }: { card: Card; onCompareHover?: (h: boolean) => void }) {
  const retailer = card.at.replace(/^AT\s+/i, '')
  if (!retailer) return <span className="text-[14px] leading-[20px] text-fg-primary">{card.price}</span>
  return (
    <div className="flex items-center gap-[9px]">
      <span className="text-[14px] leading-[20px] text-fg-primary">{card.price}</span>
      <button
        onMouseEnter={() => onCompareHover?.(true)}
        onMouseLeave={() => onCompareHover?.(false)}
        className="flex cursor-pointer items-center gap-[6px] rounded-[6px] bg-bg-tertiary px-[8px] py-[4px] transition-colors hover:bg-border-subtle"
      >
        <RetailerMark retailer={retailer} />
        <span className="whitespace-nowrap text-[13px] leading-[18px] text-fg-secondary">{retailer}</span>
        <IconCaretDown size={11} className="text-fg-secondary" />
      </button>
    </div>
  )
}

/* -------------------------------------------------------------- Card data */
type Chip = { img: string; label: string }
export type Card = {
  id: string
  img: string
  rank: string
  rankBrand: boolean
  title: string
  price: string
  at: string
  why: string
  whyLong: string
  chips: Chip[]
  primaryBtn: boolean
}

/**
 * The baked roster — a FAILURE FALLBACK, not a loading state (the shimmer covers the wait).
 * It leads with the three strollers actually on the retail page, so even the fallback describes
 * products the shopper can see. Every card gets its own photo.
 */
export const cards: Card[] = [
  {
    id: 'babytrend',
    img: asset.prodBabyTrend,
    rank: '#1 BEST MATCH',
    rankBrand: true,
    title: 'Baby Trend Passport Switch 6-in-1',
    price: '$199.99',
    at: 'AT AMAZON',
    why: 'Matches your priority on easy fold and everyday reliability. CR scored it top-tier for maneuverability and safety at a fraction of the price of the premium field.',
    whyLong:
      'Matches your priority on easy fold and everyday reliability. CR scored it top-tier for maneuverability and safety at a fraction of the price of the premium field. High durability ensures long-term value.',
    chips: [
      { img: asset.avCr, label: 'CR 2024 Lab Results' },
      { img: asset.avReddit, label: 'Reddit Community' },
    ],
    primaryBtn: true,
  },
  {
    id: 'vista',
    img: asset.prodVista,
    rank: '#2 RUNNER UP',
    rankBrand: false,
    title: 'UppaBaby Vista V2',
    price: '$999.00',
    at: 'AT AMAZON',
    why: 'The strongest all-terrain performer we tested — dual-action suspension rated top-tier for gravel and uneven paths. Heavy for stairs.',
    whyLong:
      'The strongest all-terrain performer we tested — dual-action suspension rated top-tier for gravel and uneven paths. Heavy for stairs, which counts against your walk-up.',
    chips: [{ img: asset.avCr, label: 'CR 2024 Lab Results' }],
    primaryBtn: false,
  },
  {
    id: 'city',
    img: asset.prodCity,
    rank: '#3 LIGHTEST',
    rankBrand: false,
    title: 'Baby Jogger City Mini GT2',
    price: '$399.99',
    at: 'AT WALMART',
    why: 'Excellent for your secondary need for compact storage. One-hand quick fold outperforms competitors in tight trunks.',
    whyLong:
      'Excellent for your secondary need for compact storage. One-hand quick fold outperforms competitors in tight trunks.',
    chips: [{ img: asset.avCr, label: 'Safety Certification' }],
    primaryBtn: false,
  },
  {
    id: 'graco',
    img: asset.prodGraco,
    rank: 'NOT RECOMMENDED',
    rankBrand: false,
    title: 'Graco Ready2Grow 2.0 Double Stroller',
    price: '$299.00',
    at: 'AT AMAZON',
    why: 'Only worth it if you need two seats. CR scored it 58/100 — a wide turning radius and a bulky fold make it a poor fit for a walk-up.',
    whyLong:
      'Only worth it if you need two seats. CR scored it 58/100 — a wide turning radius and a bulky fold make it a poor fit for a walk-up and public transit.',
    chips: [{ img: asset.avCr, label: 'CR 2024 Lab Results' }],
    primaryBtn: false,
  },
  {
    id: 'aero',
    img: asset.prodAero,
    rank: 'NOT RECOMMENDED',
    rankBrand: false,
    title: 'Dream On Me Aero Travel Umbrella',
    price: '$33.99',
    at: 'AT AMAZON',
    why: "The cheapest option on the shelf, and it shows: CR scored it 54/100 with low marks for ride comfort and durability.",
    whyLong:
      "The cheapest option on the shelf, and it shows: CR scored it 54/100 with low marks for ride comfort and durability. Fine as a spare; not as your only stroller.",
    chips: [{ img: asset.avReddit, label: 'Reddit Community' }],
    primaryBtn: false,
  },
]

/* ----- "ranking" shimmer, shown while decision_support is still generating ----- */
/** Placeholder cards in the same yellow-green gradient as Product Insights' GeneratingOverlay.
 *  Exists so the screen never shows the baked mock roster (Vista / City Mini / Lite 3 — strollers
 *  that aren't even on the retail page) while the real ranking is still in flight. */
function RankingShimmer({ count = 3 }: { count?: number }) {
  return (
    <div className="flex w-full flex-col gap-[20px]" aria-busy="true" aria-label="Ranking strollers">
      <p className="text-[13px] font-semibold leading-[18px] text-fg-secondary">
        Ranking these strollers against your priorities…
      </p>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex w-full items-start gap-[16px] rounded-[12px] border-[0.5px] border-border-subtle bg-bg-secondary p-[16px]"
        >
          <div
            className="size-[96px] shrink-0 animate-pulse rounded-[8px] bg-gradient-to-br from-[rgba(217,237,226,0.9)] to-[rgba(251,245,221,0.9)]"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-[10px] pt-[6px]">
            <div
              className="h-[14px] w-[30%] animate-pulse rounded-[4px] bg-gradient-to-r from-[rgba(217,237,226,0.9)] to-[rgba(251,245,221,0.9)]"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
            <div
              className="h-[18px] w-[55%] animate-pulse rounded-[4px] bg-gradient-to-r from-[rgba(217,237,226,0.9)] to-[rgba(251,245,221,0.9)]"
              style={{ animationDelay: `${i * 0.15 + 0.06}s` }}
            />
            <div
              className="h-[12px] w-full animate-pulse rounded-[4px] bg-gradient-to-r from-[rgba(217,237,226,0.7)] to-[rgba(251,245,221,0.7)]"
              style={{ animationDelay: `${i * 0.15 + 0.12}s` }}
            />
            <div
              className="h-[12px] w-[75%] animate-pulse rounded-[4px] bg-gradient-to-r from-[rgba(217,237,226,0.7)] to-[rgba(251,245,221,0.7)]"
              style={{ animationDelay: `${i * 0.15 + 0.18}s` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ----- map a live decision_support payload -> the screen's Card[] ----- */
/**
 * A product's photo. The three strollers on the retail page have their own real shots (cropped
 * from that page); anything else the agent surfaces falls back to a generic stroller photo, and
 * alternates so a live list never shows the same picture five times.
 */
const FALLBACK_IMAGES = [asset.prodVista, asset.prodCity]
function productImage(name: string, index = 0): string {
  const n = name.toLowerCase()
  if (n.includes('baby trend') || n.includes('passport')) return asset.prodBabyTrend
  if (n.includes('graco') || n.includes('ready2grow')) return asset.prodGraco
  if (n.includes('dream on me') || n.includes('aero')) return asset.prodAero
  if (n.includes('city mini') || n.includes('gt2')) return asset.prodCity
  if (n.includes('vista') || n.includes('uppababy')) return asset.prodVista
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

function productsToCards(payload: DecisionSupportPayload): Card[] {
  return payload.products.map((p, i) => {
    const badges = p.evidence_badges ?? []
    const why =
      p.recommendation_rationale ??
      `${p.specs.fold} fold · ${p.specs.weight} · ${p.specs.terrain}`
    return {
      id: p.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `rank-${p.rank}`,
      img: productImage(p.product_name, i),
      rank: p.rank_label,
      rankBrand: p.rank === 1,
      title: p.product_name,
      price: p.price,
      at: p.retailer ? `AT ${p.retailer.toUpperCase()}` : '',
      why,
      whyLong: why,
      chips: badges.map((b) => ({
        img: /cr |consumer reports|lab/i.test(b) ? asset.avCr : asset.avReddit,
        label: b,
      })),
      primaryBtn: p.rank === 1,
    }
  })
}

function productsToTableRows(payload: DecisionSupportPayload): TableRow[] {
  return payload.products.slice(0, 5).map((p) => {
    const notRec = /not recommended/i.test(p.rank_label)
    return {
      name: p.product_name,
      badge: p.rank === 1 ? 'BEST' : p.rank === 2 ? 'RUNNER' : notRec ? 'NOT REC' : undefined,
      badgeType: p.rank === 1 ? 'best' : p.rank === 2 ? 'runner' : notRec ? 'notrec' : undefined,
      fold: p.specs.fold,
      weight: p.specs.weight,
      terrain: p.specs.terrain !== 'Pavement only',
      price: p.price,
    }
  })
}

/* ----------------------------------------------------------- Why-this-fits */
function WhyThisFits({ text, pad = 9 }: { text: string; pad?: number }) {
  return (
    <div
      className="w-full rounded-[12px] border border-[#daede0] bg-[rgba(240,253,244,0.2)]"
      style={{ padding: pad }}
    >
      <div className="flex flex-col gap-[8px]">
        <div className="flex items-center gap-[8px]">
          <img src={asset.whyCheck} alt="" className="h-[14px] w-[14.667px]" />
          <span className="whitespace-nowrap text-[14px] leading-[20px] text-[#15803d]">WHY THIS FITS YOU</span>
        </div>
        <p className="text-[14px] leading-[20px] text-[#47464b]">{text}</p>
      </div>
    </div>
  )
}

function SourceChip({ chip }: { chip: Chip }) {
  return (
    <div className="flex items-center gap-[6px] self-stretch rounded-full bg-bg-tertiary px-[10px] py-[4px]">
      <img src={chip.img} alt="" className="size-[20px] rounded-full border-[0.5px] border-white object-cover" />
      <span className="whitespace-nowrap text-[14px] leading-[20px] text-fg-secondary">{chip.label}</span>
    </div>
  )
}

/* ---------------------------------------------------------- Compact card */
/**
 * The saved-list card. Exported, because the shared list in the collaboration flow shows the
 * *same* list — a shopper who shares their picks should see exactly the cards they just chose,
 * not a second card design that happens to describe the same products.
 *
 * `selectable={false}` drops the checkbox for read-only contexts (the shared list).
 */
export function CompactCard({
  card,
  checked = false,
  onCheck,
  onReview,
  onCompareHover,
  selectable = true,
  children,
}: {
  card: Card
  checked?: boolean
  onCheck?: () => void
  onReview?: () => void
  onCompareHover?: (hovering: boolean) => void
  selectable?: boolean
  children?: ReactNode
}) {
  return (
    <div className="relative flex w-full items-start gap-[8px]">
      {selectable && (
        <div className="flex w-[24px] shrink-0 flex-col items-center pt-[47px]">
          <CheckBox checked={checked} onClick={onCheck} />
        </div>
      )}
      <div className="flex min-w-px flex-1 flex-col gap-[16px] overflow-clip rounded-[8px] border border-border-subtle bg-bg-primary p-[17px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-[16px]">
          <div className="flex size-[80px] shrink-0 items-center justify-center overflow-clip rounded-[8px] bg-bg-tertiary">
            <img src={card.img} alt="" className="size-full rounded-[8px] object-cover" />
          </div>
          <div className="flex flex-1 flex-col gap-[4px]">
            <div className="flex">
              <div
                className={`flex items-start rounded-[4px] px-[8px] py-[4px] ${
                  card.rankBrand ? 'bg-bg-brand-muted' : 'bg-bg-tertiary'
                }`}
              >
                <span
                  className={`whitespace-nowrap text-[14px] leading-[20px] ${
                    card.rankBrand ? 'text-fg-brand' : 'text-fg-secondary'
                  }`}
                >
                  {card.rank}
                </span>
              </div>
            </div>
            <p className="text-[14px] font-semibold leading-[20px] text-fg-primary">{card.title}</p>
            <PriceRow card={card} onCompareHover={onCompareHover} />
          </div>
        </div>

        <WhyThisFits text={card.why} />

        <div className="flex flex-wrap gap-[8px]">
          {card.chips.map((c) => (
            <SourceChip key={c.label} chip={c} />
          ))}
        </div>

        {/* Every card's action is the same action, so every card's button looks the same. The
            ranking is carried by the rank badge, not by making four of five buttons look inert. */}
        <button
          onClick={onReview}
          className="w-full rounded-[8px] bg-brand py-[10px] text-center text-[14px] font-semibold leading-[20px] text-fg-inverse"
        >
          View Full Review
        </button>

        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------ Compare popover */
type Retailer = { name: string; price: string; deal: string; dealColor: string; primary: boolean }
const retailers: Retailer[] = [
  { name: 'Amazon', price: '$899.99', deal: 'PRIME DEAL: 10% OFF', dealColor: 'text-fg-brand', primary: true },
  { name: 'Target', price: '$949.99', deal: 'REDCARD: 5% OFF', dealColor: 'text-fg-brand', primary: false },
  { name: 'BuyBuy Baby', price: '$999.00', deal: 'FREE SHIPPING', dealColor: 'text-fg-secondary', primary: false },
]

function ComparePopover({
  onClose,
  onHover,
}: {
  onClose: () => void
  onHover?: (hovering: boolean) => void
}) {
  return (
    <div
      className="absolute z-20 flex flex-col gap-[16px] overflow-clip rounded-[8px] border border-border-subtle bg-bg-primary p-[17px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
      style={{ right: 70, top: 276, width: 288 }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <div className="flex items-center justify-between">
        <span className="text-[14px] leading-[20px] text-fg-primary">Compare Prices</span>
        <button aria-label="Close" onClick={onClose} className="size-[10.5px] pb-[6px]">
          <img src={asset.close} alt="" className="size-[10.5px]" />
        </button>
      </div>
      <div className="flex flex-col gap-[12px]">
        {retailers.map((r) => (
          <div key={r.name} className="flex flex-col gap-[4px] border-b border-border-subtle pb-[9px]">
            <div className="flex items-baseline justify-between">
              <span className="text-[16px] leading-[24px] text-fg-primary">{r.name}</span>
              <span className="text-[14px] leading-[20px] text-fg-primary">{r.price}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[12px] font-semibold leading-[16px] ${r.dealColor}`}>{r.deal}</span>
              <button
                className={`flex items-center justify-center rounded-[12px] px-[12px] py-[4px] text-[12px] font-semibold leading-[16px] ${
                  r.primary ? 'bg-brand text-fg-inverse' : 'border border-border-subtle bg-bg-tertiary text-fg-secondary'
                }`}
              >
                View Deal
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* --------------------------------------------------------- Table (shared) */
type TableRow = {
  name: string
  badge?: string
  badgeType?: 'best' | 'runner' | 'notrec'
  fold: string
  weight: string
  terrain: boolean
  price: string
}
const tableRows: TableRow[] = [
  { name: 'Vista V2', badge: 'BEST', badgeType: 'best', fold: '2-Step', weight: '27lb', terrain: true, price: '$999' },
  { name: 'GT2', badge: 'RUNNER', badgeType: 'runner', fold: '1-Hand', weight: '21lb', terrain: true, price: '$449' },
  { name: 'Lite 3', badge: 'NOT REC', badgeType: 'notrec', fold: '3-Step', weight: '15lb', terrain: false, price: '$199' },
  { name: 'Mockingbird', fold: '2-Step', weight: '26lb', terrain: true, price: '$650' },
  { name: 'Cruz V2', fold: '2-Step', weight: '25lb', terrain: true, price: '$699' },
]

function TerrainMark({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="flex size-[20px] items-center justify-center rounded-full bg-rating-excellent">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5L20 6" />
      </svg>
    </span>
  ) : (
    <span className="flex size-[20px] items-center justify-center rounded-full bg-bg-attention">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </span>
  )
}

function TableBadge({ row }: { row: TableRow }) {
  if (!row.badge) return null
  const cls =
    row.badgeType === 'best'
      ? 'bg-bg-brand-muted text-fg-brand'
      : row.badgeType === 'runner'
        ? 'bg-border-subtle text-fg-brand'
        : 'bg-[#fef2f2] text-fg-attention'
  return (
    <div className={`flex w-fit items-center rounded-full px-[6px] py-[2px] ${cls}`}>
      <span className="whitespace-nowrap text-[12px] font-semibold leading-[16px]">{row.badge}</span>
    </div>
  )
}

/** Insight callout — gradient "CR Verdict" banner (Figma 1052:3959). */
function InsightCallout({ verdict }: { verdict?: string | null }) {
  return (
    <div className="flex w-full shrink-0 items-start gap-[12px] rounded-[16px] bg-gradient-to-r from-[rgba(217,237,226,0.3)] to-[rgba(251,245,221,0.3)] p-[16px]">
      <img src={`${I}info.svg`} alt="" className="size-[20px] shrink-0" />
      <p className="flex-1 text-[16px] leading-[24px] text-fg-primary">
        {verdict
          ? `CR Verdict: ${verdict}`
          : 'CR Verdict: The Vista V2 is heavier but offers superior durability and all-terrain performance which matches your "Rural/Active" preference profile.'}
      </p>
    </div>
  )
}

/** Pick a stroller thumbnail for a table row (only two product photos exist). */
function tableRowImage(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('gt2') || n.includes('city') || n.includes('lite') || n.includes('minu')) return asset.prodCity
  return asset.prodVista
}

/** Standard comparison table — 6 columns: select · Product · Fold · Weight · Terrain · Price.
    The select-all lives in the toolbar above, so the header row has no checkbox. */
function StandardTable({
  rows,
  selected,
  onToggle,
}: {
  rows: TableRow[]
  selected: Set<string>
  onToggle: (name: string) => void
}) {
  const th =
    'flex items-center border-b border-border-subtle px-[10px] py-[12px] text-[13px] font-semibold leading-[18px] text-fg-secondary'
  const td =
    'flex items-center border-b border-border-subtle px-[10px] py-[14px] text-[15px] leading-[20px] text-fg-primary'
  return (
    <div className="w-full shrink-0 overflow-clip rounded-[12px] border border-border-subtle">
      {/* header */}
      <div className="flex w-full items-stretch bg-bg-tertiary">
        <div className={`${th} w-[44px] justify-center`} />
        <div className={`${th} flex-1 justify-start`}>Product</div>
        <div className={`${th} w-[66px] justify-center`}>Fold</div>
        <div className={`${th} w-[66px] justify-center`}>Weight</div>
        <div className={`${th} w-[66px] justify-center`}>Terrain</div>
        <div className={`${th} w-[62px] justify-end`}>Price</div>
      </div>
      {/* body */}
      <div className="flex w-full flex-col bg-bg-primary">
        {rows.map((r) => (
          <div key={r.name} className="flex w-full items-stretch">
            <div className={`${td} w-[44px] justify-center`}>
              <CheckBox checked={selected.has(r.name)} onClick={() => onToggle(r.name)} />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-[3px] border-b border-border-subtle px-[10px] py-[12px]">
              <span className="text-[15px] font-medium leading-[20px] text-fg-primary">{r.name}</span>
              <TableBadge row={r} />
            </div>
            <div className={`${td} w-[66px] justify-center`}>{r.fold}</div>
            <div className={`${td} w-[66px] justify-center`}>{r.weight}</div>
            <div className={`${td} w-[66px] justify-center`}>
              <TerrainMark ok={r.terrain} />
            </div>
            <div className={`${td} w-[62px] justify-end`}>{r.price}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Wide table — Expanded Table View. 6 columns: select · Product (thumbnail + name) · Fold ·
    Weight · Terrain · Price. The select-all lives in the toolbar above. */
function ExpandedTable({
  rows,
  selected,
  onToggle,
}: {
  rows: TableRow[]
  selected: Set<string>
  onToggle: (name: string) => void
}) {
  const th =
    'flex items-center border-b border-border-subtle px-[14px] py-[12px] text-[14px] font-semibold leading-[20px] text-fg-secondary'
  const td =
    'flex items-center border-b border-border-subtle px-[14px] py-[16px] text-[16px] leading-[24px] text-fg-primary'
  return (
    <div className="w-full shrink-0 overflow-clip rounded-[12px] border border-border-subtle">
      {/* header */}
      <div className="flex w-full items-stretch bg-bg-tertiary">
        <div className={`${th} w-[56px] justify-center`} />
        <div className={`${th} flex-1 justify-start`}>Product</div>
        <div className={`${th} w-[130px] justify-start`}>Fold</div>
        <div className={`${th} w-[130px] justify-start`}>Weight</div>
        <div className={`${th} w-[130px] justify-start`}>Terrain</div>
        <div className={`${th} w-[120px] justify-start`}>Price</div>
      </div>
      {/* body */}
      <div className="flex w-full flex-col bg-bg-primary">
        {rows.map((r) => (
          <div key={r.name} className="flex w-full items-stretch">
            <div className={`${td} w-[56px] justify-center`}>
              <CheckBox checked={selected.has(r.name)} onClick={() => onToggle(r.name)} />
            </div>
            <div className="flex flex-1 items-center gap-[14px] border-b border-border-subtle px-[14px] py-[14px]">
              <div className="flex size-[52px] shrink-0 items-center justify-center overflow-clip rounded-[8px] bg-bg-tertiary">
                <img src={tableRowImage(r.name)} alt="" className="size-full object-cover" />
              </div>
              <div className="flex flex-col gap-[4px]">
                <span className="text-[16px] font-medium leading-[22px] text-fg-primary">{r.name}</span>
                <TableBadge row={r} />
              </div>
            </div>
            <div className={`${td} w-[130px] justify-start`}>{r.fold}</div>
            <div className={`${td} w-[130px] justify-start`}>{r.weight}</div>
            <div className={`${td} w-[130px] justify-start`}>
              <TerrainMark ok={r.terrain} />
            </div>
            <div className={`${td} w-[120px] justify-start`}>{r.price}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Featured verdict banner atop the Expanded Table View. */
function ExpandedVerdictBanner({ product, verdict }: { product?: Card; verdict?: string | null }) {
  return (
    <div className="flex w-full shrink-0 items-center gap-[16px] rounded-[16px] bg-gradient-to-r from-[rgba(217,237,226,0.3)] to-[rgba(251,245,221,0.3)] p-[16px]">
      <div className="flex size-[64px] shrink-0 items-center justify-center overflow-clip rounded-[8px] bg-bg-tertiary">
        <img src={product?.img ?? asset.prodVista} alt="" className="size-full object-cover" />
      </div>
      <div className="flex w-[200px] shrink-0 flex-col gap-[4px]">
        <div className="flex w-fit rounded-[4px] bg-bg-brand-muted px-[8px] py-[2px]">
          <span className="text-[12px] font-semibold leading-[16px] text-fg-brand">CR Verdict</span>
        </div>
        <p className="text-[18px] font-semibold leading-[22px] text-fg-primary">{product?.title ?? 'UppaBaby Vista V2'}</p>
        <p className="text-[14px] leading-[20px] text-fg-primary">{product?.price ?? '$999.00'}</p>
      </div>
      <p className="flex-1 text-[16px] leading-[24px] text-fg-secondary">
        {verdict ??
          'The Vista V2 is heavier but offers superior durability and all-terrain performance which matches your "Rural/Active" preference profile.'}
      </p>
    </div>
  )
}

/* --------------------------------------------------- Expanded card + metrics */
type MetricIcon = (p: { size?: number; className?: string }) => JSX.Element
type Metric = { title: string; text: string; Icon: MetricIcon }

/** All six things CR scores a stroller on — the full picture, not a sample of three. */
const metrics: Metric[] = [
  {
    title: 'Safety',
    text: 'Five-point harness and a parking brake that held on every incline our testers ran.',
    Icon: IconSafety,
  },
  {
    title: 'Maneuverability',
    text: 'Handles sidewalks and curbs effortlessly; tight turning radius in our urban course.',
    Icon: IconCompass,
  },
  {
    title: 'Ease of fold',
    text: 'Snaps open and folds shut in seconds — one hand, no wrestling.',
    Icon: IconFold,
  },
  {
    title: 'Comfort',
    text: 'Plush seat, smooth suspension. Fewer complaints from the passenger seat.',
    Icon: IconComfort,
  },
  {
    title: 'Weight',
    text: "Middle of the pack — manageable day to day, but you'll feel it on stairs.",
    Icon: IconWeight,
  },
  {
    title: 'Durability',
    text: 'High-quality fabrics and wheels that make resale easy and hand-me-downs an option.',
    Icon: IconDurability,
  },
]

function MetricSources() {
  return (
    <div className="flex items-center gap-[10px]">
      <div className="relative flex size-[28px] items-center opacity-60">
        <img
          src={`${I}av5.png`}
          alt=""
          className="absolute left-[14px] top-[4px] size-[20px] rounded-full border-[0.5px] border-white object-cover"
        />
        <img
          src={`${I}av7.png`}
          alt=""
          className="size-[20px] rounded-full border-[0.5px] border-white object-cover"
        />
      </div>
      <span className="whitespace-nowrap text-[14px] leading-[20px] text-fg-secondary">+1</span>
    </div>
  )
}

function MetricCard({ m }: { m: Metric }) {
  return (
    <div className="flex items-start gap-[14px] overflow-clip rounded-[8px] border border-border-subtle bg-bg-primary p-[16px]">
      <div className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-bg-tertiary">
        <m.Icon size={20} className="text-fg-primary" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <div className="flex items-center gap-[8px]">
          <span className="whitespace-nowrap text-[14px] font-semibold leading-[20px] text-fg-primary">
            {m.title}
          </span>
          <MetricSources />
        </div>
        <p className="text-[14px] leading-[20px] text-fg-secondary">{m.text}</p>
      </div>
    </div>
  )
}

function ExpandedCard({
  card,
  checked,
  onCheck,
  showDetails,
  onToggleDetails,
}: {
  card: Card
  checked: boolean
  onCheck: () => void
  showDetails: boolean
  onToggleDetails: () => void
}) {
  return (
    <div className="flex w-full items-start gap-[8px]">
      <div className="flex w-[24px] shrink-0 flex-col items-center pt-[47px]">
        <CheckBox checked={checked} onClick={onCheck} />
      </div>
      <div className="flex min-w-px flex-1 flex-col gap-[16px] rounded-[8px] border border-border-subtle bg-bg-primary p-[17px] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.04)]">
        <div className="relative flex items-start gap-[20px]">
          {/* image + carousel */}
          <div className="relative flex size-[311px] shrink-0 items-center justify-center overflow-clip rounded-[24px] bg-bg-tertiary">
            <img src={card.img} alt="" className="size-full object-cover" />
            <div className="absolute left-0 top-[144px] flex w-[311px] items-center justify-between px-[8px]">
              <button aria-label="Previous" className="flex size-[24px] items-center justify-center rounded-full bg-white/80 text-fg-primary shadow-subtle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <button aria-label="Next" className="flex size-[24px] items-center justify-center rounded-full bg-white/80 text-fg-primary shadow-subtle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
          </div>
          {/* right column */}
          <div className="flex h-[311px] w-[429px] shrink-0 flex-col gap-[19px]">
            <div className="flex flex-col gap-[5px] pt-[4px]">
              <div className="flex w-fit rounded-[8px] bg-bg-brand-muted px-[10px] py-[5px]">
                <span className="whitespace-nowrap text-[14px] leading-[20px] text-fg-brand">{card.rank}</span>
              </div>
              <p className="text-[14px] font-semibold leading-[20px] text-fg-primary">{card.title}</p>
              <PriceRow card={card} />
            </div>
            <WhyThisFits text={card.whyLong} pad={17} />
            <div className="flex flex-wrap gap-[8px]">
              {card.chips.map((c) => (
                <SourceChip key={c.label} chip={c} />
              ))}
            </div>
          </div>
        </div>

        {/* The six CR metrics, and the toggle that reveals them. The toggle is centred and always
            sits last, so expanding pushes it to the bottom of the card rather than leaving it
            stranded in the middle of the content it opened. */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-[12px]">
            {metrics.map((m) => (
              <MetricCard key={m.title} m={m} />
            ))}
          </div>
        )}

        <button
          onClick={onToggleDetails}
          className="mx-auto flex items-center gap-[6px] rounded-pill px-[12px] py-[4px]"
        >
          <span className="whitespace-nowrap text-[14px] font-semibold leading-[20px] text-fg-secondary">
            {showDetails ? 'Hide Details' : 'Show Details'}
          </span>
          <img src={`${I}caret.svg`} alt="" className={`h-[5.55px] w-[9px] ${showDetails ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  )
}

/* --------------------------------------------------- Detailed deep-dive */
type DeepDiveSource = { avatar: string; name: string; quote: string }
type DetailRow = {
  icon: string
  iconSize: number
  title: string
  subtitle: string
  sources?: DeepDiveSource[] // real evidence (live rows only; baked rows use the generic fallback)
}
const detailRows: DetailRow[] = [
  { icon: `${I}toprated.svg`, iconSize: 20, title: 'Top Rated', subtitle: 'No bumps in the road here. CR and parents agree: this one earns its reputation.' },
  { icon: `${I}city.svg`, iconSize: 18, title: 'City Certified', subtitle: 'Built for the urban jungle. Handles sidewalks and curbs effortlessly and folds compactly.' },
  { icon: `${I}sketch.svg`, iconSize: 20, title: 'Built to Last', subtitle: 'High-quality fabrics and wheels that make resale easy and hand-me-downs an option.' },
  { icon: `${I}cloud.svg`, iconSize: 20, title: 'Ride in Comfort', subtitle: 'Plush seat, smooth suspension, happy kid. Fewer complaints from the passenger seat.' },
  { icon: `${I}fold.svg`, iconSize: 28, title: 'No-Fuss Fold', subtitle: 'Snaps open and folds shut in seconds — one hand, no wrestling.' },
]

/** Map a live product_insights payload -> the deep-dive's DetailRow[]. */
const DEEP_DIVE_ICON: Record<string, { icon: string; size: number }> = {
  safety: { icon: `${I}toprated.svg`, size: 20 },
  maneuverability: { icon: `${I}city.svg`, size: 18 },
  fold: { icon: `${I}fold.svg`, size: 28 },
  ease_of_use: { icon: `${I}sketch.svg`, size: 20 },
  service: { icon: `${I}sketch.svg`, size: 20 },
  durability: { icon: `${I}sketch.svg`, size: 20 },
  value: { icon: `${I}toprated.svg`, size: 20 },
  comfort: { icon: `${I}cloud.svg`, size: 20 },
}
const DD_AVATAR: Record<string, string> = {
  consumer_reports: `${I}av7.png`,
  reddit: `${I}av5.png`,
  web: `${I}link.svg`,
  youtube: `${I}link.svg`,
}
const DD_LABEL: Record<string, string> = {
  consumer_reports: 'Consumer Reports',
  reddit: 'Reddit',
  web: 'Web',
  youtube: 'YouTube',
}
const DD_COMMUNITY_AVATAR: Record<CommunitySource, string> = {
  Instagram: '/figma/comm-instagram.png',
  Reddit: '/figma/comm-reddit.svg',
  YouTube: '/figma/comm-youtube.svg',
  Tiktok: '/figma/comm-tiktok.svg',
  Pinterest: '/figma/comm-pinterest.svg',
  'Online blogs': '/figma/comm-google.svg',
}

/** Same content as the Product Insights card: real CR/web evidence + connected community posts. */
function insightsToDetailRows(payload: ProductInsightsPayload, connectedSources: string[]): DetailRow[] {
  return payload.insights
    // Same rule as Product Insights: no insight without real (non-youtube/competitor) evidence.
    .filter((ins) => cleanEvidence(ins.evidence ?? []).length > 0)
    .map((ins) => {
      const meta = DEEP_DIVE_ICON[ins.category] ?? { icon: `${I}toprated.svg`, size: 20 }
      const realSources = cleanEvidence(ins.evidence ?? []).map((e) => ({
        avatar: DD_AVATAR[e.source_type] ?? `${I}link.svg`,
        name: DD_LABEL[e.source_type] ?? e.source_name,
        quote: e.quote,
      }))
      const communitySources = (communityPosts[ins.category] ?? [])
        .filter((p) => connectedSources.includes(p.source))
        .map((p) => ({ avatar: DD_COMMUNITY_AVATAR[p.source], name: p.handle, quote: p.quote }))
      return {
        icon: meta.icon,
        iconSize: meta.size,
        title: ins.label,
        subtitle: ins.summary,
        sources: [...realSources, ...communitySources],
      }
    })
}

function DeepDiveRow({ row, first, last }: { row: DetailRow; first: boolean; last: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`flex w-full flex-col border-[0.5px] border-[#dfdfd9] bg-white ${first ? 'rounded-t-[16px]' : '-mt-[0.5px]'} ${
        last && !open ? 'rounded-b-[16px]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-[8px] overflow-hidden pb-[16px] pl-[16px] pr-[16px] pt-[16px]">
        <div className="flex flex-1 items-start gap-[12px]">
          <div className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-bg-secondary">
            <img src={row.icon} alt="" style={{ width: row.iconSize, height: row.iconSize }} />
          </div>
          <div className="flex flex-1 flex-col gap-[4px]">
            <p className="text-[14px] font-semibold leading-[20px] text-fg-primary">{row.title}</p>
            <p className="text-[14px] leading-[20px] text-[#282923]">{row.subtitle}</p>
          </div>
        </div>
        {row.sources && row.sources.length > 0 && (
          <div className="flex shrink-0 items-center gap-[4px] pr-[4px]">
            <div className="flex">
              {row.sources.slice(0, 2).map((s, i) => (
                <img
                  key={i}
                  src={s.avatar}
                  alt=""
                  className="size-[20px] rounded-full border-[0.5px] border-white object-cover"
                  style={{ marginLeft: i === 0 ? 0 : -8 }}
                />
              ))}
            </div>
            {row.sources.length > 2 && (
              <span className="whitespace-nowrap text-[12px] font-semibold leading-[16px] text-fg-secondary">
                +{row.sources.length - 2}
              </span>
            )}
          </div>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle"
          className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-bg-tertiary"
        >
          <img src={`${I}caret.svg`} alt="" className={`h-[9px] w-[12px] ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-[12px] border-t-[0.5px] border-[#dadada] px-[20px] pb-[16px] pt-[14px]">
          {row.sources && row.sources.length > 0 ? (
            row.sources.map((s, i) => (
              <div key={i} className="flex flex-col gap-[6px]">
                <p className="text-[14px] leading-[20px] text-[#242424]">{s.quote}</p>
                <div className="flex w-fit items-center gap-[4px] rounded-full border border-border-subtle bg-white py-[4px] pl-[8px] pr-[12px]">
                  <img src={s.avatar} alt="" className="size-[16px] rounded-full border-[0.5px] border-white object-cover" />
                  <span className="whitespace-nowrap text-[11px] leading-[16px] text-[#222]">{s.name}</span>
                  <img src={`${I}arrowupright.svg`} alt="" className="size-[12px]" />
                </div>
              </div>
            ))
          ) : (
            <>
              <p className="text-[14px] leading-[20px] text-[#242424]">
                CR's lab testers and community threads consistently rank this near the top for {row.title.toLowerCase()}.
              </p>
              <div className="flex w-fit items-center gap-[4px] rounded-full border border-border-subtle bg-white py-[4px] pl-[8px] pr-[12px]">
                <img src={`${I}av7.png`} alt="" className="size-[16px] rounded-full border-[0.5px] border-white object-cover" />
                <span className="whitespace-nowrap text-[11px] leading-[16px] text-[#222]">Consumer Reports</span>
                <img src={`${I}arrowupright.svg`} alt="" className="size-[12px]" />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function DetailedDeepDive({ onBack, product }: { onBack: () => void; product?: string | null }) {
  // Keep the raw payload so the rows re-derive when communities are connected/disconnected.
  const [livePayload, setLivePayload] = useState<ProductInsightsPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const connected = usePreferences((s) => s.sources)
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current || !product) return
    didFetch.current = true
    setLoading(true)
    callConnieCached({ message: `What are the key insights on the ${product}?` })
      .then((r) => {
        if (isProductInsights(r) && r.product_insights.insights.length > 0) {
          setLivePayload(r.product_insights)
        }
      })
      .catch(() => {
        /* keep baked rows on error */
      })
      .finally(() => setLoading(false))
  }, [product])
  const liveRows = livePayload ? insightsToDetailRows(livePayload, connected) : null
  const rows = liveRows ?? detailRows

  return (
    <div className="flex w-full flex-1 flex-col gap-[20px] overflow-auto pt-[8px]">
      {/* RECOMMENDED + Save */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-[10px]">
          <img src={`${I}star.svg`} alt="" className="size-[20px]" />
          <span className="text-[18px] font-semibold leading-[22px] tracking-[-0.25px] text-fg-primary">RECOMMENDED</span>
          <img src={`${I}info.svg`} alt="" className="size-[20px]" />
        </div>
        <button className="flex h-[36px] items-center justify-center gap-[6px] rounded-[24px] border border-border-subtle bg-white px-[16px]">
          <span className="text-[14px] font-semibold leading-[20px] text-fg-secondary">Save</span>
          <img src={`${I}save.svg`} alt="" className="h-[11px] w-[13px]" />
        </button>
      </div>

      {/* DID YOU KNOW */}
      <div className="relative flex w-full flex-col gap-[4px] overflow-hidden rounded-[8px] bg-gradient-to-r from-[rgba(217,237,226,0.3)] to-[rgba(251,245,221,0.3)] px-[16px] py-[14px]">
        <div className="flex items-center gap-[8px]">
          <img src={`${I}shootingstar.svg`} alt="" className="size-[18px]" />
          <span className="text-[14px] font-semibold leading-[20px] text-[#282923]">DID YOU KNOW?</span>
        </div>
        <p className="w-[300px] text-[14px] leading-[20px] text-[#282923]">
          Oscar-winning actress Anne Hathaway has been spotted pushing this stroller through Central Park.
        </p>
        <img
          src={`${I}didyouknow.png`}
          alt=""
          className="absolute right-[16px] top-[14px] size-[80px] rounded-[8px] object-cover opacity-15"
        />
      </div>

      {/* rows */}
      {loading && !liveRows && (
        <p className="text-[13px] leading-[18px] text-fg-secondary">
          Pulling {product ?? 'this stroller'}’s live review…
        </p>
      )}
      <div className="flex w-full flex-col">
        {rows.map((r, i) => (
          <DeepDiveRow key={r.title} row={r} first={i === 0} last={i === rows.length - 1} />
        ))}
      </div>

      <button onClick={onBack} className="text-left text-[14px] font-semibold leading-[20px] text-fg-brand">
        ← Back to list
      </button>
    </div>
  )
}

/* --------------------------------------------------------- State switcher */
type StateKey = 'cards' | 'table' | 'editable' | 'compare' | 'detailed' | 'xcards' | 'xtable'
function StateSwitcher({ current, onSelect }: { current: StateKey; onSelect: (k: StateKey) => void }) {
  const items: { k: StateKey; label: string }[] = [
    { k: 'cards', label: 'Cards' },
    { k: 'table', label: 'Table' },
    { k: 'editable', label: 'Editable' },
    { k: 'compare', label: 'Compare' },
    { k: 'detailed', label: 'Detailed' },
    { k: 'xcards', label: 'Exp. Cards' },
    { k: 'xtable', label: 'Exp. Table' },
  ]
  return (
    <div className="absolute left-[12px] top-[12px] z-30 flex flex-wrap items-center gap-[4px] rounded-[10px] border border-border-subtle bg-white/95 p-[6px] shadow-subtle">
      {items.map((it) => (
        <button
          key={it.k}
          onClick={() => onSelect(it.k)}
          className={`rounded-[6px] px-[8px] py-[4px] text-[12px] font-medium ${
            current === it.k ? 'bg-brand text-fg-inverse' : 'text-fg-secondary hover:bg-bg-tertiary'
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

/* ============================================================ Screen */
export function DecisionSupportScreen() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const view = (params.get('view') as View) || 'cards'
  const expanded = params.get('expanded') === '1'
  const mode = (params.get('mode') as Mode) || null

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [tableSelected, setTableSelected] = useState<Set<string>>(new Set())
  /** Which expanded cards have their metrics open — per card, not one shared flag. */
  const [detailsOpen, setDetailsOpen] = useState<Set<string>>(new Set())
  const toggleDetails = (id: string) =>
    setDetailsOpen((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const [hoverCompare, setHoverCompare] = useState(false)

  // Fetch the live ranking once (guard against StrictMode double-invoke). Until it returns,
  // the baked data shows so the screen never breaks; live data swaps in when it arrives.
  const preferences = usePreferences((s) => s.preferences)
  const [reviewProduct, setReviewProduct] = useState<string | null>(null)
  const didFetch = useRef(false)

  /** Seed from the session cache so navigating back doesn't re-run the ranking (the heaviest call
   *  in the flow). The cache is module-level, so it survives this component being unmounted. */
  const cachedRanking = () => {
    const hit = peekConnieCache({
      message: 'Rank these strollers for me',
      priorities: preferencesToPriorities(preferences) || undefined,
    })
    return hit && isDecisionSupport(hit) ? hit.decision_support : null
  }
  const [livePayload, setLivePayload] = useState<DecisionSupportPayload | null>(cachedRanking)
  /** Answered already this session? Then skip the loading beat entirely — replaying it over data
   *  we already have is theatre, not feedback. */
  const [alreadyCached] = useState(() => livePayload !== null)

  // `decision_support` is the heaviest call in the flow (it ranks the whole roster with CR lookups)
  // and routinely takes 20-40s. Until it settles we show a shimmer, NOT the baked cards — those
  // are a failure fallback, and they look completely real.
  const [rankSettled, setRankSettled] = useState(alreadyCached)
  /** LOADING_MS floor, so the shimmer never flashes past. */
  const [minRankDone, setMinRankDone] = useState(alreadyCached)
  useEffect(() => {
    if (alreadyCached) return
    const min = window.setTimeout(() => setMinRankDone(true), LOADING_MS)
    // Ceiling, so a hung backend can't leave the user staring at a shimmer forever.
    const cap = window.setTimeout(() => setRankSettled(true), MAX_LOADING_MS)
    return () => {
      window.clearTimeout(min)
      window.clearTimeout(cap)
    }
  }, [alreadyCached])
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    callConnieCached({
      message: 'Rank these strollers for me',
      priorities: preferencesToPriorities(preferences) || undefined,
    })
      .then((r) => {
        if (isDecisionSupport(r) && r.decision_support.products.length > 0) {
          setLivePayload(r.decision_support)
        } else {
          // Wrong response_type or empty products — the screen silently shows the baked Vista /
          // City Mini / Lite 3 mock, which looks real. Say so.
          console.warn('[Connie] Decision Support fell back to mock data: backend returned', r)
        }
      })
      .catch((err) => {
        console.warn('[Connie] Decision Support fetch failed, showing mock data:', err)
      })
      // Settled either way: live ranking replaces the shimmer, a failure falls back to the mock.
      .finally(() => setRankSettled(true))
  }, [])
  const activeCards = livePayload ? productsToCards(livePayload) : cards
  const activeTableRows = livePayload ? productsToTableRows(livePayload) : tableRows
  /** Still ranking — show the shimmer rather than the baked fallback cards and table. Holds for
   *  the LOADING_MS floor, then until the fetch actually settles. */
  const ranking = !minRankDone || (!rankSettled && !livePayload)
  const liveVerdict = livePayload?.cr_verdict ?? null
  const topCard = activeCards[0]

  const setView = (v: View) => {
    params.set('view', v)
    params.delete('mode')
    setParams(params, { replace: true })
  }
  const toggleExpanded = () => {
    if (expanded) params.delete('expanded')
    else params.set('expanded', '1')
    params.delete('mode')
    setParams(params, { replace: true })
  }
  const setMode = (m: Mode) => {
    if (m) params.set('mode', m)
    else params.delete('mode')
    setParams(params, { replace: true })
  }

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const allChecked = activeCards.every((c) => selected.has(c.id))
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(activeCards.map((c) => c.id)))

  const toggleTableRow = (name: string) =>
    setTableSelected((s) => {
      const n = new Set(s)
      n.has(name) ? n.delete(name) : n.add(name)
      return n
    })
  const tableAllChecked =
    activeTableRows.length > 0 && activeTableRows.every((r) => tableSelected.has(r.name))
  const toggleTableAll = () =>
    setTableSelected(tableAllChecked ? new Set() : new Set(activeTableRows.map((r) => r.name)))

  const goShare = () => navigate(routes.collaborate)

  const panelWidth = expanded ? 900 : 520
  const panelLeft = 1440 - 16 - panelWidth // right-aligned inside p-16 body

  /* which state switcher key is active */
  const stateKey: StateKey =
    mode === 'detailed'
      ? 'detailed'
      : mode === 'compare'
        ? 'compare'
        : expanded
          ? view === 'table'
            ? 'xtable'
            : 'xcards'
          : view === 'table'
            ? 'table'
            : allChecked || selected.size > 0
              ? 'editable'
              : 'cards'

  const onState = (k: StateKey) => {
    const p = new URLSearchParams()
    switch (k) {
      case 'cards':
        p.set('view', 'cards')
        setSelected(new Set())
        break
      case 'editable':
        p.set('view', 'cards')
        setSelected(new Set(activeCards.map((c) => c.id)))
        break
      case 'compare':
        p.set('view', 'cards')
        p.set('mode', 'compare')
        break
      case 'detailed':
        p.set('view', 'cards')
        p.set('mode', 'detailed')
        break
      case 'table':
        p.set('view', 'table')
        break
      case 'xcards':
        p.set('view', 'cards')
        p.set('expanded', '1')
        setSelected(new Set(activeCards.map((c) => c.id)))
        break
      case 'xtable':
        p.set('view', 'table')
        p.set('expanded', '1')
        setSelected(new Set(activeCards.map((c) => c.id)))
        break
    }
    setParams(p, { replace: true })
  }

  const detailed = mode === 'detailed'

  return (
    <FigmaFrame>
      {/* Same product page she was on, full colour, with the 10% scrim under the panel. */}
      <ProductBackdrop />
      <DimOverlay onClick={() => navigate(routes.annotations)} />
      {/* Connie floating panel */}
      <div
        className="absolute flex flex-col overflow-clip rounded-[16px] border border-border-subtle bg-bg-secondary p-[37px] shadow-[0px_0px_15px_0px_rgba(0,0,0,0.16)]"
        style={{ left: panelLeft, top: 16, width: panelWidth, height: 868 }}
      >
        {detailed ? (
          <>
            {/* deep-dive header */}
            <div className="flex w-full shrink-0 items-start justify-between pb-[12px]">
              <div className="flex items-start gap-[10px]">
                <button aria-label="Back" onClick={() => setMode(null)} className="pt-[2px] text-fg-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                </button>
                <div className="flex flex-col">
                  <span className="text-[16px] font-semibold leading-[22px] text-fg-primary">{reviewProduct ?? topCard?.title ?? 'UppaBaby Vista V2'}</span>
                  <span className="text-[14px] leading-[20px] text-fg-secondary">Full Review Deep-dive</span>
                </div>
              </div>
              <button aria-label="Close" onClick={() => navigate(routes.insights)} className="text-fg-primary">
                <img src={asset.close} alt="" className="size-[16px]" />
              </button>
            </div>
            <DetailedDeepDive onBack={() => setMode(null)} product={reviewProduct ?? topCard?.title} />
          </>
        ) : (
          <>
            <PanelHeader
              view={view}
              setView={setView}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
              onClose={() => navigate(routes.insights)}
            />

            <div className="flex w-full flex-1 flex-col gap-[20px] overflow-auto pb-[24px] pt-[8px]">
              {ranking ? (
                <RankingShimmer />
              ) : view === 'table' ? (
                <>
                  {expanded ? (
                    <ExpandedVerdictBanner product={topCard} verdict={liveVerdict} />
                  ) : (
                    <InsightCallout verdict={liveVerdict} />
                  )}
                  <SelectionHeader
                    anySelected={tableSelected.size > 0}
                    allChecked={tableAllChecked}
                    toggleAll={toggleTableAll}
                    onShare={goShare}
                  />
                  {expanded ? (
                    <ExpandedTable
                      rows={activeTableRows}
                      selected={tableSelected}
                      onToggle={toggleTableRow}
                    />
                  ) : (
                    <StandardTable
                      rows={activeTableRows}
                      selected={tableSelected}
                      onToggle={toggleTableRow}
                    />
                  )}
                </>
              ) : (
                <>
                  <SelectionHeader
                    anySelected={selected.size > 0}
                    allChecked={allChecked}
                    toggleAll={toggleAll}
                    onShare={goShare}
                  />
                  {expanded
                    ? activeCards.map((c) => (
                        <ExpandedCard
                          key={c.id}
                          card={c}
                          checked={selected.has(c.id)}
                          onCheck={() => toggle(c.id)}
                          showDetails={detailsOpen.has(c.id)}
                          onToggleDetails={() => toggleDetails(c.id)}
                        />
                      ))
                    : activeCards.map((c) => (
                        <CompactCard
                          key={c.id}
                          card={c}
                          checked={selected.has(c.id)}
                          onCheck={() => toggle(c.id)}
                          onReview={() => {
                            setReviewProduct(c.title)
                            setMode('detailed')
                          }}
                          onCompareHover={setHoverCompare}
                        />
                      ))}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Compare Prices popover — frame-level overlay (Figma 1052:4619).
          Shows on Compare mode OR when hovering a card's retailer chip. Prices are static. */}
      {(mode === 'compare' || hoverCompare) && view === 'cards' && !expanded && (
        <ComparePopover onClose={() => setMode(null)} onHover={setHoverCompare} />
      )}

      <NaviRail active="saved" />
    </FigmaFrame>
  )
}
