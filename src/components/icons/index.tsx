import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

export const IconX = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const IconChat = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
  </svg>
)

export const IconArrowUp = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)

export const IconArrowUpRight = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M7 17L17 7M7 7h10v10" />
  </svg>
)

export const IconCaretDown = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const IconCaretRight = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export const IconCaretLeft = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
)

export const IconCheck = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M5 12l5 5L20 6" />
  </svg>
)

export const IconPlus = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconStar = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size)} fill="currentColor" stroke="none" {...p}>
    <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
  </svg>
)

export const IconBookmark = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M6 4h12v16l-6-4-6 4V4z" />
  </svg>
)

export const IconHeart = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M20.8 6.6a5 5 0 0 0-7.1 0L12 8.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-7.3a5 5 0 0 0 0-7.1z" />
  </svg>
)

export const IconHelp = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
  </svg>
)

export const IconShare = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 15V4M8 8l4-4 4 4" />
    <path d="M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" />
  </svg>
)

export const IconEdit = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
)

export const IconInfo = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
)

export const IconPeople = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M17 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9.5" cy="7" r="3.5" />
    <path d="M22 20v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
  </svg>
)

export const IconSettings = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 15H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 11 3.09V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.9 9v.09A1.65 1.65 0 0 0 21 11h.09" />
  </svg>
)

export const IconTutorial = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
  </svg>
)

/** Connie feather mark. */
export const IconFeather = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M20 4c-6 0-12 5-12 11v3l-3 3M20 4c0 6-5 12-11 12M20 4c-2 6-6 8-10 9" />
  </svg>
)

export const IconGridNine = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)

export const IconRows = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="4" width="18" height="4" rx="1.5" />
    <rect x="3" y="10" width="18" height="4" rx="1.5" />
    <rect x="3" y="16" width="18" height="4" rx="1.5" />
  </svg>
)

export const IconCards = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <rect x="4" y="3" width="16" height="7" rx="2" />
    <rect x="4" y="14" width="16" height="7" rx="2" />
  </svg>
)

/* ---------------------------------------------------------------------------
 * Shopping-value icons — one per onboarding priority (N4b). The same glyphs are
 * reused wherever a priority is named (the BASED ON popover, the chat's priority
 * list), so a value looks the same everywhere it appears.
 * ------------------------------------------------------------------------- */

/** Long-term reliability. */
export const IconShieldCheck = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3l7 3v5.5c0 4.6-3 8.4-7 9.5-4-1.1-7-4.9-7-9.5V6l7-3z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </svg>
)

/** Value for price. */
export const IconTag = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1a1 1 0 0 1 .7.3l7.1 7.1a1 1 0 0 1 0 1.4l-8.1 8.1a1 1 0 0 1-1.4 0L3.8 13.3a1 1 0 0 1-.3-.7z" />
    <circle cx="8" cy="8" r="1.4" />
  </svg>
)

/** Aesthetics. */
export const IconSparkle = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9L11 3z" />
    <path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15z" />
  </svg>
)

/** Ease of use. */
export const IconHandTap = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M9 11V5.5a1.75 1.75 0 0 1 3.5 0V11" />
    <path d="M12.5 11V9.5a1.75 1.75 0 0 1 3.5 0V12" />
    <path d="M16 12v-.5a1.75 1.75 0 0 1 3.5 0V15a6 6 0 0 1-6 6h-1.6a5 5 0 0 1-3.8-1.7L5 15.4a1.7 1.7 0 0 1 2.5-2.3L9 14.5V11" />
  </svg>
)

/** Sustainability. */
export const IconLeaf = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M20 4c0 9-5.5 13-11 13a5.5 5.5 0 0 1-1.4-10.8C12 5 15 8 20 4z" />
    <path d="M4 20c1.5-4.5 4.5-8 9-10" />
  </svg>
)

/* --------------------------------------------------------------------------
 * Product-detail icons — the six rows behind "Show details" in Decision Support.
 * ------------------------------------------------------------------------ */

/** Safety rating. */
export const IconSafety = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3l7 3v5.5c0 4.6-3 8.4-7 9.5-4-1.1-7-4.9-7-9.5V6l7-3z" />
    <path d="M12 8v4.5M12 15.5h.01" />
  </svg>
)

/** Maneuverability. */
export const IconCompass = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
  </svg>
)

/** Fold / portability. */
export const IconFold = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M4 20L20 4M4 20h6M4 20v-6" />
    <path d="M20 4h-6M20 4v6" />
  </svg>
)

/** Comfort. */
export const IconComfort = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M4 15a8 8 0 0 1 16 0" />
    <path d="M2 15h20M6 15v4M18 15v4" />
  </svg>
)

/** Weight. */
export const IconWeight = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M7 8h10l2.5 12h-15L7 8z" />
    <circle cx="12" cy="5.5" r="2.5" />
  </svg>
)

/** Durability. */
export const IconDurability = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 2.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 15.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L12 2.5z" />
  </svg>
)

/** Price / value. */
export const IconPrice = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.5 9.2a2.8 2.8 0 0 0-2.5-1.2c-1.5 0-2.5.8-2.5 2s1 1.8 2.5 2 2.5.8 2.5 2-1 2-2.5 2a2.8 2.8 0 0 1-2.5-1.2M12 6.5v11" />
  </svg>
)
