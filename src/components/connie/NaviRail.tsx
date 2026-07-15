import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconChat,
  IconHeart,
  IconSettings,
  IconHelp,
  IconChatFilled,
  IconHeartFilled,
} from '@/components/icons'
import { routes } from '@/app/routes'
import { cn } from '@/lib/cn'

export type NaviTab = 'chat' | 'saved'

/** The unread-notification colour, shared by the launcher badge and the chat icon's dot. */
export const NOTIFY_COLOR = '#F43F07'

/**
 * The Connie launcher — one shared nav used on every page.
 *
 * Collapsed it's the "C" pinned bottom-left. On hover (or `forceOpen`, used by the tour) the
 * 4-icon rail reveals just above it. Each icon is clickable:
 *   chat  → Preference Inference (override with `onChat`, e.g. Post-Purchase opens its check-in)
 *   saved → Decision Support     (override with `onSaved`)
 * `active` highlights the current section; `notify` marks an unread nudge on both the "C" and the
 * chat icon; `onLauncherClick` replaces the default hover-toggle (the tour uses it to start).
 */
export function NaviRail({
  style,
  active,
  notify = false,
  onChat,
  onSaved,
  onLauncherClick,
  forceOpen = false,
  highlighted = false,
  pulse = false,
}: {
  style?: CSSProperties
  active?: NaviTab | null
  notify?: boolean
  onChat?: () => void
  onSaved?: () => void
  onLauncherClick?: () => void
  forceOpen?: boolean
  highlighted?: boolean
  /** Draws a pulsing halo around the "C" — used where clicking it is the next step in the story. */
  pulse?: boolean
}) {
  const navigate = useNavigate()
  const [hover, setHover] = useState(false)
  const open = hover || forceOpen
  const chat = onChat ?? (() => navigate(routes.priorities))
  const saved = onSaved ?? (() => navigate(routes.decision))

  /**
   * Selected: CR green on grey, with the solid icon. Unselected stays a grey outline.
   *
   * The selected grey is a step darker than the hover grey — if they matched, hovering an
   * unselected tab would give it the selected tab's chrome and only the icon would say otherwise.
   */
  const btn = (isActive: boolean) =>
    cn(
      'relative flex size-[40px] items-center justify-center rounded-[8px] transition-colors',
      isActive ? 'bg-bg-tertiary text-fg-brand' : 'text-fg-secondary hover:bg-bg-tertiary',
    )

  return (
    <div
      className="absolute z-30 flex flex-col items-start gap-[12px]"
      style={style ?? { left: 52, bottom: 48 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Revealed rail — floats just above the "C". */}
      {open && (
        <div className="flex items-center rounded-[8px] border-[0.5px] border-border-subtle bg-white p-[10px] shadow-[0px_0px_7.5px_0px_rgba(5,5,0,0.16)]">
          <div className="flex flex-col items-center gap-[16px]">
            <div className="flex flex-col items-center gap-[16px]">
              <button
                aria-label="Chat"
                aria-current={active === 'chat' ? 'page' : undefined}
                onClick={chat}
                className={btn(active === 'chat')}
              >
                {active === 'chat' ? <IconChatFilled size={24} /> : <IconChat size={24} />}
                {notify && (
                  <span
                    className="absolute right-[4px] top-[4px] size-[9px] rounded-full border-2 border-white"
                    style={{ background: NOTIFY_COLOR }}
                  />
                )}
              </button>
              <button
                aria-label="Saved"
                aria-current={active === 'saved' ? 'page' : undefined}
                onClick={saved}
                className={btn(active === 'saved')}
              >
                {active === 'saved' ? <IconHeartFilled size={24} /> : <IconHeart size={24} />}
              </button>
            </div>
            <div className="h-px w-full bg-border-subtle" />
            <div className="flex flex-col items-center gap-[16px]">
              {/* Settings and Help have no destination in the prototype, so they never select.
                  Their solid twins (IconSettingsFilled / IconHelpFilled) are ready for when
                  they do — `active` just has no case for them yet. */}
              <button aria-label="Settings" className={btn(false)}>
                <IconSettings size={24} />
              </button>
              <button aria-label="Help" className={btn(false)}>
                <IconHelp size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The Connie "C" launcher (logo image). */}
      <div className="relative size-[60px] shrink-0">
        {pulse && (
          <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-brand opacity-30" />
        )}
        <button
          aria-label="Connie"
          onClick={onLauncherClick ?? (() => setHover((h) => !h))}
          className={cn(
            'relative block size-[60px] rounded-full',
            highlighted && 'ring-2 ring-fg-primary ring-offset-2',
          )}
        >
          <img
            src={notify ? '/figma/C_notification.png' : '/figma/C.png'}
            alt="Connie"
            className="size-full object-contain"
          />
        </button>
      </div>
    </div>
  )
}
