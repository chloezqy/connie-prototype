import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { NaviRail } from '@/components/connie/NaviRail'
import { RetailBackdrop } from '@/components/connie/RetailBackdrop'
import { routes } from '@/app/routes'

/* ---------- Tour asset paths (public/figma, prefix "tour-") ---------- */
const AMAZON_BG = '/figma/tour-amazon-bg.png'
const DETAIL_BG = '/figma/tour-detail-bg.png'
const STAR = '/figma/tour-star.png'
const NAVIBAR = '/figma/tour-navibar.png'

const BUBBLE_SHADOW = '0px 4px 8px rgba(5,5,0,0.02), 0px 2px 4px rgba(5,5,0,0.16)'
const PILL_SHADOW = '0px 8px 24px 0px rgba(0,0,0,0.14)'

/* ---------- Backdrops (dimmed retailer page behind the coach marks) ---------- */
function AmazonBackdrop() {
  return (
    <img
      alt=""
      src={AMAZON_BG}
      className="pointer-events-none absolute object-cover"
      style={{ left: -110, top: 0, width: 1720, height: 1074, opacity: 0.4 }}
    />
  )
}
function DetailBackdrop() {
  return (
    <img
      alt=""
      src={DETAIL_BG}
      className="pointer-events-none absolute object-cover"
      style={{ left: -1, top: -1, width: 1440, height: 900, opacity: 0.4 }}
    />
  )
}

/* ---------- Floating CR launcher (green active variant used by the tour) ---------- */
function Launcher({ style, highlighted = false }: { style?: CSSProperties; highlighted?: boolean }) {
  return (
    <div className="absolute" style={style}>
      <div
        className="relative size-[60px] rounded-[8px] bg-brand"
        style={highlighted ? { border: '2px solid #050500' } : undefined}
      >
        <span className="absolute left-[18px] top-[7px] font-semibold text-title1 text-fg-inverse">C</span>
        <span className="absolute left-[51px] top-[-4px] size-[14px] rounded-full border-2 border-white bg-[#4dcc73]" />
      </div>
    </div>
  )
}

/* ---------- Star badge over the highlighted product (T1 / T2) ---------- */
function StarBadge({ withBorder }: { withBorder: boolean }) {
  return (
    <div
      className="absolute flex items-center justify-center rounded-full bg-[#00ae3d]"
      style={{ left: 797, top: 102, width: 45, height: 45, border: withBorder ? '1px solid #ffd500' : undefined }}
    >
      <img alt="" src={STAR} className="size-[28px] object-cover" />
    </div>
  )
}

/* ---------- Tooltip arrows (CSS triangles, bubble fill #050500) ---------- */
function ArrowUp({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: '16px solid transparent',
        borderRight: '16px solid transparent',
        borderBottom: '14px solid #050500',
        ...style,
      }}
    />
  )
}
function ArrowLeft() {
  return (
    <div
      style={{
        width: 0,
        height: 0,
        borderTop: '16px solid transparent',
        borderBottom: '16px solid transparent',
        borderRight: '14px solid #050500',
      }}
    />
  )
}
function ArrowRight() {
  return (
    <div
      style={{
        width: 0,
        height: 0,
        borderTop: '16px solid transparent',
        borderBottom: '16px solid transparent',
        borderLeft: '14px solid #050500',
      }}
    />
  )
}

/* ---------- Dark tooltip bubble ---------- */
function Bubble({
  title,
  body,
  gap,
  bodyMuted = false,
}: {
  title: string
  body: string
  gap: number
  bodyMuted?: boolean
}) {
  return (
    <div
      className="flex flex-col items-start rounded-[8px] bg-fg-primary px-[32px] py-[24px]"
      style={{ gap, boxShadow: BUBBLE_SHADOW }}
    >
      <div className="flex flex-col items-start gap-[4px]">
        <p className="whitespace-nowrap text-[16px] font-semibold leading-[24px] text-fg-inverse">{title}</p>
        {bodyMuted ? (
          <p className="text-[14px] font-normal leading-[20px] text-[#d8d9d4]" style={{ width: 300 }}>
            {body}
          </p>
        ) : (
          <p className="text-[16px] font-normal leading-[24px] text-fg-inverse" style={{ width: 300 }}>
            {body}
          </p>
        )}
      </div>
    </div>
  )
}

