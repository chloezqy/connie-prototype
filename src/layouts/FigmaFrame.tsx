import { useLayoutEffect, useState, type ReactNode } from 'react'

const FRAME_W = 1440
/** Canvas height. Exported so overlays can tell what falls below the fold. */
export const FRAME_H = 900

/**
 * A faithful 1440×900 Figma frame canvas. Children are positioned with the exact
 * absolute coordinates from Figma. The frame scales down to fit the viewport so the
 * whole canvas — including the floating extension launcher & panel — is always visible
 * without scrolling. It never scales past 1:1, so the internal layout is untouched.
 */
export function FigmaFrame({
  children,
  backdrop,
  backdropOpacity = 0.4,
  bg = '#ffffff',
}: {
  children: ReactNode
  backdrop?: string
  backdropOpacity?: number
  bg?: string
}) {
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / FRAME_W, window.innerHeight / FRAME_H, 1)
      setScale(s)
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#e6e6e3]">
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          background: bg,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {backdrop && (
          <img
            alt=""
            src={backdrop}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={{ opacity: backdropOpacity }}
          />
        )}
        {children}
      </div>
    </div>
  )
}