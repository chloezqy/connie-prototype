import type { ReactNode } from 'react'

/**
 * Amazon's own page chrome — the dark header and nav that sit above every Amazon page.
 *
 * Drawn to match the baked screenshots these pages replace (`insights-bg.png`,
 * `annot-backdrop.png`, `pp-backdrop.png`), down to the "Deliver to Maya / Pittsburgh 15213"
 * and the ochre search button.
 */

/** Height of the header + nav together. Page content starts at this offset below the browser. */
export const AMAZON_CHROME_H = 96

const HEADER_H = 56
const NAV_H = 40

/** The amazon wordmark + smile, drawn white for the dark header. */
function AmazonWordmark() {
  return (
    <span className="relative flex shrink-0 flex-col items-center leading-none">
      <span className="text-[22px] font-bold lowercase tracking-[-1px] text-white">amazon</span>
      <svg width="52" height="8" viewBox="0 0 52 8" className="-mt-[3px]" aria-hidden>
        <path d="M2 2c11 6 37 6 48 0" stroke="#FF9900" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M45 0.8l5.6 1.1-2.6 3.6z" fill="#FF9900" />
      </svg>
      <span className="absolute -right-[6px] top-[3px] text-[9px] font-semibold text-[#ff9900]">prime</span>
    </span>
  )
}

function HeaderCell({ top, bottom }: { top: string; bottom: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col justify-center px-[8px] leading-none">
      <span className="text-[11px] text-[#cccccc]">{top}</span>
      <span className="text-[13px] font-bold text-white">{bottom}</span>
    </div>
  )
}

export function AmazonHeader({ query }: { query: string }) {
  return (
    <div
      className="absolute left-0 flex w-[1440px] items-center gap-[6px] bg-[#131921] px-[14px]"
      style={{ top: 0, height: HEADER_H }}
    >
      <AmazonWordmark />

      {/* Deliver to */}
      <div className="ml-[10px] flex shrink-0 items-end gap-[4px]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" className="mb-[2px]" aria-hidden>
          <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
        </svg>
        <HeaderCell top="Deliver to Maya" bottom="Pittsburgh 15213" />
      </div>

      {/* Search */}
      <div className="ml-[8px] flex h-[38px] min-w-0 flex-1 items-stretch overflow-hidden rounded-[6px]">
        <div className="flex shrink-0 items-center gap-[4px] bg-[#e6e6e6] px-[10px] text-[12px] text-[#555]">
          All
          <span className="text-[8px]">▼</span>
        </div>
        <div className="flex min-w-0 flex-1 items-center bg-white px-[10px]">
          <span className="truncate text-[14px] text-[#111]">{query}</span>
        </div>
        <div className="flex w-[44px] shrink-0 items-center justify-center bg-[#febd69]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#131921" strokeWidth="2.5" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Right cluster */}
      <div className="ml-[8px] flex shrink-0 items-center gap-[4px]">
        <div className="flex items-center gap-[4px] px-[6px]">
          <span className="text-[15px]">🇺🇸</span>
          <span className="text-[12px] font-bold text-white">EN</span>
          <span className="text-[8px] text-[#ccc]">▼</span>
        </div>
        <HeaderCell top="Hello, Maya" bottom={<>Account &amp; Lists ▾</>} />
        <HeaderCell top="Returns" bottom="& Orders" />
        <div className="flex shrink-0 items-end gap-[2px] px-[8px]">
          <div className="relative">
            <svg width="30" height="24" viewBox="0 0 30 24" fill="#fff" aria-hidden>
              <path d="M2 3h4l3.2 12.2h13.4l2.6-8.6H9" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="11" cy="20" r="2" />
              <circle cx="22" cy="20" r="2" />
            </svg>
            <span className="absolute left-[9px] top-[-4px] text-[13px] font-bold text-[#f08804]">0</span>
          </div>
          <span className="mb-[2px] text-[13px] font-bold text-white">Cart</span>
        </div>
      </div>
    </div>
  )
}

const NAV_LINKS = [
  'Health AI',
  '3 Hour Delivery',
  'Amazon Haul',
  'Whole Foods',
  'Medical Care',
  'Prime Video',
  'Groceries',
  'Prime',
  'TV & Video',
  'Best Sellers',
  'Amazon Basics',
  'Subscribe & Save',
]

export function AmazonNav() {
  return (
    <div
      className="absolute left-0 flex w-[1440px] items-center gap-[16px] bg-[#232f3e] px-[14px] text-[13px] text-white"
      style={{ top: HEADER_H, height: NAV_H }}
    >
      <div className="flex shrink-0 items-center gap-[6px] font-bold">
        <svg width="16" height="12" viewBox="0 0 16 12" stroke="#fff" strokeWidth="1.8" aria-hidden>
          <path d="M1 1h14M1 6h14M1 11h14" strokeLinecap="round" />
        </svg>
        All
      </div>
      <div className="flex shrink-0 items-center rounded-[3px] bg-white px-[8px] py-[2px]">
        <span className="text-[12px] font-bold italic text-[#232f3e]">alexa</span>
        <span className="ml-[3px] text-[11px] text-[#232f3e]">for shopping</span>
      </div>
      {NAV_LINKS.map((l) => (
        <span key={l} className="shrink-0 whitespace-nowrap">
          {l}
        </span>
      ))}
    </div>
  )
}

/** Header + nav together, positioned below the browser chrome. */
export function AmazonChrome({ query, top }: { query: string; top: number }) {
  return (
    <div className="absolute left-0 w-[1440px]" style={{ top, height: AMAZON_CHROME_H }}>
      <AmazonHeader query={query} />
      <AmazonNav />
    </div>
  )
}
