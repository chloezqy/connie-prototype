import { useState } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { routes } from '@/app/routes'
import { useCollabStore } from '@/store/useCollabStore'
import { NaviRail } from '@/components/connie/NaviRail'
import { ConnieHeader } from '@/components/connie/ConnieHeader'
import { ProductBackdrop } from '@/components/connie/RetailBackdrop'
import { DimOverlay } from '@/components/connie/DimOverlay'
import { CompactCard, cards } from '@/features/decisionSupport/screens'

/* ---------- Collaboration asset paths (public/figma, prefix collab-) ---------- */
const A = {
  edit: '/figma/collab-edit.svg',
  user: '/figma/collab-user.svg',
  chat: '/figma/collab-chat.svg',
  caret: '/figma/collab-caretdown.svg',
  lockNote: '/figma/collab-lock-note.svg',
  eye: '/figma/collab-eye.svg',
  check: '/figma/collab-check.svg',
  pencil: '/figma/collab-pencil.svg',
}

/** Only two stops now: set the share up, then look at the shared list. The old confirmation
 *  page in between just showed the list the shopper had *already* selected, one screen earlier. */
type Stage = 'share' | 'shared'

/** The two picks being shared — the top of the saved list. */
const SHARED_CARDS = cards.slice(0, 2)

/* ---------- Shared primitives ---------- */

/** Connie panel — absolute 520px card, anchored right like every other Connie panel. */
function Panel({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div
      className="absolute z-20 flex flex-col items-start gap-[16px] overflow-y-auto overflow-x-clip rounded-[16px] border border-border-subtle bg-bg-secondary p-[28px] shadow-panel"
      style={{ right: 16, top: 16, width: 520, height: 868 }}
    >
      <ConnieHeader onClose={onClose} />
      {children}
    </div>
  )
}

