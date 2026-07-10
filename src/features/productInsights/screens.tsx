import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { routes } from '@/app/routes'
import { callConnie } from '@/api/connieClient'
import { isProductInsights, type ProductInsightsPayload } from '@/types/connie-contract'
import { usePreferences, preferencesToPriorities } from '@/store/usePreferences'
import { communityPosts, type CommunitySource } from '@/mocks/communityPosts'

/** The product this "page" is about — drives the live product_insights request. */
const LIVE_PRODUCT = 'UPPAbaby Vista V2'

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

/** Avatars for the illustrative community posts. */
const COMMUNITY_AVATAR: Record<CommunitySource, string> = {
  Instagram: `${A}insta.png`,
  Reddit: av5,
}

/**
 * Build rows from the live product_insights payload, and append ILLUSTRATIVE community posts
 * (Instagram/Reddit) for the sources the shopper connected in onboarding. Real CR + web evidence
 * always comes first; community posts are authored samples (see mocks/communityPosts.ts).
 */
function insightsToRows(payload: ProductInsightsPayload, connectedSources: string[]): RowData[] {
  return payload.insights.map((ins) => {
    const meta = CATEGORY_ICON[ins.category] ?? { icon: `${A}toprated.svg`, size: 20 }
    // Drop any youtube evidence — not a real retrieval source, so never display it.
    const evidence = (ins.evidence ?? []).filter((e) => e.source_type !== 'youtube')
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
function Chip({ img, label, pencil = true }: { img?: string; label: string; pencil?: boolean }) {
  return (
    <div className="flex h-[34px] items-center gap-[6px] rounded-full border-[0.5px] border-border-strong bg-white py-[6px] pl-[8px] pr-[16px]">
      {img && <img src={img} alt="" className="size-[20px] rounded-full border-[0.5px] border-white object-cover" />}
      <span className="whitespace-nowrap text-[14px] leading-[20px] text-[#21211f]">{label}</span>
      {pencil && <img src={`${A}pencil.svg`} alt="" className="size-[16px]" />}
    </div>
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
}: {
  onClose: () => void
  preferences: string[]
  sources: string[]
}) {
  return (
    <div
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
              {sources.map((s) => (
                <Chip key={s} img={COMMUNITY_ICON[s]} label={s} />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start pl-[94px]">
            <Chip img={av7} label="Consumer Reports" pencil={false} />
          </div>
        </div>
        <div className="flex items-center gap-[8px]">
          <div className="flex items-center gap-[8px]">
            <img src={`${A}sliders.svg`} alt="" className="size-[20px]" />
            <span className="text-[16px] leading-[24px] text-fg-primary">Preferences:</span>
          </div>
          <div className="flex flex-wrap items-center gap-[8px]">
            {preferences.map((p) => (
              <Chip key={p} label={p} />
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

/* --------------------------------------------------- Recommended panel */
function RecommendedPanel({
  initialExpanded,
  initialTooltip,
  onClose,
  rows,
  preferences,
  sources,
}: {
  initialExpanded: number | null
  initialTooltip: boolean
  onClose: () => void
  rows: RowData[]
  preferences: string[]
  sources: string[]
}) {
  const [openRow, setOpenRow] = useState<number | null>(initialExpanded)
  const [tooltip, setTooltip] = useState(initialTooltip)

  return (
    <>
      <div
        className="absolute flex flex-col overflow-hidden rounded-[16px] border-[0.5px] border-[#c5c5c5] bg-bg-secondary shadow-[0px_0px_15px_0px_rgba(5,5,0,0.16)]"
        style={{ left: 736, top: 287, width: 540, height: 536 }}
      >
        {/* header */}
        <div className="shrink-0 pl-[36px] pr-[56px] pt-[28px]">
          <div className="flex h-[40px] w-full items-center justify-between px-[8px]">
            <div className="flex items-center gap-[12px]">
              <div className="flex items-center gap-[10px]">
                <img src={`${A}star.svg`} alt="" className="size-[20px]" />
                <span className="whitespace-nowrap text-[18px] font-semibold leading-[22px] tracking-[-0.25px] text-fg-primary">
                  RECOMMENDED
                </span>
              </div>
              <button onClick={() => setTooltip((t) => !t)} aria-label="Based on" className="size-[24px]">
                <img src={`${A}info.svg`} alt="" className="size-full" />
              </button>
            </div>
            <button className="flex h-[40px] w-[104px] items-center justify-center gap-[4px] rounded-[24px] border border-border-subtle bg-white">
              <span className="text-[16px] font-semibold leading-[24px] tracking-[-0.25px] text-fg-secondary">Save</span>
              <img src={`${A}save.svg`} alt="" className="h-[12px] w-[14px]" />
            </button>
          </div>
        </div>

        {/* scrollable body */}
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pl-[36px] pr-[56px] pt-[16px]">
          <div className="flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[24px]">
              {/* DID YOU KNOW */}
              <div className="relative flex w-full flex-col gap-[4px] overflow-hidden rounded-[8px] bg-gradient-to-r from-[rgba(217,237,226,0.3)] to-[rgba(251,245,221,0.3)] px-[24px] py-[20px]">
                <div className="flex w-full items-center gap-[8px]">
                  <img src={`${A}shootingstar.svg`} alt="" className="size-[20px]" />
                  <span className="text-[14px] font-semibold leading-[20px] text-[#282923]">DID YOU KNOW?</span>
                </div>
                <p className="w-[330px] text-[14px] leading-[20px] text-[#282923]">
                  Oscar-winning actress Anne Hathaway has been spotted pushing this stroller through Central Park.
                </p>
                <img
                  src={`${A}didyouknow.png`}
                  alt=""
                  className="absolute left-[359px] top-[16px] size-[88px] rounded-[8px] object-cover opacity-15"
                />
              </div>

              {/* rows */}
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
            </div>

            {/* heads up */}
            <div className="py-[8px]">
              <div className="flex w-full items-start gap-[8px] bg-[rgba(255,240,244,0.7)] pb-[20px] pl-[16px] pr-[20px] pt-[16px]">
                <img src={`${A}warning.svg`} alt="" className="h-[23.625px] w-[20px] shrink-0" />
                <div className="flex flex-1 flex-col gap-[4px]">
                  <p className="text-[16px] font-semibold leading-[24px] text-fg-primary">Heads up on comfort</p>
                  <p className="text-[14px] leading-[20px] text-fg-primary">
                    Great pick overall — just note a few users noted that the seat was less comfortable than expected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="shrink-0 pl-[36px] pr-[56px] pb-[24px]">
          <div className="flex w-full items-center justify-center gap-[12px] border-t border-border-subtle py-[12px]">
            <span className="whitespace-nowrap text-[14px] font-semibold leading-[20px] text-[#585858]">
              LIKE THIS REC?
            </span>
            <div className="flex gap-[8px]">
              <button className="flex size-[40px] items-center justify-center rounded-full border border-border-subtle bg-white">
                <img src={`${A}thumbup.svg`} alt="Like" className="h-[16.667px] w-[17.5px]" />
              </button>
              <button className="flex size-[40px] items-center justify-center rounded-full border border-border-subtle bg-white">
                <img src={`${A}thumbdown.svg`} alt="Dislike" className="h-[16.667px] w-[17.5px]" />
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
        <BasedOnPopover onClose={() => setTooltip(false)} preferences={preferences} sources={sources} />
      )}
    </>
  )
}

/* ------------------------------------------------- Not Recommended panel */
type NotRecRow = { title: string; text: string; dim: boolean; sources: string[] }
const notRecRows: NotRecRow[] = [
  {
    title: 'Low Rated',
    text: 'No bumps in the road here. CR and parents agree: this one earns its reputation.',
    dim: false,
    sources: [av5, av7],
  },
  {
    title: 'Poor Maneuverability',
    text: "Not built for the urban jungle. Struggles with sidewalks and curbs, and doesn't fold well.",
    dim: false,
    sources: [av18, av7],
  },
  {
    title: 'Falls Apart Fast',
    text: 'Cheap fabrics and wobbly wheels that make resale and hand-me-downs difficult.',
    dim: false,
    sources: [av5, av7],
  },
  {
    title: 'Bumpy Ride',
    text: "Suspension doesn't do much to soften bumps or uneven pavement.",
    dim: true,
    sources: [av5, av7],
  },
  {
    title: 'Difficult to Fold',
    text: 'Takes both hands and a few extra steps to close properly.',
    dim: true,
    sources: [av18, av7],
  },
]

function NotRecommendedPanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute flex flex-col gap-[24px] overflow-hidden rounded-[16px] border-[0.5px] border-[#c5c5c5] bg-white pb-[36px] pl-[36px] pr-[56px] pt-[36px] shadow-[4px_4px_10px_0px_rgba(0,0,0,0.25)]"
      style={{ left: 700, top: 170, width: 596, height: 585 }}
    >
      {/* header */}
      <div className="flex h-[40px] w-[504px] shrink-0 items-center justify-between">
        <div className="flex items-center gap-[16px]">
          <div className="flex items-center gap-[9px]">
            <img src={`${A}xcircle.svg`} alt="" className="size-[24px]" />
            <span className="whitespace-nowrap text-[20px] font-semibold leading-[24px] tracking-[-0.5px] text-fg-primary">
              NOT RECOMMENDED
            </span>
          </div>
          <img src={`${A}info.svg`} alt="" className="size-[24px]" />
        </div>
        <button className="flex w-[100px] items-center justify-between rounded-[6px] border-[0.5px] border-[#8d8d8d] bg-white px-[16px] py-[8px]">
          <span className="whitespace-nowrap text-[16px] leading-[22px] tracking-[0.8px] text-fg-primary">Save</span>
          <img src={`${A}save.svg`} alt="" className="h-[15px] w-[18px]" />
        </button>
      </div>

      {/* rows */}
      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-[16px] overflow-y-auto pt-[8px]">
        {notRecRows.map((r) => (
          <div
            key={r.title}
            className="relative flex w-[504px] shrink-0 items-center justify-between overflow-hidden rounded-[8px] bg-bg-secondary py-[20px] pl-[16px] pr-[20px]"
          >
            <div className="relative flex w-[420px] items-center gap-[20px]">
              <div className="size-[45px] shrink-0 rounded-full bg-gradient-to-b from-[#77798d] to-[#b1b3b9]" />
              <div className="flex flex-1 flex-col gap-[4px]">
                <p
                  className={`text-[18px] font-semibold leading-[22px] tracking-[-0.25px] ${
                    r.dim ? 'text-fg-secondary' : 'text-fg-primary'
                  }`}
                >
                  {r.title}
                </p>
                <p className="text-[16px] leading-[24px] text-fg-primary">{r.text}</p>
              </div>
              <Sources imgs={r.sources} size={20} className="absolute left-[300px] top-[-3px]" />
            </div>
            <img src={`${A}caret-nr.svg`} alt="" className="size-[20px] shrink-0" />
          </div>
        ))}
      </div>

      <button onClick={onClose} className="absolute left-[562.5px] top-[23.5px] size-[20px]" aria-label="Close">
        <img src={`${A}x.svg`} alt="" className="size-full" />
      </button>
    </div>
  )
}

/* -------------------------------------------------------- Product badges */
function ProductBadges({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <button
        onClick={onOpen}
        className="absolute flex items-center justify-center rounded-full bg-rating-excellent"
        style={{ left: 796, top: 101, width: 45, height: 45 }}
        aria-label="Open Connie insights"
      >
        <img src={`${A}chatblob.png`} alt="" className="size-[28px] object-contain" />
      </button>
      <div
        className="absolute flex items-center justify-center rounded-full bg-[#9d9d9d]"
        style={{ left: 1184, top: 101, width: 45, height: 45 }}
      >
        <img src={`${A}chatcircle.svg`} alt="" className="size-[28px]" />
      </div>
      <div
        className="absolute flex items-center justify-center rounded-full bg-[#9d9d9d]"
        style={{ left: 387, top: 100, width: 45, height: 45 }}
      >
        <img src={`${A}chatcircle.svg`} alt="" className="size-[28px]" />
      </div>
    </>
  )
}

/* -------------------------------------------------------------- Navi bar */
function NaviBar({ onChat }: { onChat: () => void }) {
  const iconBtn = (src: string, label: string, onClick?: () => void) => (
    <button onClick={onClick} aria-label={label} className="size-[40px]">
      <img src={src} alt="" className="size-full" />
    </button>
  )
  return (
    <div
      className="absolute flex items-center rounded-[8px] border-[0.5px] border-border-subtle bg-white p-[10px] drop-shadow-[0px_0px_7.5px_rgba(5,5,0,0.16)]"
      style={{ left: 51, top: 523 }}
    >
      <div className="flex flex-col items-start gap-[16px]">
        <div className="flex flex-col items-start gap-[16px]">
          {iconBtn(`${A}navi-chat.svg`, 'Chat', onChat)}
          {iconBtn(`${A}navi-heart.svg`, 'Saved')}
        </div>
        <div className="h-[0.5px] w-full bg-border-subtle" />
        <div className="flex flex-col items-start gap-[16px]">
          {iconBtn(`${A}navi-gear.svg`, 'Settings')}
          {iconBtn(`${A}navi-question.svg`, 'Help')}
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------- CR launcher */
/** Green launcher matching the Product Insights frame (1052:2542) — bg brand + white "C". */
function InsightsLauncher() {
  return (
    <div className="absolute" style={{ left: 52, top: 792 }}>
      <div className="relative size-[60px] rounded-[8px] bg-brand">
        <span className="absolute left-[18px] top-[7px] text-[32px] font-semibold leading-[36px] tracking-[-1.5px] text-white">
          C
        </span>
        <span className="absolute left-[51px] top-[-4px] size-[14px] rounded-full border-2 border-white bg-rating-excellent" />
      </div>
    </div>
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
  const variant = (params.get('v') as Variant) || 'recommended'
  const setVariant = (v: Variant) => setParams({ v }, { replace: true })

  const showNavi = variant !== 'collapsed'
  const showRecommended = variant === 'recommended' || variant === 'expanded' || variant === 'tooltip'

  // Fetch live product_insights on load. Until it returns (or if the backend is unreachable),
  // the baked rows show so the screen never breaks; live data swaps in when it arrives.
  const [liveRows, setLiveRows] = useState<RowData[] | null>(null)
  const preferences = usePreferences((s) => s.preferences)
  const sources = usePreferences((s) => s.sources)
  const didFetch = useRef(false)
  useEffect(() => {
    // Fire exactly once — guard against React 18 StrictMode double-invoking the effect,
    // which would launch two heavy product_insights calls at once and trip the Vertex quota.
    if (didFetch.current) return
    didFetch.current = true
    callConnie({
      message: `What are the key insights on the ${LIVE_PRODUCT}?`,
      priorities: preferencesToPriorities(preferences) || undefined,
    })
      .then((r) => {
        if (isProductInsights(r) && r.product_insights.insights.length > 0) {
          setLiveRows(insightsToRows(r.product_insights, sources))
        }
      })
      .catch(() => {
        /* keep baked rows on error */
      })
  }, [])
  const panelRows = liveRows ?? rows

  const frame: ReactNode = (
    <FigmaFrame backdrop={bg} backdropOpacity={0.7}>
      <ProductBadges onOpen={() => setVariant('recommended')} />

      {showRecommended && (
        <RecommendedPanel
          key={variant}
          initialExpanded={variant === 'expanded' ? 0 : null}
          initialTooltip={variant === 'tooltip'}
          onClose={() => setVariant('collapsed')}
          rows={panelRows}
          preferences={preferences}
          sources={sources}
        />
      )}

      {variant === 'notrec' && <NotRecommendedPanel onClose={() => setVariant('collapsed')} />}

      {showNavi && <NaviBar onChat={() => setVariant('recommended')} />}

      <InsightsLauncher />

      <StateSwitcher current={variant} onSelect={setVariant} />
    </FigmaFrame>
  )

  return frame
}
