import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { ProductBackdrop } from '@/components/connie/RetailBackdrop'
import { DimOverlay } from '@/components/connie/DimOverlay'
import {
  ChatPanel,
  ChatChip,
  ChatComposer,
  ConnieGroup,
  BotBubble,
  ChipRow,
  Turn,
} from '@/components/connie/ChatPanel'
import { routes } from '@/app/routes'
import { callConnieCached } from '@/api/connieClient'
import { isPriorityInference } from '@/types/connie-contract'
import { NaviRail } from '@/components/connie/NaviRail'

const DEFAULT_PRIORITIES = ['Safety', 'Durability', 'Easy Fold', 'Lightweight']

/* ---------- Priority Inference asset paths (public/figma, prefix "prio-") ---------- */
const asset = {
  softStar: '/figma/prio-softstar.svg',
  btnArrow: '/figma/prio-ic-btnarrow.svg',
  chevron: '/figma/prio-ic-chevron.svg',
  compass: '/figma/prio-ic-compass.svg',
  lightning: '/figma/prio-ic-lightning.svg',
  // priority icons — dark (plain rows)
  safety: '/figma/prio-ic-safety.svg',
  durability: '/figma/prio-ic-durability.svg',
  easyFold: '/figma/prio-ic-easyfold.svg',
  lightweight: '/figma/prio-ic-lightweight.svg',
  // priority icons — white (on the green "raised" rows)
  easyFoldW: '/figma/prio-ic-easyfold-w.svg',
  lightweightW: '/figma/prio-ic-lightweight-w.svg',
  // chip icons
  chipElevator: '/figma/prio-ic-chip-elevator.svg',
  chipNoElevator: '/figma/prio-ic-chip-noelevator.svg',
  chipHouse: '/figma/prio-ic-chip-house.svg',
}

/* ---------- Priority list ---------- */

/** Icon + sizing per priority label (live suggested_priorities map to these). */
const PRIO_ICON: Record<string, { icon: string; white: string; w: number; h: number }> = {
  Safety: { icon: asset.safety, white: asset.safety, w: 16, h: 20 },
  Durability: { icon: asset.durability, white: asset.durability, w: 19.95, h: 21 },
  'Easy Fold': { icon: asset.easyFold, white: asset.easyFoldW, w: 21.95, h: 21.95 },
  Lightweight: { icon: asset.lightweight, white: asset.lightweightW, w: 19.8, h: 19.8 },
}

/**
 * One priority Connie is weighing.
 *
 * This used to be a bordered, numbered card in a 2×2 grid, which read as a set of buttons you
 * were supposed to press and rank. It isn't — it's Connie telling you what it's currently
 * weighing. So: a plain list row, icon + label, no box and no rank number. `raised` marks the
 * ones Connie has just moved up, which is the only state worth calling out.
 */
function PriorityRow({ label, raised = false }: { label: string; raised?: boolean }) {
  const m = PRIO_ICON[label] ?? { icon: asset.safety, white: asset.safety, w: 16, h: 20 }
  return (
    <div className="flex w-full items-center gap-[12px] py-[7px]">
      <div
        className={`flex size-[36px] shrink-0 items-center justify-center rounded-full ${
          raised ? 'bg-bg-brand' : 'bg-bg-tertiary'
        }`}
      >
        <img src={raised ? m.white : m.icon} alt="" style={{ width: m.w, height: m.h }} />
      </div>
      <p
        className={`flex-1 text-[15px] leading-[22px] ${
          raised ? 'font-semibold text-fg-brand' : 'text-fg-primary'
        }`}
      >
        {label}
      </p>
      {raised && (
        <div className="relative flex size-[22px] shrink-0 items-center justify-center">
          <img src={asset.softStar} alt="" className="size-[18px]" />
        </div>
      )}
    </div>
  )
}

