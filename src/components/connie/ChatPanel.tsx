import { useEffect, useRef, useState, type ReactNode } from 'react'
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
}: {
  onClose?: () => void
  children: ReactNode
  composer?: ReactNode
}) {
  const scrollEl = useRef<HTMLDivElement>(null)
  const contentEl = useRef<HTMLDivElement>(null)

  /**
   * Keep the thread pinned to the newest message.
   *
   * This lives here, watching the content box actually grow, rather than in each screen keyed on
   * a step counter. A turn's content lands a LOADING_MS beat *after* the state change that
   * triggered it, so scrolling on the state change scrolls before there's anything to scroll to —
   * and the bubble then arrives below the fold, which looks exactly like nothing happened.
   */
  useEffect(() => {
    const scroller = scrollEl.current
    const content = contentEl.current
    if (!scroller || !content) return
    const pin = () => {
      scroller.scrollTop = scroller.scrollHeight
    }
    pin()
    const ro = new ResizeObserver(pin)
    ro.observe(content)
    return () => ro.disconnect()
  }, [])

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
        ref={scrollEl}
        className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-clip bg-bg-secondary px-[28px] pb-[24px] pt-[20px]"
      >
        <div ref={contentEl} className="flex w-full flex-col items-start gap-[24px]">
          {children}
        </div>
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
 *
 * Turns must be CHAINED, not fired together: gate each one's `when` on the previous turn's
 * `onDone`. Two thinking bubbles spinning at once reads as two separate things loading, when
 * really it's one assistant taking one turn and then taking another.
 *
 * ⚠️ ALWAYS give a Turn a stable `key`, especially where a branch swaps one set of turns for
 * another. React unwraps keyless fragments and matches children by POSITION, so a `<Turn>` in
 * one branch will be reconciled against the `<Turn>` at the same index in the other — reusing
 * its fiber, and with it a stale `ready: true`. The reused turn then renders its content with no
 * thinking beat, and because its `when` never transitioned the effect below never re-runs, so
 * `onDone` never fires and every turn chained behind it stalls forever. Keys make React match by
 * identity instead, which is the only thing that makes the reuse impossible.
 */
export function Turn({
  when = true,
  onDone,
  children,
}: {
  when?: boolean
  /** Fires once this turn's content lands — gate the next turn's `when` on it. */
  onDone?: () => void
  children: ReactNode
}) {
  const [ready, setReady] = useState(false)
  // Held in a ref so a caller passing an inline arrow doesn't restart the beat every render.
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  useEffect(() => {
    if (!when) {
      setReady(false)
      return
    }
    // Re-assert `ready: false` on every activation, not just on deactivation. If this fiber was
    // recycled from another branch it can arrive already-ready, and the guard above would never
    // have run to clear it.
    setReady(false)
    const t = window.setTimeout(() => {
      setReady(true)
      onDoneRef.current?.()
    }, LOADING_MS)
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
/** How long each half of the placeholder cross-fade takes. Matches `duration-200` below. */
const PLACEHOLDER_FADE_MS = 200

/**
 * Holds `text` steady through a fade-out, swaps it while invisible, then fades the new text in.
 *
 * The suggested action changes as the conversation moves, and swapping the string outright made it
 * pop — a jump-cut in a panel where everything else eases. Returning the *previous* text until the
 * fade-out lands is the whole point: it's what makes the change read as one motion.
 */
function useCrossFade(text: string) {
  const [shown, setShown] = useState(text)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (text === shown) return
    setVisible(false)
    const t = window.setTimeout(() => {
      setShown(text)
      setVisible(true)
    }, PLACEHOLDER_FADE_MS)
    return () => window.clearTimeout(t)
  }, [text, shown])

  return { shown, visible }
}

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
  /* A native ::placeholder can't be transitioned, so the prompt is our own element layered over an
     empty input — same position and type, but it can actually fade. */
  const { shown, visible } = useCrossFade(placeholder)
  return (
    /* The outline is a live yellow-green gradient panning behind the field — the same palette as
       every other "Connie is working" moment (the shimmer, the verify card), so the composer reads
       as part of the assistant rather than a plain form control. It's a 1.5px padded wrapper with
       the field sitting on top, because a border can't hold a gradient. */
    <div
      className="w-full animate-gradient-pan rounded-[16px] p-[1.5px]"
      style={{
        background:
          'linear-gradient(90deg, #d9ede2 0%, #bfd730 25%, #fbf5dd 50%, #bfd730 75%, #d9ede2 100%)',
        backgroundSize: '300% 100%',
      }}
    >
      <div className="flex w-full items-center gap-[10px] rounded-[14.5px] bg-bg-primary py-[8px] pl-[16px] pr-[8px]">
        <div className="relative min-w-0 flex-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && value.trim()) onSend?.()
            }}
            aria-label="Message Connie"
            placeholder={placeholder}
            className="w-full bg-transparent text-[15px] leading-[24px] text-fg-primary outline-none placeholder:text-transparent"
          />
          {/* The visible prompt. Hidden the moment she types, and aria-hidden because the input's
              own `placeholder` still carries this text for assistive tech. */}
          {!value && (
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-0 flex items-center truncate text-[15px] leading-[24px] text-fg-secondary transition-opacity duration-200 ${
                visible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {shown}
            </span>
          )}
        </div>
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
    </div>
  )
}
