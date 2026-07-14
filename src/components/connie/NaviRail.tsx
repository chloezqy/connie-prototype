import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconChat, IconHeart, IconSettings, IconHelp } from '@/components/icons'
import { routes } from '@/app/routes'
import { cn } from '@/lib/cn'

export type NaviTab = 'chat' | 'saved'

/**
 * The Connie launcher — one shared nav used on every page.
 *
 * Collapsed it's a green "C" pinned bottom-left. On hover (or `forceOpen`, used by the tour) the
 * 4-icon rail reveals just above it. Each icon is clickable:
 *   chat  → Preference Inference (override with `onChat`, e.g. Post-Purchase opens its check-in)
 *   saved → Decision Support     (override with `onSaved`)
 * `active` highlights the current section; `notify` shows a dot on the "C".
 */
export function NaviRail({
  style,
  active,
  notify = false,
  onChat,
  onSaved,
  forceOpen = false,
  highlighted = false,
}: {
  style?: CSSProperties
  active?: NaviTab | null
  notify?: boolean
  onChat?: () => void
  onSaved?: () => void
  forceOpen?: boolean
  highlighted?: boolean
}) {
  const navigate = useNavigate()
  const [hover, setHover] = useState(false)
  const open = hover || forceOpen
  const chat = onChat ?? (() => navigate(routes.priorities))
  const saved = onSaved ?? (() => navigate(routes.decision))

  const btn = (isActive: boolean) =>
    cn(
      'relative flex size-[40px] items-center justify-center rounded-[8px] transition-colors',
      isActive ? 'bg-bg-tertiary text-fg-primary' : 'text-fg-secondary hover:bg-bg-tertiary',
    )

  return (
    <div
      className="absolute flex flex-col items-start gap-[12px]"
      style={style ?? { left: 52, bottom: 48 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Revealed rail — floats just above the "C". */}
      {open && (
        <div className="flex items-center rounded-[8px] border-[0.5px] border-border-subtle bg-white p-[10px] shadow-[0px_0px_7.5px_0px_rgba(5,5,0,0.16)]">
          <div className="flex flex-col items-center gap-[16px]">
            <div className="flex flex-col items-center gap-[16px]">
              <button aria-label="Chat" onClick={chat} className={btn(active === 'chat')}>
                <IconChat size={24} />
              </button>
              <button aria-label="Saved" onClick={saved} className={btn(active === 'saved')}>
                <IconHeart size={24} />
              </button>
            </div>
            <div className="h-px w-full bg-border-subtle" />
            <div className="flex flex-col items-center gap-[16px]">
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
      <button
        aria-label="Connie"
        onClick={() => setHover((h) => !h)}
        className={cn(
          'relative size-[60px] shrink-0 rounded-full',
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
  )
}
