import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { routes } from '@/app/routes'
import { callConnie, type ChatTurn } from '@/api/connieClient'
import { usePreferences, preferencesToPriorities } from '@/store/usePreferences'
import {
  isChat,
  isDecisionSupport,
  isPriorityInference,
  isPostPurchase,
  isProductInsights,
  type ConnieResponse,
} from '@/types/connie-contract'
import { NaviRail } from '@/components/connie/NaviRail'
import { ProductBackdrop } from '@/components/connie/RetailBackdrop'
import { DimOverlay } from '@/components/connie/DimOverlay'
import {
  ChatPanel,
  ChatChip,
  ChatComposer,
  ConnieGroup,
  BotBubble,
  UserBubble,
  ThinkingBubble,
  ChipRow,
} from '@/components/connie/ChatPanel'

/* Connie chat — a live, interactive conversation with the Connie backend.
   Uses the shared ChatPanel kit, so it's the same interface as preference inference and the
   post-purchase check-in. */

/**
 * Flatten a Connie response into one line of plain text for the conversation history.
 *
 * The agent is stateless, so follow-ups only work if we hand its own last answer back to it. But we
 * must NOT hand back the raw JSON payload: it's huge (a decision_support blob is thousands of
 * tokens), and a history full of JSON confuses the prompt's CLASSIFICATION GUARD into thinking the
 * next turn is another structured request. A short summary carries the referents ("the cheaper
 * one", "it") without either problem.
 */
function summarizeForHistory(res: ConnieResponse): string {
  if (isChat(res)) return res.chat.message
  if (isDecisionSupport(res)) {
    const d = res.decision_support
    const ranked = d.products
      .map((p) => `${p.rank_label} ${p.product_name} (${p.price})`)
      .join('; ')
    return `Ranked the strollers: ${ranked}.${d.cr_verdict ? ` Verdict: ${d.cr_verdict}` : ''}`
  }
  if (isProductInsights(res)) {
    const pi = res.product_insights
    const labels = pi.insights.map((i) => i.label).join(', ')
    return `Gave insights on the ${pi.product_name} (${pi.verdict}): ${labels}.`
  }
  if (isPriorityInference(res)) {
    const p = res.priority_inference
    return `${p.message} Suggested priorities: ${p.suggested_priorities.join(', ')}.`
  }
  if (isPostPurchase(res)) return res.post_purchase.message
  return 'Annotated the claims on the product page.'
}

/** Renders one live Connie response into the thread, reusing the designed bubbles/chips. */
function ConnieReply({ res }: { res: ConnieResponse }) {
  if (isChat(res)) return <BotBubble>{res.chat.message}</BotBubble>

  if (isDecisionSupport(res)) {
    const d = res.decision_support
    return (
      <>
        <BotBubble>{d.cr_verdict ?? 'Here are the top picks, ranked:'}</BotBubble>
        <div className="flex w-full flex-col gap-[6px]">
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
      </>
    )
  }

  if (isProductInsights(res)) {
    const pi = res.product_insights
    return (
      <>
        <BotBubble>{`${pi.product_name} — ${pi.verdict === 'recommended' ? 'Recommended' : 'Not recommended'}. Here's what stands out:`}</BotBubble>
        <div className="flex w-full flex-col gap-[6px]">
          {pi.insights.map((ins, i) => (
            <div key={i} className="rounded-[8px] border border-border-subtle bg-bg-primary px-[12px] py-[9px]">
              <p className="text-[14px] font-semibold leading-[20px] text-fg-primary">{ins.label}</p>
              <p className="text-[13px] leading-[18px] text-fg-secondary">{ins.summary}</p>
            </div>
          ))}
        </div>
      </>
    )
  }

  if (isPriorityInference(res)) {
    const p = res.priority_inference
    return (
      <>
        <BotBubble>{p.message}</BotBubble>
        {p.suggested_priorities.length > 0 && (
          <ChipRow>
            {p.suggested_priorities.map((s) => (
              <ChatChip key={s} label={s} />
            ))}
          </ChipRow>
        )}
      </>
    )
  }

  if (isPostPurchase(res)) {
    const pp = res.post_purchase
    return (
      <>
        <BotBubble>{pp.message}</BotBubble>
        {pp.sentiment_options.length > 0 && (
          <ChipRow>
            {pp.sentiment_options.map((s) => (
              <ChatChip key={s} label={s} />
            ))}
          </ChipRow>
        )}
        {pp.community_stat && <BotBubble>{`${pp.community_stat.percent}% ${pp.community_stat.statement}`}</BotBubble>}
      </>
    )
  }

  return <BotBubble>I've noted that — open the annotations view for the on-page details.</BotBubble>
}

export function ChatScreen() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<{ id: number; node: ReactNode }[]>(() => [
    {
      id: 0,
      node: (
        <ConnieGroup>
          <BotBubble>
            Hi! I'm Connie. Ask me about any stroller, tell me your priorities, or say "rank these
            strollers for me."
          </BotBubble>
        </ConnieGroup>
      ),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  // Plain-text transcript, sent back with each turn so Connie can resolve follow-ups. Kept
  // separate from `messages` (which holds React nodes) — this is what goes over the wire.
  const [history, setHistory] = useState<ChatTurn[]>([])
  // Chat previously ignored onboarding priorities entirely — every other screen sends them.
  const priorityKey = preferencesToPriorities(usePreferences((s) => s.preferences))
  const idRef = useRef(1)

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setMessages((m) => [...m, { id: idRef.current++, node: <UserBubble>{text}</UserBubble> }])
    setInput('')
    setLoading(true)
    try {
      // Send the transcript + onboarding priorities so Connie can resolve follow-ups ("why not the
      // cheaper one?"). Deliberately NOT cached — the same question later in a conversation should
      // get a fresh answer, and the history makes each turn unique anyway.
      const res = await callConnie({ message: text, priorities: priorityKey || undefined, history })
      setMessages((m) => [
        ...m,
        {
          id: idRef.current++,
          node: (
            <ConnieGroup>
              <ConnieReply res={res} />
            </ConnieGroup>
          ),
        },
      ])
      // Record a plain-text summary of this turn for the next request's context.
      setHistory((h) => [
        ...h,
        { role: 'user', text },
        { role: 'connie', text: summarizeForHistory(res) },
      ])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error'
      setMessages((m) => [
        ...m,
        {
          id: idRef.current++,
          node: (
            <ConnieGroup>
              <BotBubble>Sorry — I couldn't reach Connie just now. ({msg})</BotBubble>
            </ConnieGroup>
          ),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <FigmaFrame>
      <ProductBackdrop />
      <DimOverlay onClick={() => navigate(routes.annotations)} />
      <NaviRail active="chat" />

      <ChatPanel
        onClose={() => navigate(routes.annotations)}
        composer={
          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={() => void send()}
            disabled={loading}
            placeholder="Ask Connie anything…"
          />
        }
      >
        {messages.map((m) => (
          <div key={m.id} className="w-full">
            {m.node}
          </div>
        ))}
        {loading && (
          <ConnieGroup>
            <ThinkingBubble />
          </ConnieGroup>
        )}
      </ChatPanel>
    </FigmaFrame>
  )
}
