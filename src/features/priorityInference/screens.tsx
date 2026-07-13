import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { RetailBackdrop } from '@/components/connie/RetailBackdrop'
import { routes } from '@/app/routes'
import { callConnie } from '@/api/connieClient'
import { isPriorityInference } from '@/types/connie-contract'
import { NaviRail } from '@/components/connie/NaviRail'

const DEFAULT_PRIORITIES = ['Safety', 'Durability', 'Easy Fold', 'Lightweight']

/* Shared Amazon browse backdrop (dimmed 40% over white — matches Figma "Amazon bg"). */
const bg = '/figma/prio-amazon-bg.png'

/* ---------- Priority Inference asset paths (public/figma, prefix "prio-") ---------- */
const asset = {
  amazonBg: bg,
  close: '/figma/prio-ic-close.svg',
  send: '/figma/prio-ic-send.svg',
  softStar: '/figma/prio-softstar.svg',
  btnArrow: '/figma/prio-ic-btnarrow.svg',
  chevron: '/figma/prio-ic-chevron.svg',
  compass: '/figma/prio-ic-compass.svg',
  lightning: '/figma/prio-ic-lightning.svg',
  // bento icons — dark (plain cards)
  safety: '/figma/prio-ic-safety.svg',
  durability: '/figma/prio-ic-durability.svg',
  easyFold: '/figma/prio-ic-easyfold.svg',
  lightweight: '/figma/prio-ic-lightweight.svg',
  // bento icons — white (green highlighted cards)
  easyFoldW: '/figma/prio-ic-easyfold-w.svg',
  lightweightW: '/figma/prio-ic-lightweight-w.svg',
  // chip icons
  chipElevator: '/figma/prio-ic-chip-elevator.svg',
  chipNoElevator: '/figma/prio-ic-chip-noelevator.svg',
  chipHouse: '/figma/prio-ic-chip-house.svg',
  // navi bar
  navChat: '/figma/prio-nav-chat.svg',
  navHeart: '/figma/prio-nav-heart.svg',
  navLine: '/figma/prio-nav-line.svg',
  navGear: '/figma/prio-nav-gear.svg',
  navQuestion: '/figma/prio-nav-question.svg',
}

/* ---------- Shared primitives ---------- */

/** Connie "C" avatar (32px black circle). */
function Avatar() {
  return (
    <div className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-fg-primary">
      <span className="text-[12px] font-semibold leading-[16px] text-fg-inverse">C</span>
    </div>
  )
}

/** A chat message group: avatar + 402px content column (gap 16). */
function Group({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full shrink-0 items-start gap-[12px]">
      <Avatar />
      <div className="flex w-[402px] flex-col items-start gap-[16px]">{children}</div>
    </div>
  )
}

/** Connie speech bubble (tertiary, tail on top-left). */
function Bubble({ children }: { children: ReactNode }) {
  return (
    <div className="w-full shrink-0 rounded-bl-[12px] rounded-br-[12px] rounded-tr-[12px] bg-bg-tertiary p-[16px]">
      <p className="text-[16px] leading-[24px] text-fg-primary">{children}</p>
    </div>
  )
}

