import { useEffect, useState, type ReactNode } from 'react'
import { ConnieHeader } from './ConnieHeader'
import { LOADING_MS } from '@/lib/timing'
import { cn } from '@/lib/cn'

/**
 * The one Connie chat interface.
 *
 * Preference inference and the post-purchase check-in are the same conversation with Connie at
 * two different moments, so they are literally the same components — panel, bubbles, chips, and
 * composer all live here. If a chat surface needs something this file doesn't have, add it here
 * rather than forking it locally; that's how the two drifted apart in the first place.
 */

/* ------------------------------------------------------------------ panel */

/** Panel geometry — right-inset, full height. Every chat surface uses it. */
export const CHAT_PANEL = { right: 16, top: 16, width: 520, height: 868 }

export function ChatPanel({
  onClose,
  children,
  composer,
  /** Scroll container ref, so a screen can pin the thread to the newest message. */
  threadRef,
}: {
  onClose?: () => void
  children: ReactNode
  composer?: ReactNode
  threadRef?: React.Ref<HTMLDivElement>
}) {
  return (
    <div
      className="absolute z-20 flex flex-col items-start overflow-clip rounded-[16px] border border-border-subtle bg-bg-secondary shadow-panel"
      style={CHAT_PANEL}
    >
      <div className="w-full shrink-0 px-[24px] pt-[16px]">
        <ConnieHeader onClose={onClose} />
      </div>

      {/* Thread */}
      <div
        ref={threadRef}
        className="flex min-h-0 w-full flex-1 flex-col items-start gap-[24px] overflow-y-auto overflow-x-clip bg-bg-secondary px-[28px] pb-[24px] pt-[20px]"
      >
        {children}
      </div>

      {composer && (
        <div className="w-full shrink-0 border-t border-border-subtle bg-bg-primary px-[20px] pb-[18px] pt-[16px]">
          {composer}
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- bubbles */

/** Connie's "C" avatar beside a message group. */
function Avatar() {
  return <img src="/figma/C.png" alt="Connie" className="size-[30px] shrink-0 object-contain" />
}

/** A Connie message group: avatar + content column. */
export function ConnieGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full shrink-0 items-start gap-[12px]">
      <Avatar />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-[14px]">{children}</div>
    </div>
  )
}

/** Connie speech bubble — tail on the top left. */
export function BotBubble({ children }: { children: ReactNode }) {
  return (
    <div className="w-full shrink-0 rounded-b-[16px] rounded-tl-[4px] rounded-tr-[16px] bg-bg-tertiary px-[16px] py-[13px]">
      <p className="text-[16px] leading-[24px] text-fg-primary">{children}</p>
    </div>
  )
}

/** The shopper's reply — right-aligned, dark, tail on the top right. */
export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full shrink-0 items-start justify-end">
      <div className="max-w-[300px] rounded-b-[16px] rounded-tl-[16px] rounded-tr-[4px] bg-fg-primary px-[16px] py-[13px]">
        <p className="text-[16px] font-semibold leading-[24px] text-white">{children}</p>
      </div>
    </div>
  )
}

/** "Connie is thinking…" — the three-dot bubble shown before any content lands. */
export function ThinkingBubble() {
  return (
    <div className="flex shrink-0 items-center gap-[8px] rounded-b-[16px] rounded-tl-[4px] rounded-tr-[16px] bg-bg-tertiary px-[16px] py-[18px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-[8px] animate-bounce rounded-full bg-fg-secondary"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

/**
 * One turn of Connie's side of the conversation: renders nothing until `when`, then a thinking
 * bubble for one LOADING_MS beat, then the content.
 *
 * Everything Connie "says" goes through this. Nothing Connie says should appear instantly —
 * instant means precomputed, and precomputed is exactly what we're claiming it isn't.
 */
export function Turn({ when = true, children }: { when?: boolean; children: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!when) {
      setReady(false)
      return
    }
    const t = window.setTimeout(() => setReady(true), LOADING_MS)
    return () => window.clearTimeout(t)
  }, [when])
  if (!when) return null
  if (!ready) {
    return (
      <ConnieGroup>
        <ThinkingBubble />
      </ConnieGroup>
    )
  }
  return <>{children}</>
}

/* ------------------------------------------------------------------ chips */

export type ChipState = 'default' | 'active' | 'selected'

export function ChatChip({
  label,
  icon,
  state = 'default',
  onClick,
}: {
  label: string
  icon?: ReactNode
  state?: ChipState
  onClick?: () => void
}) {
  const border =
    state === 'selected'
      ? 'border-2 border-border-brand bg-bg-brand-muted'
      : state === 'active'
        ? 'border-2 border-border-subtle bg-bg-primary'
        : 'border-[1.5px] border-[#d9d9db] bg-bg-primary'
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-[8px] overflow-clip rounded-pill px-[15px] py-[9px] text-left',
        border,
      )}
    >
      {icon}
      <p className="whitespace-nowrap text-[14px] leading-[20px] text-fg-primary">{label}</p>
    </button>
  )
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full shrink-0 flex-wrap content-start items-start gap-[8px]">{children}</div>
  )
}

/* --------------------------------------------------------------- composer */

/**
 * The composer, modelled on Ask CR: a rounded field with the prompt inside it and a dark round
 * send button. Suggested actions live in the placeholder rather than as a row of pills above the
 * field — a pill that only writes text into the box below it is a button pretending to be a
 * conversation.
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  placeholder,
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  onSend?: () => void
  placeholder: string
  disabled?: boolean
}) {
  return (
    <div className="flex w-full items-center gap-[10px] rounded-[16px] border border-border-strong bg-bg-primary py-[9px] pl-[16px] pr-[9px] focus-within:border-brand">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) onSend?.()
        }}
        placeholder={placeholder}
        aria-label="Message Connie"
        className="min-w-0 flex-1 bg-transparent text-[15px] leading-[24px] text-fg-primary outline-none placeholder:text-fg-secondary"
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label="Send"
        className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-fg-primary text-white transition-opacity disabled:opacity-35"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  )
}
