import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { RetailBackdrop } from '@/components/connie/RetailBackdrop'
import { routes } from '@/app/routes'
import { callConnie } from '@/api/connieClient'
import {
  isDecisionSupport,
  isProductInsights,
  type DecisionSupportPayload,
  type ProductInsightsPayload,
} from '@/types/connie-contract'
import { usePreferences, preferencesToPriorities } from '@/store/usePreferences'
import { NaviRail } from '@/components/connie/NaviRail'

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
function SelectionHeader({
  expanded,
  allChecked,
  toggleAll,
  onShare,
}: {
  expanded: boolean
  allChecked: boolean
  toggleAll: () => void
  onShare: () => void
}) {
  return (
    <div className="flex w-full shrink-0 items-center gap-[8px] rounded-[8px] bg-bg-tertiary pr-[8px]">
      <button aria-label="Select all" onClick={toggleAll} className="flex size-[24px] items-center justify-center">
        <CheckBox checked={allChecked} />
      </button>
      <div className="flex flex-1 flex-col">
        <p className="text-[14px] leading-[20px] text-fg-primary">Select All</p>
      </div>
      {expanded ? (
        <div className="flex items-start gap-[16px]">
          <button aria-label="Share" onClick={onShare} className="flex items-center gap-[6px]">
            <img src={asset.share} alt="" className="h-[15.75px] w-[12px]" />
            <span className="text-[14px] leading-[20px] text-fg-secondary">SHARE</span>
          </button>
          <button className="flex items-center gap-[6px]">
            <img src={asset.trash} alt="" className="h-[13.5px] w-[12px]" />
            <span className="text-[14px] leading-[20px] text-fg-secondary">DELETE</span>
          </button>
        </div>
      ) : (
        <>
          <button aria-label="Share" onClick={onShare} className="size-[18px]">
            <img src={asset.share} alt="" className="size-full" />
          </button>
          <button aria-label="Delete" className="flex h-[26px] w-[25px] items-center justify-center rounded-full">
            <img src={asset.trash} alt="" className="h-[13.5px] w-[14px]" />
          </button>
        </>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- Card data */
type Chip = { img: string; label: string }
type Card = {
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

const cards: Card[] = [
  {
    id: 'vista',
    img: asset.prodVista,
    rank: '#1 BEST MATCH',
    rankBrand: true,
    title: 'UppaBaby Vista V2',
    price: '$999.00',
    at: 'AT AMAZON',
    why: 'Matches your high-priority for all-terrain stability. The dual-action suspension system is rated top-tier for gravel and uneven paths.',
    whyLong:
      'Matches your high-priority for all-terrain stability. The dual-action suspension system is rated top-tier for gravel and uneven paths. High durability ensures long-term value.',
    chips: [
      { img: asset.avCr, label: 'CR 2024 Lab Results' },
      { img: asset.avReddit, label: 'Reddit Community' },
    ],
    primaryBtn: true,
  },
  {
    id: 'city',
    img: asset.prodCity,
    rank: '#2 RUNNER UP',
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
    id: 'lite3',
    img: asset.prodCity,
    rank: '#3 BUDGET PICK',
    rankBrand: false,
    title: 'GB Pockit Lite 3',
    price: '$199.00',
    at: 'AT TARGET',
    why: 'The lightest option on your list — great for travel, though CR flags it as not recommended for daily rough-terrain use.',
    whyLong:
      'The lightest option on your list — great for travel, though CR flags it as not recommended for daily rough-terrain use. Best kept as a secondary stroller.',
    chips: [{ img: asset.avReddit, label: 'Travel Thread' }],
    primaryBtn: false,
  },
  {
    id: 'mockingbird',
    img: asset.prodVista,
    rank: '#4 VALUE',
    rankBrand: false,
    title: 'Mockingbird Single-to-Double',
    price: '$650.00',
    at: 'AT MOCKINGBIRD',
    why: 'Strong all-around value with an expandable frame. Parents praise the ride quality for the price.',
    whyLong:
      'Strong all-around value with an expandable frame. Parents praise the ride quality for the price, and it converts to a double later.',
    chips: [
      { img: asset.avCr, label: 'CR 2024 Lab Results' },
      { img: asset.avReddit, label: 'Reddit Community' },
    ],
    primaryBtn: false,
  },
  {
    id: 'cruz',
    img: asset.prodVista,
    rank: '#5 COMPACT',
    rankBrand: false,
    title: 'UppaBaby Cruz V2',
    price: '$699.00',
    at: 'AT AMAZON',
    why: 'A lighter, single-seat sibling to the Vista with the same trusted build — a good fit for smaller trunks.',
    whyLong:
      'A lighter, single-seat sibling to the Vista with the same trusted build — a good fit for smaller trunks and city living.',
    chips: [{ img: asset.avCr, label: 'CR 2024 Lab Results' }],
    primaryBtn: false,
  },
]

/* ----- map a live decision_support payload -> the screen's Card[] ----- */
function productImage(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('city mini')) return asset.prodCity
  return asset.prodVista // only two product photos exist; default to the Vista shot
}

function productsToCards(payload: DecisionSupportPayload): Card[] {
  return payload.products.map((p) => {
    const badges = p.evidence_badges ?? []
    const why =
      p.recommendation_rationale ??
      `${p.specs.fold} fold · ${p.specs.weight} · ${p.specs.terrain}`
    return {
      id: p.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `rank-${p.rank}`,
      img: productImage(p.product_name),
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
function CompactCard({
  card,
  checked,
  onCheck,
  onReview,
  onCompareHover,
  children,
}: {
  card: Card
  checked: boolean
  onCheck: () => void
  onReview?: () => void
  onCompareHover?: (hovering: boolean) => void
  children?: ReactNode
}) {
  return (
    <div className="relative flex w-full items-start gap-[8px]">
      <div className="flex w-[24px] shrink-0 flex-col items-center pt-[47px]">
        <CheckBox checked={checked} onClick={onCheck} />
      </div>
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
            <div className="flex items-center gap-[9px]">
              <span className="text-[14px] leading-[20px] text-fg-primary">{card.price}</span>
              <div
                className="flex cursor-pointer rounded-[4px] bg-border-subtle px-[8px] py-[4px]"
                onMouseEnter={() => onCompareHover?.(true)}
                onMouseLeave={() => onCompareHover?.(false)}
              >
                <span className="whitespace-nowrap text-[14px] leading-[20px] text-fg-secondary">{card.at}</span>
              </div>
            </div>
          </div>
        </div>

        <WhyThisFits text={card.why} />

        <div className="flex flex-wrap gap-[8px]">
          {card.chips.map((c) => (
            <SourceChip key={c.label} chip={c} />
          ))}
        </div>

        <button
          onClick={onReview}
          className={`w-full rounded-[8px] py-[10px] text-center text-[14px] leading-[20px] ${
            card.primaryBtn
              ? 'bg-brand text-fg-inverse'
              : 'border border-border-subtle bg-border-subtle text-fg-brand'
          }`}
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
type Metric = { title: string; text: string; icon: string; dim?: boolean }
const metrics: Metric[] = [
  {
    title: 'Top Rated',
    text: 'No bumps in the road here. CR and parents agree: this one earns its reputation.',
    icon: `${I}toprated.svg`,
  },
  {
    title: 'City Certified',
    text: 'Built for the urban jungle. Handles sidewalks and curbs effortlessly and folds compactly.',
    icon: `${I}city.svg`,
  },
  {
    title: 'Built to Last',
    text: 'High-quality fabrics and wheels that make resale easy and hand-me-downs an option.',
    icon: `${I}sketch.svg`,
    dim: true,
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
    <div className="flex items-center gap-[16px] overflow-clip rounded-[8px] border border-border-subtle bg-bg-primary p-[17px]">
      <div
        className={`flex size-[45px] shrink-0 items-center justify-center rounded-[22.5px] ${m.dim ? 'opacity-80' : ''}`}
        style={{ background: 'linear-gradient(180deg, #77798d 0%, #b1b3b9 100%)' }}
      >
        <img src={m.icon} alt="" className="size-[24px]" style={{ filter: 'brightness(0) invert(1)' }} />
      </div>
      <div className="flex flex-1 flex-col gap-[4px]">
        <div className="flex items-center gap-[8px]">
          <span className="whitespace-nowrap text-[14px] leading-[20px] text-fg-primary">{m.title}</span>
          <MetricSources />
        </div>
        <p className="text-[14px] leading-[20px] text-fg-secondary">{m.text}</p>
      </div>
      <img src={`${I}caret.svg`} alt="" className="h-[7.4px] w-[12px] -rotate-90 shrink-0" />
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
              <p className="text-[14px] leading-[20px] text-fg-primary">{card.title}</p>
              <span className="text-[14px] leading-[20px] text-fg-primary">{card.price}</span>
              <div className="flex w-fit rounded-[8px] bg-border-subtle px-[10px] py-[5px]">
                <span className="whitespace-nowrap text-[14px] leading-[20px] text-fg-secondary">{card.at}</span>
              </div>
            </div>
            <WhyThisFits text={card.whyLong} pad={17} />
            <div className="flex flex-wrap gap-[8px]">
              {card.chips.map((c) => (
                <SourceChip key={c.label} chip={c} />
              ))}
            </div>
          </div>
        </div>

        {/* metrics toggle row */}
        <div className="flex items-center justify-between">
          <span className="whitespace-nowrap text-[14px] leading-[20px] text-fg-secondary">LAB &amp; USER METRICS</span>
          <button onClick={onToggleDetails} className="flex items-center gap-[6px]">
            <span className="whitespace-nowrap text-[14px] leading-[20px] text-fg-secondary">
              {showDetails ? 'Hide Details' : 'Show Details'}
            </span>
            <img src={`${I}caret.svg`} alt="" className={`h-[5.55px] w-[9px] ${showDetails ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showDetails && (
          <div className="grid grid-cols-2 gap-[12px]">
            {metrics.map((m) => (
              <MetricCard key={m.title} m={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------------- Detailed deep-dive */
type DetailRow = { icon: string; iconSize: number; title: string; subtitle: string }
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
function insightsToDetailRows(payload: ProductInsightsPayload): DetailRow[] {
  return payload.insights.map((ins) => {
    const meta = DEEP_DIVE_ICON[ins.category] ?? { icon: `${I}toprated.svg`, size: 20 }
    return { icon: meta.icon, iconSize: meta.size, title: ins.label, subtitle: ins.summary }
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
          <p className="text-[14px] leading-[20px] text-[#242424]">
            CR's lab testers and community threads consistently rank this near the top for {row.title.toLowerCase()}.
          </p>
          <div className="flex w-fit items-center gap-[4px] rounded-full border border-border-subtle bg-white py-[4px] pl-[8px] pr-[12px]">
            <img src={`${I}av7.png`} alt="" className="size-[16px] rounded-full border-[0.5px] border-white object-cover" />
            <span className="whitespace-nowrap text-[11px] leading-[16px] text-[#222]">Consumer Reports</span>
            <img src={`${I}arrowupright.svg`} alt="" className="size-[12px]" />
          </div>
        </div>
      )}
    </div>
  )
}

function DetailedDeepDive({ onBack, product }: { onBack: () => void; product?: string | null }) {
  // Fetch the full review (product_insights) for the reviewed product, once.
  const [liveRows, setLiveRows] = useState<DetailRow[] | null>(null)
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current || !product) return
    didFetch.current = true
    callConnie({ message: `What are the key insights on the ${product}?` })
      .then((r) => {
        if (isProductInsights(r) && r.product_insights.insights.length > 0) {
          setLiveRows(insightsToDetailRows(r.product_insights))
        }
      })
      .catch(() => {
        /* keep baked rows on error */
      })
  }, [product])
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
  const [showDetails, setShowDetails] = useState(true)
  const [hoverCompare, setHoverCompare] = useState(false)

  // Fetch the live ranking once (guard against StrictMode double-invoke). Until it returns,
  // the baked data shows so the screen never breaks; live data swaps in when it arrives.
  const [livePayload, setLivePayload] = useState<DecisionSupportPayload | null>(null)
  const [reviewProduct, setReviewProduct] = useState<string | null>(null)
  const preferences = usePreferences((s) => s.preferences)
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    callConnie({
      message: 'Rank these strollers for me',
      priorities: preferencesToPriorities(preferences) || undefined,
    })
      .then((r) => {
        if (isDecisionSupport(r) && r.decision_support.products.length > 0) {
          setLivePayload(r.decision_support)
        }
      })
      .catch(() => {
        /* keep baked data on error */
      })
  }, [])
  const activeCards = livePayload ? productsToCards(livePayload) : cards
  const activeTableRows = livePayload ? productsToTableRows(livePayload) : tableRows
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
      <RetailBackdrop />
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
                  <span className="text-[16px] font-semibold leading-[22px] text-fg-primary">{reviewProduct ?? 'UppaBaby Vista V2'}</span>
                  <span className="text-[14px] leading-[20px] text-fg-secondary">Full Review Deep-dive</span>
                </div>
              </div>
              <button aria-label="Close" onClick={() => navigate(routes.insights)} className="text-fg-primary">
                <img src={asset.close} alt="" className="size-[16px]" />
              </button>
            </div>
            <DetailedDeepDive onBack={() => setMode(null)} product={reviewProduct} />
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
              {view === 'table' ? (
                <>
                  {expanded ? (
                    <ExpandedVerdictBanner product={topCard} verdict={liveVerdict} />
                  ) : (
                    <InsightCallout verdict={liveVerdict} />
                  )}
                  <SelectionHeader
                    expanded={expanded}
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
                    expanded={expanded}
                    allChecked={allChecked}
                    toggleAll={toggleAll}
                    onShare={goShare}
                  />
                  {expanded
                    ? activeCards.map((c, i) => (
                        <ExpandedCard
                          key={c.id}
                          card={c}
                          checked={selected.has(c.id)}
                          onCheck={() => toggle(c.id)}
                          showDetails={i === 0 ? showDetails : false}
                          onToggleDetails={() => setShowDetails((s) => !s)}
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
