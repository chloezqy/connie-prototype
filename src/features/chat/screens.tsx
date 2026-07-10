import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { routes } from '@/app/routes'
import { callConnie } from '@/api/connieClient'
import {
  isChat,
  isDecisionSupport,
  isPriorityInference,
  isPostPurchase,
  isProductInsights,
  type ConnieResponse,
} from '@/types/connie-contract'
import { NaviRail } from '@/components/connie/NaviRail'

/* Chat 4 — Post-purchase in chat (1052:5908).
   The Figma frame is an empty placeholder, so this reproduces the "post-purchase
   in chat" view using the same Connie chat-panel design established by the
   Post-Purchase frames (1052:4834 …), showing the completed thread. */

const asset = {
  backdrop: '/figma/pp-backdrop.png',
  naviChat: '/figma/pp-navi-chat.svg',
  naviHeart: '/figma/pp-navi-heart.svg',
  naviLine: '/figma/pp-navi-line.svg',
  naviGear: '/figma/pp-navi-gear.svg',
  naviQuestion: '/figma/pp-navi-question.svg',
  vista: '/figma/pp-vista.png',
  close: '/figma/pp-header-caret.svg',
  send: '/figma/pp-send.svg',
  bannerStar: '/figma/pp-banner-star.svg',
}

function Backdrop() {
  return (
    <div className="absolute overflow-hidden" style={{ left: -141, top: -6, width: 1656, height: 1035 }}>
      <div className="absolute inset-0 overflow-hidden opacity-30">
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

function BotBubble({ children }: { children: ReactNode }) {
  return (
    <div className="w-[340px] shrink-0 overflow-clip rounded-bl-[16px] rounded-br-[16px] rounded-tl-[4px] rounded-tr-[16px] bg-bg-tertiary px-[16px] py-[13px]">
      <p className="w-full text-[16px] leading-[24px] text-fg-primary">{children}</p>
    </div>
  )
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full shrink-0 items-start justify-end overflow-clip">
      <div className="w-[260px] overflow-clip rounded-bl-[16px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[4px] bg-fg-primary px-[16px] py-[13px]">
        <p className="w-full text-[16px] font-semibold leading-[24px] text-white">{children}</p>
      </div>
    </div>
  )
}

type ChipState = 'default' | 'selected'
function Chip({ label, state = 'default' }: { label: string; state?: ChipState }) {
  const border = state === 'selected' ? 'border-2 border-border-brand' : 'border-[1.5px] border-[#d9d9db]'
  return (
    <div
      className={`flex shrink-0 items-center overflow-clip rounded-pill bg-bg-primary px-[15px] py-[9px] ${border}`}
    >
      <p className="whitespace-nowrap text-[14px] leading-[20px] text-fg-primary">{label}</p>
    </div>
  )
}

function ChipRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full shrink-0 flex-wrap content-start items-start gap-[8px] overflow-clip">
      {children}
    </div>
  )
}

