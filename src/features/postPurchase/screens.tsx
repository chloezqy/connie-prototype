import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { callConnieCached } from '@/api/connieClient'
import { isPostPurchase, type CommunityStat } from '@/types/connie-contract'
import { NaviRail } from '@/components/connie/NaviRail'
import { DimOverlay } from '@/components/connie/DimOverlay'
import {
  ChatPanel,
  ChatChip,
  ChatComposer,
  ConnieGroup,
  BotBubble,
  UserBubble,
  ChipRow,
  Turn,
} from '@/components/connie/ChatPanel'

/** The product this check-in is about — the #1 pick from Decision Support.
 *  Must be a product that exists in the CR dataset — see `backend-data/README.md`. The v5 roster
 *  is Baby Trend Passport Switch 6-in-1 / Dream On Me Aero / Graco Ready2Grow 2.0. Asking about a
 *  stroller that isn't in Chroma returns a `chat` response instead of `post_purchase`. */
const LIVE_PRODUCT = 'Baby Trend Passport Switch 6-in-1'

const asset = {
  backdrop: '/figma/pp-backdrop.png',
  product: '/figma/ds-prod-babytrend.png',
  bannerStar: '/figma/pp-banner-star.svg',
}

/** The baby-bottle page she's browsing two weeks later — full colour, like every retailer page. */
function Backdrop() {
  return (
    <div className="absolute overflow-hidden" style={{ left: -141, top: -6, width: 1656, height: 1035 }}>
      <div className="absolute inset-0 overflow-hidden">
        <img
          alt=""
          src={asset.backdrop}
          className="absolute max-w-none"
          style={{ left: '-14.65%', top: '-17.12%', width: '117.12%', height: '117.12%' }}
        />
      </div>
    </div>
  )
}

/**
 * The stroller she saved. No rank badge, no price, no retailer — she already bought it, so the
 * shopping metadata is over. All that matters is which product Connie is asking about, so the
 * name carries the card.
 */
function ProductCard() {
  return (
    <div className="flex w-full shrink-0 items-center gap-[16px] rounded-[12px] bg-bg-primary p-[12px]">
      <div className="flex size-[72px] shrink-0 items-center justify-center overflow-clip rounded-[8px] bg-bg-tertiary">
        <img alt="" src={asset.product} className="size-full rounded-[8px] object-cover" />
      </div>
      <p className="flex-1 text-[18px] font-semibold leading-[24px] tracking-[-0.25px] text-fg-primary">
        Baby Trend Passport Switch 6-in-1
      </p>
    </div>
  )
}

/** Community-impact confirmation banner. */
function ThanksBanner({ stat }: { stat?: CommunityStat | null }) {
  return (
    <div className="flex w-full shrink-0 items-center gap-[10px] overflow-clip rounded-[12px] bg-[#f2eddb] py-[13px] pl-[15px] pr-[16px]">
      <img
        alt=""
        src={asset.bannerStar}
        className="size-5 shrink-0 self-start translate-y-[2px]"
      />
      <p className="min-w-px flex-1 text-[16px] leading-[24px] text-[#80610f]">
        {stat
          ? `Thanks! ${stat.percent}% ${stat.statement}`
          : 'Thanks! Your input just helped 273 parents deciding right now.'}
      </p>
    </div>
  )
}

/**
 * "How do you like it?" answered on a 1-10 scale.
 *
 * Happiness with a purchase is a matter of degree, and three chips flattened it into a verdict.
 * The ends are labelled because a bare number line doesn't say which way is good.
 */
