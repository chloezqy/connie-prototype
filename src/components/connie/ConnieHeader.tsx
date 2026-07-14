import { cn } from '@/lib/cn'

/**
 * The one Connie panel header — logo + wordmark + close.
 *
 * Every Connie surface that is a *panel* wears this: onboarding, the chat panels, decision
 * support, and the share/collaborate flow. The two inline surfaces (Product Insights and the
 * on-page annotation callout) are deliberately excluded — they're anchored to page content and
 * carry their own verdict header instead.
 */
export function ConnieHeader({
  onClose,
  /** Panels that sit flush against their own padding pass `false` to drop the divider. */
  divider = true,
  className,
}: {
  onClose?: () => void
  divider?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex w-full shrink-0 items-center gap-[10px] bg-transparent pb-[14px]',
        divider && 'border-b border-border-subtle',
        className,
      )}
    >
      <img src="/figma/C.png" alt="" className="size-[28px] shrink-0 object-contain" />
      <p className="flex-1 text-[16px] font-semibold leading-[24px] text-fg-primary">Connie</p>
      {onClose && (
        <button
          aria-label="Close"
          onClick={onClose}
          className="flex size-[24px] shrink-0 items-center justify-center rounded-full text-fg-primary transition-colors hover:bg-bg-tertiary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </div>
  )
}
