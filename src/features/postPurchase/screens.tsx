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
      <img alt="" src={asset.bannerStar} className="size-[20px] shrink-0" />
      <p className="min-w-px flex-1 text-[16px] leading-[24px] text-[#80610f]">
        {stat
          ? `Thanks! ${stat.percent}% ${stat.statement}`
          : 'Thanks! Your input just helped 3 parents deciding right now.'}
      </p>
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
  const [q2, setQ2] = useState<string | null>(null)
  const [q3, setQ3] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  // Fetch the live check-in once (guard against StrictMode double-invoke). Baked copy shows
  // until it returns, then live message + sentiment options swap in.
  const [checkInMsg, setCheckInMsg] = useState<string | null>(null)
  const [sentiments, setSentiments] = useState<string[] | null>(null)
  const [stat, setStat] = useState<CommunityStat | null>(null)
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    callConnieCached({ message: `How's my ${LIVE_PRODUCT} working out?` })
      .then((r) => {
        if (isPostPurchase(r)) {
          setCheckInMsg(r.post_purchase.message)
          if (r.post_purchase.sentiment_options.length > 0) {
            setSentiments(r.post_purchase.sentiment_options)
          }
          setStat(r.post_purchase.community_stat)
        }
      })
      .catch(() => {
        /* keep baked content on error */
      })
  }, [])
  const sentimentChips = sentiments ?? ['Love it', "It's fine", 'Not what I hoped']

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
              onSend={() => setDraft('')}
              placeholder="Add anything in your own words…"
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

          {/* Q2 — how's it treating you? */}
          <Turn when={!!q1}>
            <ConnieGroup>
              <BotBubble>{checkInMsg ?? "How's it treating you?"}</BotBubble>
              <ChipRow>
                {[...sentimentChips, 'Other'].map((label) => (
                  <ChatChip
                    key={label}
                    label={label}
                    state={q2 === label ? 'selected' : 'default'}
                    onClick={() => setQ2(label)}
                  />
                ))}
              </ChipRow>
            </ConnieGroup>
          </Turn>
          {q2 && <UserBubble>{q2}</UserBubble>}

          {/* Q3 — what would've made it better? */}
          <Turn when={!!q2}>
            <ConnieGroup>
              <BotBubble>Love that. Quick one - what would've made it even better?</BotBubble>
              <ChipRow>
                {['Fold & portability', 'Comfort', 'Durability', 'Other'].map((label) => (
                  <ChatChip
                    key={label}
                    label={label}
                    state={q3 === label ? 'selected' : 'default'}
                    onClick={() => setQ3(label)}
                  />
                ))}
              </ChipRow>
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
