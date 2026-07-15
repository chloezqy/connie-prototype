import { CHROME_H } from './BrowserChrome'

/**
 * The Google new-tab page — wordmark, search box, and most-visited shortcut tiles.
 * Rendered below the browser chrome inside a 1440×900 FigmaFrame.
 */

/** Colourful "Google" wordmark. */
function GoogleWordmark() {
  const letters: [string, string][] = [
    ['G', '#4285F4'],
    ['o', '#EA4335'],
    ['o', '#FBBC05'],
    ['g', '#4285F4'],
    ['l', '#34A853'],
    ['e', '#EA4335'],
  ]
  return (
    <p className="font-sans text-[76px] font-medium leading-none" style={{ letterSpacing: '-3px' }}>
      {letters.map(([ch, c], i) => (
        <span key={i} style={{ color: c }}>
          {ch}
        </span>
      ))}
    </p>
  )
}

export type Shortcut = { label: string; icon: string }

/** The shopper's most-visited tiles, each with the site's real logo. Amazon is the one that
 *  matters to the story. Chrome frames every favicon in the same neutral disc, so the tiles
 *  read as one set no matter how each brand's mark is cropped. */
export const SHORTCUTS: Shortcut[] = [
  { label: 'Amazon', icon: '/figma/sc-amazon.png' },
  { label: 'Gmail', icon: '/figma/sc-gmail.png' },
  { label: 'YouTube', icon: '/figma/sc-youtube.png' },
  { label: 'Target', icon: '/figma/sc-target.png' },
  { label: 'Reddit', icon: '/figma/sc-reddit.png' },
  { label: 'Consumer Reports', icon: '/figma/sc-cr.png' },
]

function ShortcutTile({ s, onClick }: { s: Shortcut; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-[112px] flex-col items-center gap-[8px] rounded-[8px] px-[8px] py-[12px] transition-colors hover:bg-[#f1f3f4]"
    >
      <span className="flex size-[48px] items-center justify-center rounded-full border border-[#ececec] bg-white">
        <img src={s.icon} alt="" className="size-[26px] shrink-0 object-contain" />
      </span>
      <span className="w-full truncate text-center text-[12px] text-[#3c4043]">{s.label}</span>
    </button>
  )
}

export function GoogleNewTab({
  query,
  onQuery,
  onSearch,
  onShortcut,
  autoFocus = true,
}: {
  query: string
  onQuery: (v: string) => void
  onSearch: () => void
  onShortcut?: (label: string) => void
  autoFocus?: boolean
}) {
  return (
    <div
      className="absolute left-0 w-[1440px] bg-white"
      style={{ top: CHROME_H, height: 900 - CHROME_H }}
    >
      <div className="flex h-full flex-col items-center pt-[118px]">
        <GoogleWordmark />

        {/* Search box */}
        <div className="mt-[32px] flex h-[48px] w-[580px] items-center gap-[14px] rounded-full border border-[#dfe1e5] px-[20px] shadow-[0_1px_6px_rgba(32,33,36,0.12)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) onSearch()
            }}
            aria-label="Search Google"
            className="h-full flex-1 bg-transparent text-[16px] text-[#202124] outline-none"
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#4285F4" aria-hidden>
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
            <path d="M17 11a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z" />
          </svg>
        </div>

        {/* Search buttons */}
        <div className="mt-[28px] flex gap-[12px]">
          <button
            onClick={() => query.trim() && onSearch()}
            className="rounded-[4px] bg-[#f8f9fa] px-[18px] py-[9px] text-[14px] text-[#3c4043] hover:shadow-[0_1px_1px_rgba(0,0,0,0.1)]"
          >
            Google Search
          </button>
          <button className="rounded-[4px] bg-[#f8f9fa] px-[18px] py-[9px] text-[14px] text-[#3c4043] hover:shadow-[0_1px_1px_rgba(0,0,0,0.1)]">
            I&rsquo;m Feeling Lucky
          </button>
        </div>

        {/* Most-visited shortcuts */}
        <div className="mt-[52px] flex items-start gap-[4px]">
          {SHORTCUTS.map((s) => (
            <ShortcutTile key={s.label} s={s} onClick={() => onShortcut?.(s.label)} />
          ))}
        </div>
      </div>
    </div>
  )
}