/** "Connie is thinking…" — animated three-dot bubble shown after a selection. */
function ThinkingBubble() {
  return (
    <div className="flex shrink-0 items-center gap-[8px] rounded-bl-[12px] rounded-br-[12px] rounded-tr-[12px] bg-bg-tertiary px-[16px] py-[18px]">
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

type CardTone = 'plain' | 'strong' | 'green'

/** A single priority bento card. */
function BentoCard({
  n,
  label,
  icon,
  iconW,
  iconH,
  subtitle,
  tone,
  pad = 14,
}: {
  n: number
  label: string
  icon: string
  iconW: number
  iconH: number
  subtitle?: string
  tone: CardTone
  pad?: number
}) {
  const green = tone === 'green'
  const border =
    tone === 'green'
      ? 'border-2 border-border-brand'
      : tone === 'strong'
        ? 'border-2 border-border-black'
        : 'border border-border-subtle'
  return (
    <div
      className={`relative flex flex-col items-start rounded-[12px] ${green ? 'bg-bg-brand-muted' : 'bg-bg-primary'} ${border}`}
      style={{ padding: pad }}
    >
      {green && (
        <div className="absolute left-[147px] top-[-2px] flex h-[47.6px] w-[45.6px] items-center justify-center">
          <div className="rotate-[-11.14deg]">
            <img src={asset.softStar} alt="" className="h-[40.97px] w-[38.38px]" />
          </div>
        </div>
      )}
      <div className="relative flex w-full flex-col items-center gap-[8px]">
        <div
          className={`flex size-[40px] items-center justify-center rounded-full ${green ? 'bg-bg-brand' : 'bg-bg-tertiary'}`}
        >
          <img src={icon} alt="" style={{ width: iconW, height: iconH }} />
        </div>
        <p className="text-center text-[12px] font-semibold leading-[16px] tracking-[0.24px] text-fg-primary">
          {label}
        </p>
        {subtitle && (
          <p className="w-full text-center text-[9px] leading-[13.5px] text-fg-brand">{subtitle}</p>
        )}
        <div className="absolute left-[-4px] top-[-4px] flex size-[20px] items-center justify-center rounded-full border border-border-subtle bg-bg-tertiary p-px">
          <span className="text-[10px] font-bold leading-[15px] text-fg-primary">{n}</span>
        </div>
      </div>
    </div>
  )
}

/** 2×2 bento grid wrapper. */
function Bento({ children }: { children: ReactNode }) {
  return <div className="grid w-full shrink-0 grid-cols-2 items-start gap-[12px]">{children}</div>
}

/** A selectable option chip in a Connie question. */
function Chip({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string
  icon?: string
  selected?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-[8px] border p-[17px] text-left ${
        selected ? 'border-border-brand bg-bg-brand' : 'border-border-subtle bg-bg-primary'
      }`}
    >
      <span
        className={`text-[12px] font-semibold leading-[16px] ${selected ? 'text-fg-inverse' : 'text-fg-primary'}`}
      >
        {label}
      </span>
      {icon && (
        <img
          src={icon}
          alt=""
          className={`size-[13.5px] ${selected ? '[filter:brightness(0)_invert(1)]' : ''}`}
        />
      )}
    </button>
  )
}

/** Big starting-screen choice card (icon tile + title + subtitle + chevron). */
function ChoiceCard({
  icon,
  iconBg,
  title,
  sub,
  onClick,
}: {
  icon: string
  iconBg: string
  title: string
  sub: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-[14px] overflow-clip rounded-[16px] border-[1.5px] border-[#e0e0e5] bg-bg-primary p-[16px] text-left"
    >
      <div
        className="flex size-[44px] shrink-0 items-center justify-center rounded-[8px]"
        style={{ background: iconBg }}
      >
        <img src={icon} alt="" className="size-[24px]" />
      </div>
      <div className="flex flex-1 flex-col gap-[3px] overflow-clip">
        <p className="text-[16px] font-semibold leading-[24px] text-fg-primary">{title}</p>
        <p className="text-[14px] leading-[20px] text-fg-secondary">{sub}</p>
      </div>
      <img src={asset.chevron} alt="" className="size-[20px]" />
    </button>
  )
}

/* ---------- Bento states ---------- */

/** Icon + sizing per priority label (live suggested_priorities map to these). */
const PRIO_ICON: Record<string, { icon: string; w: number; h: number }> = {
  Safety: { icon: asset.safety, w: 16, h: 20 },
  Durability: { icon: asset.durability, w: 19.95, h: 21 },
  'Easy Fold': { icon: asset.easyFold, w: 21.95, h: 21.95 },
  Lightweight: { icon: asset.lightweight, w: 19.8, h: 19.8 },
}

function BentoA({ priorities }: { priorities: string[] }) {
  return (
    <Bento>
      {priorities.map((label, i) => {
        const m = PRIO_ICON[label] ?? { icon: asset.safety, w: 16, h: 20 }
        return (
          <BentoCard
            key={label}
            n={i + 1}
            label={label}
            icon={m.icon}
            iconW={m.w}
            iconH={m.h}
            tone="plain"
            pad={13}
          />
        )
      })}
    </Bento>
  )
}

function BentoB() {
  return (
    <Bento>
      <BentoCard n={1} label="Lightweight" icon={asset.lightweightW} iconW={19.8} iconH={19.8} tone="green" subtitle="More important for your lifestyle" />
      <BentoCard n={2} label="Safety" icon={asset.safety} iconW={16} iconH={20} tone="strong" />
      <BentoCard n={3} label="Easy Fold" icon={asset.easyFold} iconW={21.95} iconH={21.95} tone="strong" />
      <BentoCard n={4} label="Durability" icon={asset.durability} iconW={19.95} iconH={21} tone="strong" />
    </Bento>
  )
}

function BentoC() {
  return (
    <Bento>
      <BentoCard n={1} label="Easy Fold" icon={asset.easyFoldW} iconW={21.95} iconH={21.95} tone="green" subtitle="Recommended based on your commute" />
      <BentoCard n={2} label="Lightweight" icon={asset.lightweightW} iconW={19.8} iconH={19.8} tone="green" subtitle="More important for your lifestyle" />
      <BentoCard n={3} label="Safety" icon={asset.safety} iconW={16} iconH={20} tone="strong" />
      <BentoCard n={4} label="Durability" icon={asset.durability} iconW={19.95} iconH={21} tone="strong" />
    </Bento>
  )
}

/* ---------- Screen ---------- */

export function PriorityInferenceScreen() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const raw = parseInt(params.get('step') || '1', 10)
  const initial = Number.isNaN(raw) ? 1 : Math.min(8, Math.max(1, raw))
  const [step, setStep] = useState(initial)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch Connie's inferred starting priorities once (guard against StrictMode double-invoke).
  const [liveIntro, setLiveIntro] = useState<string | null>(null)
  const [livePriorities, setLivePriorities] = useState<string[] | null>(null)
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    callConnie({ message: "I'm not sure what matters most to me in a stroller" })
      .then((r) => {
        if (isPriorityInference(r)) {
          setLiveIntro(r.priority_inference.message)
          if (r.priority_inference.suggested_priorities.length > 0) {
            setLivePriorities(r.priority_inference.suggested_priorities)
          }
        }
      })
      .catch(() => {
        /* keep baked content on error */
      })
  }, [])
  const priorities = livePriorities ?? DEFAULT_PRIORITIES

  const go = (n: number) => {
    const c = Math.min(8, Math.max(1, n))
    setStep(c)
    setParams({ step: String(c) }, { replace: true })
  }

  // After a selection, show a "thinking…" bubble for ~5s before revealing the next content.
  const [thinking, setThinking] = useState(false)

  // Chat auto-scrolls to the newest content (matches each Figma scroll position).
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [step, thinking])

  const placeholder =
    step >= 7
      ? 'Ask Connie...'
      : step >= 4
        ? 'None of these? Tell me about your commute.'
        : step >= 2
          ? 'None of these? Tell me about your living situation.'
          : 'Ask Connie anything...'

  // Which answer the user picked for each question (drives the chip highlight).
  const [chosenLiving, setChosenLiving] = useState<string | null>(
    initial >= 4 ? 'Apartment without elevator' : null,
  )
  const [chosenCommute, setChosenCommute] = useState<string | null>(
    initial >= 7 ? 'Mostly public transit' : null,
  )
  // On selection: highlight the chip immediately, show the thinking bubble, then reveal next.
  const timerRef = useRef<number | null>(null)
  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current) }, [])
  const answerAfter = (n: number) => {
    setThinking(true)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setThinking(false)
      go(n)
    }, 5000)
  }
  const answerLiving = (label: string) => {
    setChosenLiving(label)
    answerAfter(4)
  }
  const answerCommute = (label: string) => {
    setChosenCommute(label)
    answerAfter(7)
  }

  return (
    <FigmaFrame>
      <RetailBackdrop />
      {/* Aside — Floating Bubble Panel (right, 16px inset, full height) */}
      <div
        className="absolute flex flex-col items-start overflow-clip rounded-[16px] border border-border-subtle bg-bg-secondary p-px shadow-panel"
        style={{ right: 16, top: 16, width: 520, height: 868 }}
      >
        {/* Brand Header */}
        <div className="flex w-full shrink-0 items-center justify-between border-b border-border-subtle bg-bg-secondary px-[24px] pb-[9px] pt-[8px]">
          <p className="text-[16px] font-semibold leading-[24px] text-fg-primary">Connie</p>
          <button
            aria-label="Close"
            onClick={() => navigate(routes.insights)}
            className="flex size-[40px] items-center justify-center rounded-full"
          >
            <img src={asset.close} alt="" className="size-[14px]" />
          </button>
        </div>

        {/* Main Content Area — scrollable chat */}
        <div
          ref={scrollRef}
          className="flex min-h-0 w-full flex-1 flex-col items-start gap-[30px] overflow-auto bg-bg-secondary px-[36px] pb-[24px] pt-[20px]"
        >
          {step === 1 ? (
            <Group>
              <Bubble>
                Shopping for a stroller? I can figure out what fits your life or take you straight to
                the top picks.
              </Bubble>
              <ChoiceCard
                icon={asset.compass}
                iconBg="#daede0"
                title="Help me figure it out"
                sub="A few quick questions about your setup"
                onClick={() => go(2)}
              />
              <ChoiceCard
                icon={asset.lightning}
                iconBg="#f2eddb"
                title="Show me the top 5 now"
                sub="Connie's best picks, ranked"
                onClick={() => navigate(routes.decision)}
              />
            </Group>
          ) : (
            <>
              <Group>
                <Bubble>
                  {liveIntro ??
                    "Since you're shopping for a stroller, I've started with the priorities most parents care about. These are just a starting point — I'll tailor them to your situation."}
                </Bubble>
                <BentoA priorities={priorities} />
              </Group>

              <Group>
                <Bubble>
                  To help narrow the best options, do you live in an apartment or a house?
                </Bubble>
                <div className="flex w-full flex-col items-start gap-[8px]">
                  <Chip
                    label="Apartment with elevator"
                    icon={asset.chipElevator}
                    selected={chosenLiving === 'Apartment with elevator'}
                    onClick={() => answerLiving('Apartment with elevator')}
                  />
                  <Chip
                    label="Apartment without elevator"
                    icon={asset.chipNoElevator}
                    selected={chosenLiving === 'Apartment without elevator'}
                    onClick={() => answerLiving('Apartment without elevator')}
                  />
                  <Chip
                    label="House"
                    icon={asset.chipHouse}
                    selected={chosenLiving === 'House'}
                    onClick={() => answerLiving('House')}
                  />
                </div>
              </Group>

              {step >= 4 && (
                <Group>
                  <Bubble>
                    Good to know! Since you'll be carrying your stroller up stairs, we'll prioritize
                    lightweight options.
                  </Bubble>
                  <BentoB />
                </Group>
              )}

              {step >= 4 && (
                <Group>
                  <Bubble>
                    Which best describes how you'll usually travel with your stroller?
                  </Bubble>
                  <div className="flex w-full flex-col items-start gap-[8px]">
                    <Chip
                      label="Mostly by car"
                      selected={chosenCommute === 'Mostly by car'}
                      onClick={() => answerCommute('Mostly by car')}
                    />
                    <Chip
                      label="Mostly public transit"
                      selected={chosenCommute === 'Mostly public transit'}
                      onClick={() => answerCommute('Mostly public transit')}
                    />
                    <Chip
                      label="Mostly walking"
                      selected={chosenCommute === 'Mostly walking'}
                      onClick={() => answerCommute('Mostly walking')}
                    />
                  </div>
                </Group>
              )}

              {step >= 7 && (
                <Group>
                  <Bubble>
                    Got it! We'll prioritize strollers that are lightweight and easy to fold for
                    trips on public transit.
                  </Bubble>
                  <BentoC />
                </Group>
              )}

              {step >= 7 && (
                <Group>
                  <Bubble>
                    <>
                      Thanks! Based on your answers, we've increased the priority of{' '}
                      <span className="font-semibold">Easy Fold</span> and{' '}
                      <span className="font-semibold">Lightweight</span> while still considering all
                      four priorities in your recommendations. This narrows your matches from 24
                      highly rated strollers to 11. You can reorder or add priorities anytime.
                    </>
                  </Bubble>
                  <button
                    onClick={() => navigate(routes.decision)}
                    className="flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[24px] bg-bg-brand"
                  >
                    <span className="text-[16px] leading-[24px] text-fg-inverse">
                      Find my best matches
                    </span>
                    <img src={asset.btnArrow} alt="" className="size-[16px]" />
                  </button>
                </Group>
              )}

              {thinking && (
                <Group>
                  <ThinkingBubble />
                </Group>
              )}
            </>
          )}
        </div>

        {/* Suggested-action pills (final step only) */}
        {step >= 7 && (
          <div className="flex h-[57px] w-full shrink-0 flex-wrap content-start items-start gap-[9px] overflow-clip pl-[16px]">
            <div className="flex items-center justify-center overflow-clip rounded-[999px] border-[1.5px] border-fg-secondary bg-white px-[18px] py-[11px]">
              <span className="whitespace-nowrap text-[16px] leading-[24px] text-fg-primary">
                Reorder priorities
              </span>
            </div>
            <div className="flex items-center justify-center overflow-clip rounded-[999px] border-[1.5px] border-fg-secondary bg-white px-[18px] py-[11px]">
              <span className="whitespace-nowrap text-[16px] leading-[24px] text-fg-primary">
                Add another priority
              </span>
            </div>
          </div>
        )}

        {/* Footer — Bottom Chat Input */}
        <div className="w-full shrink-0 border-t border-border-subtle bg-bg-primary px-[16px] pb-[20px] pt-[21px]">
          <div className="relative w-full">
            <div className="flex w-full flex-col items-start overflow-clip rounded-[8px] border border-border-subtle bg-bg-secondary px-[17px] pb-[15px] pt-[14px]">
              <p className="text-[14px] leading-[20px] text-fg-secondary">{placeholder}</p>
            </div>
            <div className="absolute right-[8px] top-[7px] flex size-[31px] items-center justify-center rounded-[8px] bg-fg-primary p-[8px] opacity-90">
              <img src={asset.send} alt="" className="h-[9.333px] w-[11.083px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Navi bar launcher */}
      <NaviRail active="chat" />

      {/* Step controls (prototype) */}
      <div className="absolute bottom-[16px] left-[16px] z-10 flex items-center gap-[8px]">
        <button
          onClick={() => go(step - 1)}
          className="flex size-[32px] items-center justify-center rounded-full border border-border-subtle bg-white/90 text-fg-primary shadow-subtle"
        >
          ‹
        </button>
        <span className="text-[12px] text-fg-secondary">{step} / 8</span>
        <button
          onClick={() => go(step + 1)}
          className="flex size-[32px] items-center justify-center rounded-full border border-border-subtle bg-white/90 text-fg-primary shadow-subtle"
        >
          ›
        </button>
      </div>
    </FigmaFrame>
  )
}