/** Pill toggle, 56×30 — clickable, defaults on. */
function Toggle({ defaultOn = true }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      className={`relative h-[30px] w-[56px] shrink-0 rounded-full transition-colors ${
        on ? 'bg-brand' : 'bg-bg-disabled'
      }`}
    >
      <span
        className={`absolute top-[3px] size-[24px] rounded-full bg-white shadow-sm transition-all ${
          on ? 'left-[29px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}

/** Editable multi-line comment box. */
function CommentField({ placeholder }: { placeholder: string }) {
  return (
    <textarea
      placeholder={placeholder}
      rows={2}
      className="h-[84px] w-full resize-none rounded-[8px] border border-border-strong bg-bg-primary px-[16px] py-[14px] text-body text-fg-primary outline-none placeholder:text-fg-secondary focus:border-brand"
    />
  )
}

/** Section wrapper: small label + content. */
function LabeledSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col items-start gap-[8px]">
      <p className="text-[14px] font-semibold leading-[24px] text-fg-secondary">{label}</p>
      {children}
    </div>
  )
}

/* ---------- Share-with combobox ---------- */

/** A recipient, as a small pill living inside the field. No avatar — it's a token, not a person
 *  card; at this size a photo is 20px of mush that pushes the name out of the field. */
function PersonPill({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className="flex h-[28px] shrink-0 items-center gap-[6px] rounded-pill bg-fg-primary pl-[12px] pr-[8px]">
      <span className="text-[13px] font-semibold leading-[18px] text-fg-inverse">{name}</span>
      <button aria-label={`Remove ${name}`} onClick={onRemove} className="text-[14px] leading-none text-white/70 hover:text-white">
        ×
      </button>
    </span>
  )
}

/**
 * A real recipient field: type a name and press Enter (or comma) to add it. The pills live inside
 * the field, the way every share sheet the shopper has ever used works.
 */
function ShareWithField({
  recipients,
  onAdd,
  onRemove,
}: {
  recipients: string[]
  onAdd: (name: string) => void
  onRemove: (name: string) => void
}) {
  const [draft, setDraft] = useState('')
  const commit = () => {
    const v = draft.trim().replace(/,$/, '')
    if (!v || recipients.includes(v)) return
    onAdd(v)
    setDraft('')
  }
  return (
    <div className="flex min-h-[48px] w-full flex-wrap items-center gap-[8px] rounded-[8px] border border-border-strong bg-bg-primary px-[12px] py-[9px] focus-within:border-brand">
      <img alt="" src={A.user} className="size-[20px] shrink-0" />
      {recipients.map((r) => (
        <PersonPill key={r} name={r} onRemove={() => onRemove(r)} />
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Backspace' && !draft && recipients.length) onRemove(recipients[recipients.length - 1])
        }}
        onBlur={commit}
        placeholder={recipients.length ? '' : 'Add by name or email...'}
        aria-label="Share with"
        className="min-w-[140px] flex-1 bg-transparent text-body text-fg-primary outline-none placeholder:text-fg-secondary"
      />
    </div>
  )
}

/* ---------- Permissions ---------- */
const PERM_OPTIONS = [
  { value: 'Can view', icon: A.eye },
  { value: 'Can comment', icon: A.chat },
  { value: 'Can edit', icon: A.pencil },
]

/** Self-contained permission select — opens on click, picking an option collapses it. */
function PermSelect() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('Can comment')
  const current = PERM_OPTIONS.find((o) => o.value === value) ?? PERM_OPTIONS[1]
  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-[48px] w-full items-center justify-between overflow-clip rounded-[8px] border border-[#d9d9db] bg-bg-primary px-[16px] py-[13px]"
      >
        <span className="flex items-center gap-[9px]">
          <img alt="" src={current.icon} className="size-[18px]" />
          <span className="text-body font-semibold text-fg-primary">{value}</span>
        </span>
        <img alt="" src={A.caret} className={`size-[20px] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-[6px] flex w-full flex-col overflow-clip rounded-[8px] border-[1.5px] border-[#d9d9db] bg-bg-primary shadow-[0px_6px_18px_0px_rgba(0,0,0,0.12)]">
          {PERM_OPTIONS.map((o, i) => {
            const active = o.value === value
            return (
              <div key={o.value}>
                {i > 0 && <div className="h-[1.5px] w-full bg-border-subtle" />}
                <button
                  onClick={() => {
                    setValue(o.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-[10px] overflow-clip px-[16px] py-[13px] text-left ${
                    active ? 'bg-bg-secondary' : 'bg-bg-primary'
                  }`}
                >
                  <img alt="" src={o.icon} className="size-[18px]" />
                  <span className="flex-1 text-body font-semibold text-fg-primary">{o.value}</span>
                  {active && <img alt="" src={A.check} className="size-[18px]" />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function WhatTheySee() {
  return (
    <LabeledSection label="What they'll see">
      <div className="flex w-full flex-col overflow-clip rounded-[8px] border border-border-strong bg-white">
        <div className="flex w-full items-center gap-[12px] overflow-clip px-[18px] py-[15px]">
          <div className="flex flex-1 flex-col gap-[2px] overflow-clip text-body leading-[24px]">
            <p className="w-full font-semibold text-fg-brand">CR scores &amp; why it scored</p>
            <p className="w-full text-fg-secondary">The ratings behind each pick</p>
          </div>
          <Toggle />
        </div>
      </div>
    </LabeledSection>
  )
}

/* ---------- Exported screen: /browse/collaborate?stage=… ---------- */
export function CollaborationScreen() {
  const [params, setParams] = useSearchParams()
  const stage = ((params.get('stage') as Stage) || 'share') as Stage
  const navigate = useNavigate()
  const markShared = useCollabStore((s) => s.markShared)
  const go = (s: Stage) => setParams({ stage: s }, { replace: true })

  /** Both empty for the same reason: naming the list and choosing who sees it are the shopper's
   *  calls, not ours. Pre-filling either puts words in her mouth and skips the only interactions
   *  on the screen. "Create" stays disabled until she's done both. */
  const [listName, setListName] = useState('')
  const [recipients, setRecipients] = useState<string[]>([])

  /* ----- Shared list ----- */
  if (stage === 'shared') {
    return (
      <FigmaFrame>
        <ProductBackdrop />
        <DimOverlay onClick={() => navigate(routes.annotations)} />
        <NaviRail active="saved" />
        {/* Closing the shared list drops her back on the full-colour product page she came from. */}
        <Panel onClose={() => navigate(routes.annotations)}>
          <div className="flex w-full flex-col gap-[6px]">
            <p className="text-eyebrow font-semibold uppercase text-fg-brand">Your shared list</p>
            <div className="flex w-full items-center justify-between gap-[12px]">
              {/* The share step can't be completed without a name, so this only falls back when
                  the shared stage is opened directly from the flow menu. */}
              <p className="flex-1 text-title1 font-semibold text-fg-primary">
                {listName.trim() || 'Untitled list'}
              </p>
              <button aria-label="Edit list" onClick={() => go('share')}>
                <img alt="" src={A.edit} className="size-[24px]" />
              </button>
            </div>
          </div>

          {/* Who's on the list. Two names, not a contact card. */}
          <p className="text-body font-semibold text-fg-primary">
            {['Maya', ...recipients].join(' & ')}
          </p>

          {/* The exact cards from the saved list, read-only, each with a place to weigh in. */}
          {SHARED_CARDS.map((c) => (
            <CompactCard key={c.id} card={c} selectable={false}>
              <CommentField placeholder="Add your comments..." />
            </CompactCard>
          ))}
          <div className="h-[8px] w-full shrink-0" />
        </Panel>
      </FigmaFrame>
    )
  }

  /* ----- Share setup ----- */
  const canCreate = recipients.length > 0 && listName.trim().length > 0

  return (
    <FigmaFrame>
      <ProductBackdrop />
      <DimOverlay onClick={() => navigate(routes.decision)} />
      <NaviRail active="saved" />
      <Panel onClose={() => navigate(routes.decision)}>
        <p className="w-full text-title1 font-semibold text-fg-primary">Share for Discussion.</p>

        <LabeledSection label="List name">
          <input
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="Name this list..."
            aria-label="List name"
            className="h-[48px] w-full rounded-[8px] border border-border-strong bg-bg-primary px-[16px] text-body text-fg-primary outline-none placeholder:text-fg-secondary focus:border-brand"
          />
        </LabeledSection>

        <LabeledSection label="Share with">
          <ShareWithField
            recipients={recipients}
            onAdd={(n) => setRecipients((r) => [...r, n])}
            onRemove={(n) => setRecipients((r) => r.filter((x) => x !== n))}
          />
        </LabeledSection>

        <LabeledSection label="Permissions">
          <PermSelect />
        </LabeledSection>

        <WhatTheySee />

        <LabeledSection label="A note for them (optional)">
          <CommentField placeholder="Why you picked these? What should they weigh in on?" />
        </LabeledSection>

        <div className="flex w-full items-start gap-[10px] overflow-clip">
          <img alt="" src={A.lockNote} className="h-[26px] w-[16px]" />
          <p className="flex-1 text-body text-fg-secondary">
            Recipients have the option to create a CR account and see your picks + CR&rsquo;s scores.
          </p>
        </div>

        <button
          onClick={
            canCreate
              ? () => {
                  markShared()
                  go('shared')
                }
              : undefined
          }
          disabled={!canCreate}
          className={`flex h-[48px] min-h-[48px] w-full shrink-0 items-center justify-center rounded-pill ${
            canCreate ? 'bg-brand' : 'bg-bg-disabled'
          }`}
        >
          <span className="text-body font-semibold text-fg-inverse">Confirm &amp; Share</span>
        </button>
      </Panel>
    </FigmaFrame>
  )
}
