import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Chrome browser window chrome — tab strip + toolbar, drawn at the top of a FigmaFrame.
 *
 * The Connie extension lives in the toolbar's extension area (top right), which is where the
 * shopper clicks to open onboarding. Every screen that shows a *live* page (Google new tab,
 * Google results) renders this; the Amazon screens use baked screenshots that already include
 * their own browser chrome.
 */

/** Total height of the chrome. Page content starts at this y-offset inside the 1440×900 frame. */
export const CHROME_H = 88

const TAB_STRIP_H = 40

/* ------------------------------------------------------------------ favicons */

/** Multicolour Google "G" — used as the new-tab favicon and on the search shortcut. */
export function GoogleFavicon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.1z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.5 46 24 46z"
      />
      <path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.2-2.9.7-4.2v-5.7H4.5A22 22 0 0 0 2 24c0 3.6.9 6.9 2.5 9.9l7.3-5.7z" />
      <path
        fill="#EA4335"
        d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 29.9 2 24 2 15.5 2 8.1 6.9 4.5 13.9l7.3 5.7c1.7-5.2 6.5-9.2 12.2-9.2z"
      />
    </svg>
  )
}

/** The Connie extension's toolbar icon — the lime "C" chip from the Chrome Web Store listing. */
function ConnieExtensionIcon({ size = 20 }: { size?: number }) {
  return <img src="/figma/C.png" alt="" className="object-contain" style={{ width: size, height: size }} />
}

/** The Chrome Web Store's four-colour mark, for its own tab. */
export function ChromeStoreFavicon({ size = 14 }: { size?: number }) {
  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: size,
        height: size,
        background:
          'conic-gradient(#ea4335 0 25%, #4285f4 25% 50%, #34a853 50% 75%, #fbbc05 75% 100%)',
      }}
    />
  )
}

function PuzzleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.6" aria-hidden>
      <path d="M10 3.5a1.5 1.5 0 0 1 3 0V5h3a1 1 0 0 1 1 1v3h1.5a1.5 1.5 0 0 1 0 3H17v3a1 1 0 0 1-1 1h-3v1.5a1.5 1.5 0 0 1-3 0V16H7a1 1 0 0 1-1-1v-3H4.5a1.5 1.5 0 0 1 0-3H6V6a1 1 0 0 1 1-1h3V3.5z" />
    </svg>
  )
}

/* ------------------------------------------------------------------ toolbar bits */

function NavButton({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return (
    <span
      className={cn(
        'flex size-[28px] items-center justify-center rounded-full',
        disabled ? 'text-[#bdc1c6]' : 'text-[#5f6368]',
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ chrome */

export type BrowserTab = {
  title: string
  /** Renders the tab's favicon. Omit for the new-tab page's generic mark. */
  favicon?: ReactNode
  active?: boolean
}

export function BrowserChrome({
  tabs,
  url,
  /** Placeholder shown in the omnibox when there's no URL (the new-tab page). */
  urlPlaceholder = 'Search Google or type a URL',
  /** Click handler for the Connie extension icon — this is what opens onboarding. */
  onExtensionClick,
  /** Draws attention to the extension icon (a pulsing ring) before it's been used. */
  highlightExtension = false,
  /** Hides the Connie icon entirely — used before the extension is installed. */
  showExtension = true,
  /** Click handler for the tab strip's "+" — opens a new tab. */
  onNewTab,
  /** Draws attention to the "+" (used right after install, when it's the next step). */
  highlightNewTab = false,
}: {
  tabs: BrowserTab[]
  url?: string
  urlPlaceholder?: string
  onExtensionClick?: () => void
  highlightExtension?: boolean
  showExtension?: boolean
  onNewTab?: () => void
  highlightNewTab?: boolean
}) {
  return (
    <div className="absolute left-0 top-0 w-[1440px]" style={{ height: CHROME_H }}>
      {/* ---- Tab strip ---- */}
      <div
        className="flex w-full items-end gap-[2px] bg-[#dee1e6] pl-[10px] pr-[12px]"
        style={{ height: TAB_STRIP_H }}
      >
        {tabs.map((t, i) => (
          <div
            key={i}
            className={cn(
              'flex h-[34px] min-w-0 max-w-[240px] flex-1 items-center gap-[8px] rounded-t-[8px] px-[12px]',
              t.active ? 'bg-white' : 'bg-[#cfd3d8]',
            )}
          >
            <span className="flex size-[16px] shrink-0 items-center justify-center">
              {t.favicon ?? <GoogleFavicon size={14} />}
            </span>
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-[12px]',
                t.active ? 'text-[#202124]' : 'text-[#5f6368]',
              )}
            >
              {t.title}
            </span>
            <span className="shrink-0 text-[13px] leading-none text-[#5f6368]">×</span>
          </div>
        ))}
        {/* New-tab "+" */}
        <div className="relative mb-[6px] ml-[4px] flex size-[24px] shrink-0 items-center justify-center">
          {highlightNewTab && (
            <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-brand opacity-40" />
          )}
          <button
            aria-label="New tab"
            onClick={onNewTab}
            className={cn(
              'relative flex size-[24px] items-center justify-center rounded-full text-[16px] leading-none text-[#5f6368] transition-colors hover:bg-[#c2c6cb]',
              highlightNewTab && 'bg-white ring-2 ring-brand',
            )}
          >
            +
          </button>
        </div>
        <span className="flex-1" />
      </div>

      {/* ---- Toolbar ---- */}
      <div
        className="flex w-full items-center gap-[6px] border-b border-[#dadce0] bg-white px-[10px]"
        style={{ height: CHROME_H - TAB_STRIP_H }}
      >
        <NavButton disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </NavButton>
        <NavButton disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </NavButton>
        <NavButton>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" />
          </svg>
        </NavButton>

        {/* Omnibox */}
        <div className="mx-[6px] flex h-[32px] flex-1 items-center gap-[10px] rounded-full bg-[#f1f3f4] px-[14px]">
          {url ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" aria-hidden>
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          )}
          <span className={cn('flex-1 truncate text-[13px]', url ? 'text-[#202124]' : 'text-[#5f6368]')}>
            {url ?? urlPlaceholder}
          </span>
        </div>

        {/* Extension area — the Connie icon lives here. */}
        <div className="flex shrink-0 items-center gap-[2px] pl-[2px]">
          <span className="flex size-[28px] items-center justify-center rounded-full">
            <PuzzleIcon />
          </span>
          {showExtension && (
            <div className="relative flex size-[30px] items-center justify-center">
              {highlightExtension && (
                <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-brand opacity-30" />
              )}
              <button
                aria-label="Open Connie"
                onClick={onExtensionClick}
                className={cn(
                  'relative flex size-[28px] items-center justify-center rounded-full transition-colors hover:bg-[#f1f3f4]',
                  highlightExtension && 'ring-2 ring-brand',
                )}
              >
                <ConnieExtensionIcon />
              </button>
            </div>
          )}
          <span className="ml-[4px] flex size-[26px] items-center justify-center rounded-full bg-[#a0c3ff] text-[12px] font-medium text-[#1a3d7c]">
            M
          </span>
          <span className="flex size-[26px] items-center justify-center text-[15px] leading-none text-[#5f6368]">⋮</span>
        </div>
      </div>
    </div>
  )
}
