import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { NaviRail } from '@/components/connie/NaviRail'
import { RetailBackdrop } from '@/components/connie/RetailBackdrop'
import { badgePos, overlayBox } from '@/components/retail/AmazonSearchPage'
import { routes } from '@/app/routes'

/* ---------- Tour asset paths (public/figma, prefix "tour-") ---------- */
const STAR = '/figma/tour-star.png'

/** The recommended stroller is the middle card of the three on the search page. */
const HERO = 1

const BUBBLE_SHADOW = '0px 4px 8px rgba(5,5,0,0.02), 0px 2px 4px rgba(5,5,0,0.16)'
const PILL_SHADOW = '0px 8px 24px 0px rgba(0,0,0,0.14)'

/* ---------- Star badge over the highlighted product (T1 / T2) ---------- */
/** Sits exactly where Product Insights' badge will be, so "tap a star" points at the thing the
 *  next screen actually shows. Both read the position from the search page's own layout. */
function StarBadge({ withBorder }: { withBorder: boolean }) {
  return (
    <div
      className="absolute flex items-center justify-center rounded-full bg-[#00ae3d] shadow-subtle"
      style={{ ...badgePos(HERO), width: 45, height: 45, border: withBorder ? '1px solid #ffd500' : undefined }}
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

/* ---------- Dark tooltip bubble ---------- */
function Bubble({ title, body, gap }: { title: string; body: string; gap: number }) {
  return (
    <div
      className="flex flex-col items-start rounded-[8px] bg-fg-primary px-[32px] py-[26px]"
      style={{ gap, boxShadow: BUBBLE_SHADOW }}
    >
      <div className="flex flex-col items-start gap-[8px]">
        <p className="text-[20px] font-semibold leading-[28px] tracking-[-0.25px] text-fg-inverse">
          {title}
        </p>
        <p className="text-[18px] font-normal leading-[26px] text-[#e4e5e0]" style={{ width: 340 }}>
          {body}
        </p>
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

function GreenButton({ label, width, onClick }: { label: ReactNode; width: number; onClick: () => void }) {
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
   The shopper's first Amazon page.
   Connie sits idle bottom-left with an unread badge; clicking it starts the coach marks.
   The page is full colour until the tour opens — the dimming IS the tour's spotlight, so it's
   the one place Connie is allowed to fade the page out.
   ================================================================ */
export function TourScreen() {
  /** `null` = Connie hasn't been opened yet. */
  const [step, setStep] = useState<number | null>(null)
  const navigate = useNavigate()
  const started = step !== null
  const skip = () => navigate(routes.insights)
  const next = () => {
    if (step === null) return
    if (step >= 2) navigate(routes.insights)
    else setStep(step + 1)
  }
  const active = Math.min(step ?? 0, 2)

  return (
    <FigmaFrame>
      <RetailBackdrop />
      {/* Spotlight scrim — only while the tour is actually running. */}
      {started && <div aria-hidden className="absolute inset-0 bg-[rgba(5,5,0,0.45)]" />}

      {/* Nudge bubble — the "click me" cue before the tour starts. */}
      {!started && (
        <div className="absolute flex items-center" style={{ left: 122, bottom: 62 }}>
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: '10px solid transparent',
              borderBottom: '10px solid transparent',
              borderRight: '10px solid #050500',
            }}
          />
          <span className="whitespace-nowrap rounded-[8px] bg-fg-primary px-[16px] py-[11px] text-[15px] font-medium text-white shadow-panel">
            👋 I've got CR's take on this page — open me
          </span>
        </div>
      )}

      {/* Step 1 & 2 — highlight the middle product card + star badge */}
      {(step === 0 || step === 1) && (
        <>
          <div
            className="absolute rounded-[8px]"
            style={{
              ...overlayBox(HERO),
              background: 'rgba(255,255,255,0.14)',
              border: '2px solid #c4e860',
            }}
          />
          <StarBadge withBorder={step === 1} />
        </>
      )}

      {/* Step 1 tooltip — beside the spotlight, arrow pointing back at it. Sitting it *below*
          collided with the Skip/Next pill. */}
      {step === 0 && (
        <div
          className="absolute flex items-center"
          style={{ left: overlayBox(HERO).left + overlayBox(HERO).width + 4, top: overlayBox(HERO).top + 70 }}
        >
          <ArrowLeft />
          <Bubble
            title="Connie stars the picks that fit you"
            body="Starred picks are based on the priorities you just set."
            gap={28}
          />
        </div>
      )}

      {/* Step 2 tooltip — below the badge, arrow up */}
      {step === 1 && (
        <div
          className="absolute flex flex-col items-start"
          style={{ left: badgePos(HERO).left - 30, top: badgePos(HERO).top + 62 }}
        >
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
        <div className="absolute flex items-center" style={{ left: 152, top: 672 }}>
          <ArrowLeft />
          <Bubble
            title="Open Connie anytime"
            body="Your panel lives on the left. Hover the C to open the menu — chat, saved, settings, help."
            gap={0}
          />
        </div>
      )}

      {started && (
        <Controls
          showSkip={step === 0 || step === 1}
          active={active}
          buttonLabel={step !== null && step <= 1 ? 'Next' : 'Got it'}
          buttonWidth={step === 1 ? 75 : 80}
          onSkip={skip}
          onNext={next}
        />
      )}

      <NaviRail
        notify={!started}
        pulse={!started}
        onLauncherClick={!started ? () => setStep(0) : undefined}
        forceOpen={step === 2}
        highlighted={step === 2}
      />
    </FigmaFrame>
  )
}