/* ---------- 3-dot progress indicator ---------- */
function Progress({ active }: { active: number }) {
  return (
    <div className="flex h-[8px] shrink-0 items-center gap-[7px]">
      {[0, 1, 2].map((i) =>
        i === active ? (
          <div key={i} className="h-[8px] w-[20px] rounded-full bg-[#050500]" />
        ) : (
          <div key={i} className="size-[8px] rounded-full bg-[#666661]" />
        ),
      )}
    </div>
  )
}

/* ---------- Bottom control pill (steps 1–4) ---------- */
function GreenButton({
  label,
  width,
  onClick,
}: {
  label: ReactNode
  width: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-[40px] shrink-0 items-center justify-center rounded-[24px] bg-brand text-[16px] font-semibold text-fg-inverse"
      style={{ width }}
    >
      {label}
    </button>
  )
}

function Controls({
  showSkip,
  active,
  buttonLabel,
  buttonWidth,
  onSkip,
  onNext,
}: {
  showSkip: boolean
  active: number
  buttonLabel: string
  buttonWidth: number
  onSkip: () => void
  onNext: () => void
}) {
  return (
    <div
      className="absolute flex items-center gap-[18px] overflow-clip rounded-[999px] bg-white py-[12px] pl-[22px] pr-[14px]"
      style={{ left: 589, top: 795, boxShadow: PILL_SHADOW }}
    >
      {showSkip ? (
        <button
          onClick={onSkip}
          className="shrink-0 whitespace-nowrap text-[16px] leading-[24px] text-[#6b6b70] underline"
        >
          Skip tour
        </button>
      ) : (
        <span className="shrink-0" />
      )}
      <Progress active={active} />
      <GreenButton label={buttonLabel} width={buttonWidth} onClick={onNext} />
    </div>
  )
}

/* ================================================================
   Tour — T1–T4 guided coach marks over the retailer page.
   One route (/browse/tour), stepped via local state; Next advances.
   ================================================================ */
export function TourScreen() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const skip = () => navigate(routes.insights)
  const next = () => {
    if (step >= 2) navigate(routes.insights)
    else setStep(step + 1)
  }
  const active = Math.min(step, 2)

  /* ---- Steps 1–3 — over the Amazon product grid ---- */
  return (
    <FigmaFrame>
      <RetailBackdrop />

      {/* Step 1 & 2 — highlight the middle product card + star badge */}
      {(step === 0 || step === 1) && (
        <>
          <div
            className="absolute rounded-[8px]"
            style={{
              left: 445,
              top: 117,
              width: 380,
              height: 377,
              background: 'rgba(5,5,0,0.08)',
              border: '2px solid #989991',
            }}
          />
          <StarBadge withBorder={step === 0} />
        </>
      )}

      {/* Step 1 tooltip — below the card, arrow up */}
      {step === 0 && (
        <div className="absolute flex flex-col items-start" style={{ left: 696, top: 510 }}>
          <ArrowUp style={{ marginLeft: 32 }} />
          <Bubble
            title="Connie stars the picks that fit you"
            body="Starred picks are based on the priorities you just set."
            gap={28}
          />
        </div>
      )}

      {/* Step 2 tooltip — beside the badge, arrow up */}
      {step === 1 && (
        <div className="absolute flex flex-col items-start" style={{ left: 778, top: 164 }}>
          <ArrowUp style={{ marginLeft: 32 }} />
          <Bubble
            title="Tap a star for CR's take"
            body="CR score + community sentiment open right on the product, inline."
            gap={24}
          />
        </div>
      )}

      {/* Step 3 — reveal the Navi bar AND the tooltip beside the launcher, together */}
      {step === 2 && (
        <div className="absolute flex items-center" style={{ left: 152, top: 690 }}>
          <ArrowLeft />
          <Bubble
            title="Open Connie anytime"
            body="Your panel lives on the left. Hover the C to open the menu — chat, saved, settings, help."
            gap={0}
            bodyMuted
          />
        </div>
      )}

      <Controls
        showSkip={step === 0 || step === 1}
        active={active}
        buttonLabel={step <= 1 ? 'Next' : 'Got it'}
        buttonWidth={step === 1 ? 75 : 80}
        onSkip={skip}
        onNext={next}
      />

      <NaviRail forceOpen={step === 2} highlighted={step === 2} />
    </FigmaFrame>
  )
}
