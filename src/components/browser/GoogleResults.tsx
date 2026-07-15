import { CHROME_H, GoogleFavicon } from './BrowserChrome'

/**
 * Google search results for "best stroller 2026". The first result is the Amazon link the
 * shopper clicks through to — everything else is scenery.
 */

function SmallWordmark() {
  const letters: [string, string][] = [
    ['G', '#4285F4'],
    ['o', '#EA4335'],
    ['o', '#FBBC05'],
    ['g', '#4285F4'],
    ['l', '#34A853'],
    ['e', '#EA4335'],
  ]
  return (
    <p className="font-sans text-[30px] font-medium leading-none" style={{ letterSpacing: '-1px' }}>
      {letters.map(([ch, c], i) => (
        <span key={i} style={{ color: c }}>
          {ch}
        </span>
      ))}
    </p>
  )
}

/** Circular site favicon for a result — a coloured chip with the site's initial. */
function SiteFavicon({ glyph, bg, fg = '#fff' }: { glyph: string; bg: string; fg?: string }) {
  return (
    <span
      className="flex size-[26px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold leading-none"
      style={{ background: bg, color: fg }}
    >
      {glyph}
    </span>
  )
}

type Result = {
  site: string
  path: string
  glyph: string
  bg: string
  fg?: string
  title: string
  snippet: string
}

/** Results 2+ — scenery behind the story. The Amazon result is rendered separately. */
const OTHER_RESULTS: Result[] = [
  {
    site: 'Consumer Reports',
    path: 'https://www.consumerreports.org › babies-kids › strollers',
    glyph: 'CR',
    bg: '#00803e',
    title: 'Best Strollers of 2026 - Consumer Reports',
    snippet:
      'We tested 42 strollers for maneuverability, ease of use, and safety. See which models our lab rated Excellent, and which ones to skip.',
  },
  {
    site: 'BabyList',
    path: 'https://www.babylist.com › hello-baby › best-strollers',
    glyph: 'B',
    bg: '#f06292',
    title: '12 Best Strollers of 2026, Tested by Real Parents',
    snippet:
      'From lightweight travel picks to all-terrain workhorses — our parent testers put a year of daily use on every stroller on this list.',
  },
  {
    site: 'Reddit',
    path: 'https://www.reddit.com › r/BeyondTheBump › comments',
    glyph: 'r',
    bg: '#ff4500',
    title: 'What stroller did you actually end up loving? : r/BeyondTheBump',
    snippet:
      '148 votes, 302 comments. First-time parent here and completely lost. Everyone keeps recommending different things...',
  },
]

function NavTab({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={
        active
          ? 'border-b-[3px] border-[#1a73e8] px-[12px] pb-[11px] text-[13px] font-medium text-[#1a73e8]'
          : 'px-[12px] pb-[11px] text-[13px] text-[#5f6368]'
      }
    >
      {label}
    </span>
  )
}

export function GoogleResults({ query, onAmazon }: { query: string; onAmazon: () => void }) {
  return (
    <div
      className="absolute left-0 w-[1440px] overflow-hidden bg-white"
      style={{ top: CHROME_H, height: 900 - CHROME_H }}
    >
      {/* ---- Google header ---- */}
      <div className="w-full border-b border-[#ebebeb] bg-white">
        <div className="flex items-center gap-[30px] px-[30px] pb-[6px] pt-[20px]">
          <SmallWordmark />
          <div className="flex h-[44px] w-[620px] items-center gap-[14px] rounded-full border border-[#dfe1e5] px-[20px] shadow-[0_1px_6px_rgba(32,33,36,0.12)]">
            <span className="flex-1 text-[16px] text-[#202124]">{query}</span>
            <span className="text-[18px] text-[#4285F4]">🎤</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="ml-auto flex items-center gap-[16px] text-[#5f6368]">
            <span className="text-[18px]">▦</span>
            <span className="flex size-[30px] items-center justify-center rounded-full bg-[#a0c3ff] text-[13px] font-medium text-[#1a3d7c]">
              M
            </span>
          </div>
        </div>
        <div className="flex items-center pl-[150px]">
          <NavTab label="All" active />
          <NavTab label="Shopping" />
          <NavTab label="Images" />
          <NavTab label="Videos" />
          <NavTab label="News" />
          <NavTab label="Forums" />
        </div>
      </div>

      {/* ---- Results ---- */}
      <div className="px-[150px] pt-[16px]">
        <p className="text-[12px] text-[#70757a]">About 84,300,000 results (0.48 seconds)</p>

        {/* First result — the Amazon link the shopper clicks. */}
        <button onClick={onAmazon} className="group mt-[18px] block w-[652px] text-left">
          <div className="flex items-center gap-[12px]">
            <SiteFavicon glyph="a" bg="#ff9900" fg="#111" />
            <div className="flex flex-col">
              <span className="text-[14px] leading-[18px] text-[#202124]">Amazon.com</span>
              <span className="text-[12px] leading-[16px] text-[#4d5156]">
                https://www.amazon.com › best-strollers-2026
              </span>
            </div>
          </div>
          <p className="mt-[6px] text-[20px] leading-[26px] text-[#1a0dab] group-hover:underline">
            Best Stroller 2026 - Strollers &amp; Accessories
          </p>
          <p className="mt-[3px] text-[14px] leading-[22px] text-[#4d5156]">
            Shop the top-rated strollers of 2026. Lightweight, standard, travel systems, joggers &amp; more.
            Free delivery on eligible orders.
          </p>
        </button>

        {/* Scenery */}
        {OTHER_RESULTS.map((r) => (
          <div key={r.title} className="mt-[26px] w-[652px]">
            <div className="flex items-center gap-[12px]">
              <SiteFavicon glyph={r.glyph} bg={r.bg} fg={r.fg} />
              <div className="flex flex-col">
                <span className="text-[14px] leading-[18px] text-[#202124]">{r.site}</span>
                <span className="text-[12px] leading-[16px] text-[#4d5156]">{r.path}</span>
              </div>
            </div>
            <p className="mt-[6px] text-[20px] leading-[26px] text-[#1a0dab]">{r.title}</p>
            <p className="mt-[3px] text-[14px] leading-[22px] text-[#4d5156]">{r.snippet}</p>
          </div>
        ))}
      </div>

      {/* Right-hand knowledge rail, cropped by the frame — pure scenery. */}
      <div className="absolute right-[110px] top-[130px] w-[360px] rounded-[8px] border border-[#dadce0] p-[18px]">
        <p className="text-[18px] leading-[24px] text-[#202124]">Strollers</p>
        <p className="mt-[2px] text-[13px] text-[#70757a]">Baby product</p>
        <div className="mt-[12px] flex items-center gap-[8px]">
          <GoogleFavicon size={14} />
          <span className="text-[12px] text-[#70757a]">People also ask</span>
        </div>
        <div className="mt-[10px] flex flex-col gap-[10px] text-[14px] text-[#202124]">
          <span>What stroller do most parents buy?</span>
          <span>Is an expensive stroller worth it?</span>
          <span>How long do babies use a stroller?</span>
        </div>
      </div>
    </div>
  )
}