function HappinessScale({ value, onSelect }: { value: number | null; onSelect: (n: number) => void }) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-[8px]">
      <div className="flex w-full items-center justify-between gap-[6px]">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onSelect(n)}
            aria-label={`${n} out of 10`}
            aria-pressed={value === n}
            className={`flex size-[38px] shrink-0 items-center justify-center rounded-full text-[15px] font-semibold transition-colors ${
              value === n
                ? 'bg-brand text-fg-inverse'
                : 'border border-border-subtle bg-bg-primary text-fg-primary hover:border-border-black'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex w-full items-center justify-between">
        <span className="text-utility text-fg-secondary">1 · Not happy</span>
        <span className="text-utility text-fg-secondary">10 · Very happy</span>
      </div>
    </div>
  )
}

const HEY =
  "Hey! You're browsing baby bottles now - but you saved the Baby Trend Passport Switch two weeks ago. Did you end up buying it? 20 seconds here helps other parents like you choose."

/**
 * The post-purchase check-in.
 *
 * This is the same conversation with Connie as preference inference, two weeks later, so it is
 * literally the same components (`ChatPanel`) — same panel, header, bubbles, chips, composer, and
 * the same thinking beat before anything Connie says. The thread advances off the shopper's
 * answers rather than a step counter.
 */
export function PostPurchaseScreen() {
  // `?open=1` deep-links straight into the check-in; otherwise it starts collapsed with the
  // unread dot, which is how the shopper actually meets it.
  const [params] = useSearchParams()
  const [open, setOpen] = useState(params.get('open') === '1')
  const [q1, setQ1] = useState<string | null>(null)
  /** How happy she is, 1-10. A number, not a chip: "how do you like it" is a matter of degree. */
  const [q2, setQ2] = useState<number | null>(null)
  const [q3, setQ3] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  // Fetch the live check-in once (guard against StrictMode double-invoke). Baked copy shows
  // until it returns, then the live message swaps in.
  //
  // The payload's `sentiment_options` are deliberately ignored now: "how do you like it" is a 1-10
  // scale, so there are no sentiment chips left to fill. The backend contract is unchanged.
  const [checkInMsg, setCheckInMsg] = useState<string | null>(null)
  const [stat, setStat] = useState<CommunityStat | null>(null)
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    callConnieCached({ message: `How's my ${LIVE_PRODUCT} working out?` })
      .then((r) => {
        if (isPostPurchase(r)) {
          setCheckInMsg(r.post_purchase.message)
          setStat(r.post_purchase.community_stat)
        }
      })
      .catch(() => {
        /* keep baked content on error */
      })
  }, [])
  /** Q3 is the one open question, so the composer is its answer field while it's outstanding. */
  const awaitingQ3 = q2 !== null && !q3
  const sendDraft = () => {
    const text = draft.trim()
    if (!text) return
    if (awaitingQ3) setQ3(text)
    setDraft('')
  }

  return (
    <FigmaFrame bg="#f4f4f5">
      <Backdrop />
      {open && <DimOverlay onClick={() => setOpen(false)} />}

      {/* Collapsed, Connie carries an unread dot — the check-in is waiting. */}
      <NaviRail
        active={open ? 'chat' : undefined}
        notify={!open}
        pulse={!open}
        onLauncherClick={!open ? () => setOpen(true) : undefined}
        onChat={() => setOpen(true)}
      />

      {open && (
        <ChatPanel
          onClose={() => setOpen(false)}
          composer={
            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSend={sendDraft}
              placeholder={
                awaitingQ3
                  ? "Tell me what would've made it better…"
                  : 'Add anything in your own words…'
              }
            />
          }
        >
          {/* Q1 — did you buy it? */}
          <Turn>
            <ConnieGroup>
              <BotBubble>{HEY}</BotBubble>
              <ProductCard />
              <ChipRow>
                {['Yes - I bought it', 'Not yet', 'Bought a different one', 'Other'].map((label) => (
                  <ChatChip
                    key={label}
                    label={label}
                    state={q1 === label ? 'selected' : 'default'}
                    onClick={() => setQ1(label)}
                  />
                ))}
              </ChipRow>
            </ConnieGroup>
          </Turn>
          {q1 && <UserBubble>{q1}</UserBubble>}

          {/* Q2 — how do you like it? 1-10. */}
          <Turn when={!!q1}>
            <ConnieGroup>
              <BotBubble>{checkInMsg ?? 'How do you like it?'}</BotBubble>
              <HappinessScale value={q2} onSelect={setQ2} />
            </ConnieGroup>
          </Turn>
          {q2 !== null && <UserBubble>{q2} out of 10</UserBubble>}

          {/* Q3 — what would've made it better? Typed, not picked: the whole value of this answer
              is the thing we didn't think to put on a chip. She types it in the composer below. */}
          <Turn when={q2 !== null}>
            <ConnieGroup>
              <BotBubble>Thanks! Quick one - what would've made it even better?</BotBubble>
            </ConnieGroup>
          </Turn>
          {q3 && <UserBubble>{q3}</UserBubble>}

          {/* Thanks */}
          <Turn when={!!q3}>
            <ConnieGroup>
              <ThanksBanner stat={stat} />
            </ConnieGroup>
          </Turn>
        </ChatPanel>
      )}
    </FigmaFrame>
  )
}