function ProductCard() {
  return (
    <div className="flex shrink-0 items-start gap-[16px]">
      <div className="flex size-[80px] shrink-0 flex-col items-start justify-center overflow-clip rounded-[8px] bg-bg-tertiary">
        <img alt="" src={asset.vista} className="size-full rounded-[8px] object-cover" />
      </div>
      <div className="flex w-[236px] shrink-0 flex-col items-start gap-[4px]">
        <div className="h-[28px] w-full">
          <div className="flex items-start rounded-[4px] bg-bg-brand-muted px-[8px] py-[4px]">
            <p className="whitespace-nowrap text-[14px] leading-[20px] text-fg-brand">#1 BEST MATCH</p>
          </div>
        </div>
        <div className="w-full overflow-clip">
          <p className="w-full text-[14px] font-semibold leading-[20px] text-fg-primary">UppaBaby Vista V2</p>
        </div>
        <div className="flex h-[30px] w-full items-center gap-[9px]">
          <p className="w-[60px] text-[14px] leading-[20px] text-fg-primary">$999.00</p>
          <div className="flex items-start rounded-[4px] bg-[#fff3b3] px-[8px] py-[4px]">
            <p className="whitespace-nowrap text-[14px] leading-[20px] text-fg-secondary">AT AMAZON</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ThanksBanner() {
  return (
    <div className="flex w-full shrink-0 items-center gap-[10px] overflow-clip rounded-md bg-[#f2eddb] py-[13px] pl-[15px] pr-[16px]">
      <img alt="" src={asset.bannerStar} className="size-[20px] shrink-0" />
      <p className="min-w-px flex-1 text-[16px] leading-[24px] text-[#80610f]">
        Thanks! Your take just helped 3 parents deciding right now! Keep up the good work!
      </p>
    </div>
  )
}

const HEY =
  "Hey! You're browsing baby bottles now - but you saved the UPPAbaby Vista three weeks ago. Did you end up buying it? 20 seconds here helps other parents like you choose."

/** Renders one live Connie response into the thread, reusing the designed bubbles/chips. */
function ConnieReply({ res }: { res: ConnieResponse }) {
  if (isChat(res)) return <BotBubble>{res.chat.message}</BotBubble>

  if (isDecisionSupport(res)) {
    const d = res.decision_support
    return (
      <div className="flex w-full flex-col items-start gap-[8px]">
        <BotBubble>{d.cr_verdict ?? 'Here are the top picks, ranked:'}</BotBubble>
        <div className="flex w-[340px] flex-col gap-[6px]">
          {d.products.map((p) => (
            <div key={p.product_name} className="rounded-[8px] border border-border-subtle bg-bg-primary px-[12px] py-[9px]">
              <p className="text-[12px] font-semibold leading-[16px] text-fg-brand">{p.rank_label}</p>
              <p className="text-[14px] leading-[20px] text-fg-primary">{p.product_name}</p>
              <p className="text-[13px] leading-[18px] text-fg-secondary">
                {p.price}
                {p.retailer ? ` · ${p.retailer}` : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isProductInsights(res)) {
    const pi = res.product_insights
    return (
      <div className="flex w-full flex-col items-start gap-[8px]">
        <BotBubble>{`${pi.product_name} — ${pi.verdict === 'recommended' ? 'Recommended' : 'Not recommended'}. Here's what stands out:`}</BotBubble>
        <div className="flex w-[340px] flex-col gap-[6px]">
          {pi.insights.map((ins, i) => (
            <div key={i} className="rounded-[8px] border border-border-subtle bg-bg-primary px-[12px] py-[9px]">
              <p className="text-[14px] font-semibold leading-[20px] text-fg-primary">{ins.label}</p>
              <p className="text-[13px] leading-[18px] text-fg-secondary">{ins.summary}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isPriorityInference(res)) {
    const p = res.priority_inference
    return (
      <div className="flex w-full flex-col items-start gap-[8px]">
        <BotBubble>{p.message}</BotBubble>
        {p.suggested_priorities.length > 0 && (
          <ChipRow>
            {p.suggested_priorities.map((s) => (
              <Chip key={s} label={s} />
            ))}
          </ChipRow>
        )}
      </div>
    )
  }

  if (isPostPurchase(res)) {
    const pp = res.post_purchase
    return (
      <div className="flex w-full flex-col items-start gap-[8px]">
        <BotBubble>{pp.message}</BotBubble>
        {pp.sentiment_options.length > 0 && (
          <ChipRow>
            {pp.sentiment_options.map((s) => (
              <Chip key={s} label={s} />
            ))}
          </ChipRow>
        )}
        {pp.community_stat && <BotBubble>{`${pp.community_stat.percent}% ${pp.community_stat.statement}`}</BotBubble>}
      </div>
    )
  }

  return <BotBubble>I've noted that — open the annotations view for the on-page details.</BotBubble>
}

/** Connie chat tab — a live, interactive conversation with the Connie backend. */
export function ChatScreen() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<{ id: number; node: ReactNode }[]>(() => [
    {
      id: 0,
      node: (
        <BotBubble>
          Hi! I'm Connie. Ask me about any stroller, tell me your priorities, or say "rank these strollers for me."
        </BotBubble>
      ),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const idRef = useRef(1)
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setMessages((m) => [...m, { id: idRef.current++, node: <UserBubble>{text}</UserBubble> }])
    setInput('')
    setLoading(true)
    try {
      const res = await callConnie({ message: text })
      setMessages((m) => [...m, { id: idRef.current++, node: <ConnieReply res={res} /> }])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error'
      setMessages((m) => [
        ...m,
        { id: idRef.current++, node: <BotBubble>Sorry — I couldn't reach Connie just now. ({msg})</BotBubble> },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <FigmaFrame bg="#f1f1f2">
      <Backdrop />
      <NaviRail active="chat" />

      <div
        className="absolute flex flex-col items-start overflow-clip rounded-md border border-border-subtle bg-bg-primary p-[36px] shadow-panel"
        style={{ left: 885, top: 50, width: 520, height: 800 }}
      >
        {/* Header */}
        <div className="flex w-full shrink-0 items-center gap-[10px] overflow-clip px-[20px] py-[18px]">
          <div className="relative size-[34px] shrink-0 overflow-clip rounded-[8px] bg-fg-primary">
            <span className="absolute left-[10px] top-[6px] whitespace-nowrap text-[18px] font-semibold leading-[22px] tracking-[-0.25px] text-white">
              C
            </span>
          </div>
          <div className="flex min-w-px flex-1 flex-col items-start overflow-clip whitespace-nowrap">
            <p className="text-[16px] font-semibold leading-[24px] text-fg-primary">Connie</p>
            <p className="text-[14px] leading-[20px] text-fg-secondary">Consumer Reports</p>
          </div>
          <button
            aria-label="Close"
            onClick={() => navigate(routes.postPurchase)}
            className="relative size-[20px] shrink-0"
          >
            <img alt="" src={asset.close} className="absolute inset-0 block size-full" />
          </button>
        </div>
        <div className="h-px w-full shrink-0 bg-border-subtle" />

        {/* Thread */}
        <div
          ref={threadRef}
          className="flex min-h-px w-full flex-1 flex-col items-start gap-[14px] overflow-y-auto overflow-x-clip p-[20px]"
        >
          {messages.map((m) => (
            <div key={m.id} className="w-full">
              {m.node}
            </div>
          ))}
          {loading && <BotBubble>Connie is thinking…</BotBubble>}
        </div>

        {/* Composer — real input */}
        <div className="w-full shrink-0 px-[20px] pb-[4px] pt-[8px]">
          <div className="flex w-full items-center gap-[10px] overflow-clip rounded-pill bg-bg-secondary py-[10px] pl-[18px] pr-[10px]">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void send()
              }}
              placeholder="Ask Connie anything…"
              className="min-w-px flex-1 bg-transparent text-[16px] leading-[24px] text-fg-primary outline-none placeholder:text-fg-secondary"
            />
            <button
              onClick={() => void send()}
              disabled={loading}
              aria-label="Send"
              className="relative size-[40px] shrink-0 overflow-clip rounded-pill bg-fg-primary disabled:opacity-50"
            >
              <img alt="" src={asset.send} className="absolute left-[10px] top-[10px] size-[20px]" />
            </button>
          </div>
        </div>
      </div>
    </FigmaFrame>
  )
}