function PriorityList({ priorities, raised = [] }: { priorities: string[]; raised?: string[] }) {
  return (
    <div className="flex w-full shrink-0 flex-col rounded-[12px] bg-bg-primary px-[16px] py-[8px]">
      {priorities.map((p) => (
        <PriorityRow key={p} label={p} raised={raised.includes(p)} />
      ))}
    </div>
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

/* ---------- Screen ---------- */

export function PriorityInferenceScreen() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const raw = parseInt(params.get('step') || '1', 10)
  const initial = Number.isNaN(raw) ? 1 : Math.min(8, Math.max(1, raw))
  const [step, setStep] = useState(initial)
  const [draft, setDraft] = useState('')

  /**
   * Which of Connie's turns have finished loading. Each turn's `when` is gated on the previous
   * turn being done, so the thread loads one bubble at a time — Connie answers, *then* asks the
   * next question, the way a conversation actually goes.
   */
  const [said, setSaid] = useState<Record<string, boolean>>({})
  const mark = (k: string) => () => setSaid((s) => (s[k] ? s : { ...s, [k]: true }))

  // Fetch Connie's inferred starting priorities once (guard against StrictMode double-invoke).
  const [liveIntro, setLiveIntro] = useState<string | null>(null)
  const [livePriorities, setLivePriorities] = useState<string[] | null>(null)
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    callConnieCached({ message: "I'm not sure what matters most to me in a stroller" })
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

  /** The suggested actions now live in the composer's placeholder, not in a row of pills. */
  const placeholder =
    step >= 7
      ? 'Reorder priorities, add another, or ask Connie anything…'
      : step >= 4
        ? 'None of these? Tell me about your commute.'
        : step >= 2
          ? 'None of these? Tell me about your living situation.'
          : 'Ask Connie anything…'

  // Which answer the user picked for each question (drives the chip highlight).
  const [chosenLiving, setChosenLiving] = useState<string | null>(
    initial >= 4 ? 'Apartment without elevator' : null,
  )
  const [chosenCommute, setChosenCommute] = useState<string | null>(
    initial >= 7 ? 'Mostly public transit' : null,
  )
  const answerLiving = (label: string) => {
    setChosenLiving(label)
    go(4)
  }
  const answerCommute = (label: string) => {
    setChosenCommute(label)
    go(7)
  }

  return (
    <FigmaFrame>
      {/* The product page she came from, at full colour, unchanged from here on. */}
      <ProductBackdrop />
      <DimOverlay onClick={() => navigate(routes.annotations)} />

      <ChatPanel
        onClose={() => navigate(routes.annotations)}
        composer={
          <ChatComposer value={draft} onChange={setDraft} onSend={() => setDraft('')} placeholder={placeholder} />
        }
      >
        {step === 1 ? (
          <Turn key="start" when>
            <ConnieGroup>
              <BotBubble>
                Shopping for a stroller? I can figure out what fits your life or take you straight to
                the top picks.
              </BotBubble>
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
            </ConnieGroup>
          </Turn>
        ) : (
          <>
            <Turn key="intro" when onDone={mark('intro')}>
              <ConnieGroup>
                <BotBubble>
                  {liveIntro ??
                    "Since you're shopping for a stroller, I've started with the priorities most parents care about. These are just a starting point — I'll tailor them to your situation."}
                </BotBubble>
                <PriorityList priorities={priorities} />
              </ConnieGroup>
            </Turn>

            <Turn key="living" when={!!said.intro} onDone={mark('living')}>
              <ConnieGroup>
                <BotBubble>
                  To help narrow the best options, do you live in an apartment or a house?
                </BotBubble>
                <ChipRow>
                  <ChatChip
                    label="Apartment with elevator"
                    icon={<img src={asset.chipElevator} alt="" className="size-[14px]" />}
                    state={chosenLiving === 'Apartment with elevator' ? 'selected' : 'default'}
                    onClick={() => answerLiving('Apartment with elevator')}
                  />
                  <ChatChip
                    label="Apartment without elevator"
                    icon={<img src={asset.chipNoElevator} alt="" className="size-[14px]" />}
                    state={chosenLiving === 'Apartment without elevator' ? 'selected' : 'default'}
                    onClick={() => answerLiving('Apartment without elevator')}
                  />
                  <ChatChip
                    label="House"
                    icon={<img src={asset.chipHouse} alt="" className="size-[14px]" />}
                    state={chosenLiving === 'House' ? 'selected' : 'default'}
                    onClick={() => answerLiving('House')}
                  />
                </ChipRow>
              </ConnieGroup>
            </Turn>

            <Turn key="lightweight" when={step >= 4 && !!said.living} onDone={mark('lightweight')}>
              <ConnieGroup>
                <BotBubble>
                  Good to know! Since you'll be carrying your stroller up stairs, we'll prioritize
                  lightweight options.
                </BotBubble>
                <PriorityList
                  priorities={['Lightweight', 'Safety', 'Easy Fold', 'Durability']}
                  raised={['Lightweight']}
                />
              </ConnieGroup>
            </Turn>

            <Turn key="commute" when={step >= 4 && !!said.lightweight} onDone={mark('commute')}>
              <ConnieGroup>
                <BotBubble>Which best describes how you'll usually travel with your stroller?</BotBubble>
                <ChipRow>
                  {['Mostly by car', 'Mostly public transit', 'Mostly walking'].map((label) => (
                    <ChatChip
                      key={label}
                      label={label}
                      state={chosenCommute === label ? 'selected' : 'default'}
                      onClick={() => answerCommute(label)}
                    />
                  ))}
                </ChipRow>
              </ConnieGroup>
            </Turn>

            <Turn key="fold" when={step >= 7 && !!said.commute} onDone={mark('fold')}>
              <ConnieGroup>
                <BotBubble>
                  Got it! We'll prioritize strollers that are lightweight and easy to fold for trips
                  on public transit.
                </BotBubble>
                <PriorityList
                  priorities={['Easy Fold', 'Lightweight', 'Safety', 'Durability']}
                  raised={['Easy Fold', 'Lightweight']}
                />
              </ConnieGroup>
            </Turn>

            <Turn key="matches" when={step >= 7 && !!said.fold}>
              <ConnieGroup>
                <BotBubble>
                  <>
                    Thanks! Based on your answers, we've increased the priority of{' '}
                    <span className="font-semibold">Easy Fold</span> and{' '}
                    <span className="font-semibold">Lightweight</span> while still considering all
                    four priorities in your recommendations. This narrows your matches from 24
                    highly rated strollers to 11. You can reorder or add priorities anytime.
                  </>
                </BotBubble>
                <button
                  onClick={() => navigate(routes.decision)}
                  className="flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[24px] bg-brand"
                >
                  <span className="text-[16px] font-semibold leading-[24px] text-fg-inverse">
                    Find my best matches
                  </span>
                  <img src={asset.btnArrow} alt="" className="size-[16px]" />
                </button>
              </ConnieGroup>
            </Turn>
          </>
        )}
      </ChatPanel>

      <NaviRail active="chat" />
    </FigmaFrame>
  )
}
