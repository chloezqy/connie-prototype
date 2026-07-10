import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { FigmaFrame } from '@/layouts/FigmaFrame'
import { routes } from '@/app/routes'
import { useCollabStore } from '@/store/useCollabStore'
import { NaviRail } from '@/components/connie/NaviRail'

/* ---------- Collaboration asset paths (public/figma, prefix collab-) ---------- */
const A = {
  bg: '/figma/collab-amazon-bg.png',
  stroller1: '/figma/collab-stroller1.jpg',
  stroller2: '/figma/collab-stroller2.jpg',
  reddit: '/figma/collab-reddit.png',
  cr: '/figma/collab-cr.png',
  avatar: '/figma/collab-avatar.jpg',
  close: '/figma/collab-close.svg',
  lockEyebrow: '/figma/collab-lock-eyebrow.svg',
  share: '/figma/collab-share.svg',
  edit: '/figma/collab-edit.svg',
  lockNotice: '/figma/collab-lock-notice.svg',
  fits: '/figma/collab-fits.svg',
  arrow: '/figma/collab-arrowupright.svg',
  user: '/figma/collab-user.svg',
  chat: '/figma/collab-chat.svg',
  caret: '/figma/collab-caretdown.svg',
  lockNote: '/figma/collab-lock-note.svg',
  eye: '/figma/collab-eye.svg',
  check: '/figma/collab-check.svg',
  pencil: '/figma/collab-pencil.svg',
  people: '/figma/collab-people.svg',
  info: '/figma/collab-info.svg',
  naviChat: '/figma/collab-navi-chat.svg',
  naviHeart: '/figma/collab-navi-heart.svg',
  naviLine: '/figma/collab-navi-line.svg',
  naviGear: '/figma/collab-navi-gear.svg',
  naviQuestion: '/figma/collab-navi-question.svg',
}

type Stage = 'confirm' | 'share' | 'add' | 'permissions' | 'shared'

/* ---------- Shared primitives ---------- */

/** Connie panel — absolute 520px card at left 864 / top 72 (Figma). */
function Panel({
  bg,
  height,
  children,
}: {
  bg: string
  height: number
  children: ReactNode
}) {
  return (
    <div
      className={`absolute flex flex-col items-start gap-[16px] overflow-y-auto overflow-x-clip rounded-md border border-border-subtle p-[36px] shadow-panel ${bg}`}
      style={{ left: 864, top: 72, width: 520, height }}
    >
      {children}
    </div>
  )
}

function CloseX({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex w-full flex-col items-end overflow-clip">
      <button aria-label="Close" onClick={onClick}>
        <img alt="" src={A.close} className="size-[22px]" />
      </button>
    </div>
  )
}

/** Pill toggle, 64×32 — clickable, defaults on. */
function Toggle({ defaultOn = true }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      className={`relative h-[32px] w-[64px] shrink-0 rounded-full transition-colors ${
        on ? 'bg-brand' : 'bg-bg-disabled'
      }`}
    >
      <span
        className={`absolute top-[4px] size-[24px] rounded-full bg-white shadow-sm transition-all ${
          on ? 'left-[36px]' : 'left-[4px]'
        }`}
      />
    </button>
  )
}

/* ---------- List (product) card — used in C1 confirm + C4 shared ---------- */

type Pill = { avatar: string; label: string; size: number }

type ProductCardProps = {
  image: string
  badge: string
  badgeClass: string
  title: string
  price: string
  retailer: string
  fits: string
  pills: Pill[]
  showComment?: boolean
}

function CommunityPill({ pill }: { pill: Pill }) {
  return (
    <div className="flex items-center gap-[4px] rounded-[80px] border border-border-subtle bg-white p-[8px]">
      <img
        alt=""
        src={pill.avatar}
        className="size-[20px] rounded-full border-[0.5px] border-white object-cover"
      />
      <p className="whitespace-nowrap text-[#222]" style={{ fontSize: pill.size, lineHeight: '17px' }}>
        {pill.label}
      </p>
      <img alt="" src={A.arrow} className="size-[12px]" />
    </div>
  )
}

function ProductCard({
  image,
  badge,
  badgeClass,
  title,
  price,
  retailer,
  fits,
  pills,
  showComment,
}: ProductCardProps) {
  return (
    <div className="flex w-full flex-col gap-[16px] overflow-clip rounded-sm border border-border-subtle bg-bg-primary p-[17px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)]">
      {/* Header row: thumbnail + info */}
      <div className="flex w-full gap-[16px]">
        <div className="flex size-[80px] shrink-0 items-center justify-center overflow-clip rounded-sm bg-bg-tertiary">
          <img alt="" src={image} className="size-full rounded-sm object-cover" />
        </div>
        <div className="flex flex-1 flex-col gap-[4px]">
          <div>
            <span className={`inline-flex rounded-[4px] px-[8px] py-[4px] text-[14px] leading-[20px] ${badgeClass}`}>
              {badge}
            </span>
          </div>
          <p className="text-[14px] font-semibold leading-[20px] text-fg-primary">{title}</p>
          <div className="flex items-center gap-[9px]">
            <span className="text-[14px] leading-[20px] text-fg-primary">{price}</span>
            <span className="rounded-[4px] bg-[#fff3b3] px-[8px] py-[4px] text-[14px] leading-[20px] text-fg-secondary">
              {retailer}
            </span>
          </div>
        </div>
      </div>

      {/* Why this fits */}
      <div className="flex w-full flex-col gap-[8px] rounded-[12px] border border-[#daede0] bg-[rgba(240,253,244,0.2)] p-[9px]">
        <div className="flex items-center gap-[8px]">
          <img alt="" src={A.fits} className="h-[14px] w-[14.667px]" />
          <span className="whitespace-nowrap text-[14px] leading-[20px] text-[#15803d]">WHY THIS FITS YOU</span>
        </div>
        <p className="text-[14px] leading-[20px] text-[#47464b]">{fits}</p>
      </div>

      {/* Source pills */}
      <div className="flex w-full flex-wrap items-center gap-[10px]">
        {pills.map((p) => (
          <CommunityPill key={p.label} pill={p} />
        ))}
      </div>

      {/* View full review */}
      <button className="flex w-full items-center justify-center rounded-[8px] border border-border-black bg-[#141414] py-[10px] text-[12px] font-semibold leading-[16px] text-fg-inverse">
        View Full Review
      </button>

      {showComment && <CommentField placeholder="Add your comments..." />}
    </div>
  )
}

const CARD1: Omit<ProductCardProps, 'showComment'> = {
  image: A.stroller1,
  badge: '#1 BEST MATCH',
  badgeClass: 'bg-brand-muted text-fg-brand',
  title: 'UppaBaby Vista V2',
  price: '$999.00',
  retailer: 'AT AMAZON',
  fits: 'Matches your high-priority for all-terrain stability. The dual-action suspension system is rated top-tier for gravel and uneven paths.',
  pills: [
    { avatar: A.reddit, label: 'Reddit Community', size: 12 },
    { avatar: A.cr, label: 'CR 2024 Lab Results', size: 12 },
  ],
}

const CARD2: Omit<ProductCardProps, 'showComment'> = {
  image: A.stroller2,
  badge: '#2 RUNNER UP',
  badgeClass: 'bg-[#ecf7cd] text-fg-secondary',
  title: 'Baby Jogger City Mini GT2',
  price: '$399.99',
  retailer: 'AT WALMART',
  fits: 'Excellent for your secondary need for compact storage. One-hand quick fold outperforms competitors in tight trunks.',
  pills: [{ avatar: A.cr, label: 'CR Safety Collection', size: 14 }],
}

/* ---------- List header (title + share/edit) ---------- */
function ListHeader({
  eyebrowIcon,
  eyebrow,
  onShare,
}: {
  eyebrowIcon: string
  eyebrow: string
  onShare: () => void
}) {
  return (
    <div className="flex w-full flex-col gap-[6px] overflow-clip">
      <div className="flex items-center gap-[8px]">
        <img alt="" src={eyebrowIcon} className="size-[13px]" />
        <p className="text-eyebrow font-semibold uppercase text-fg-brand">{eyebrow}</p>
      </div>
      <div className="flex w-full items-center justify-between">
        <p className="w-[301px] text-title1 font-semibold text-fg-primary">Strollers for the twins</p>
        <div className="flex w-[63px] items-center justify-between">
          <button aria-label="Share" onClick={onShare}>
            <img alt="" src={A.share} className="size-[25px]" />
          </button>
          <img alt="" src={A.edit} className="size-[24px]" />
        </div>
      </div>
    </div>
  )
}

/* ---------- Share-bridge building blocks (C2 / C3) ---------- */

function ShareHeader() {
  return (
    <div className="flex w-full flex-col gap-[8px] overflow-clip">
      <p className="text-eyebrow font-semibold uppercase text-fg-brand">SHARE FOR DISCUSSION</p>
      <p className="w-full text-title1 font-semibold text-fg-primary">Bring people in.</p>
    </div>
  )
}

function PersonChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <div className="flex h-[66px] w-[166px] items-center gap-[20px] overflow-clip rounded-[30px] bg-fg-primary px-[12px] py-[8px]">
      <div className="flex w-[103px] items-center gap-[12px]">
        <img alt="" src={A.avatar} className="size-[48px] rounded-[32px] border border-[#f2f2ed] object-cover" />
        <p className="text-body font-semibold tracking-[-0.25px] text-fg-inverse">{name}</p>
      </div>
      <button aria-label="Remove" onClick={onRemove} className="flex h-[48px] w-[15px] items-center text-[24px] leading-[32px] text-white">
        ×
      </button>
    </div>
  )
}

function ShareWithField({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-[48px] w-full items-center gap-[8px] rounded-[4px] border border-border-strong px-[12px] text-left"
    >
      <img alt="" src={A.user} className="size-[24px]" />
      <span className="flex-1 text-body text-fg-secondary">Add by name or email...</span>
    </button>
  )
}

const PERM_OPTIONS = [
  { value: 'Can view', icon: A.eye },
  { value: 'Can comment', icon: A.chat },
  { value: 'Can edit', icon: A.pencil },
]

/** Self-contained permission select — opens on click, picking an option collapses it. */
function PermSelect({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [value, setValue] = useState('Can comment')
  const current = PERM_OPTIONS.find((o) => o.value === value) ?? PERM_OPTIONS[1]
  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-[48px] w-full items-center justify-between overflow-clip rounded-sm border border-[#d9d9db] bg-bg-primary px-[16px] py-[13px]"
      >
        <span className="flex items-center gap-[9px]">
          <img alt="" src={current.icon} className="size-[18px]" />
          <span className="text-body font-semibold text-fg-primary">{value}</span>
        </span>
        <img alt="" src={A.caret} className={`size-[20px] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-[6px] flex w-full flex-col overflow-clip rounded-sm border-[1.5px] border-[#d9d9db] bg-bg-primary shadow-[0px_6px_18px_0px_rgba(0,0,0,0.12)]">
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
                  <span
                    className={`flex-1 text-body font-semibold ${
                      o.value === 'Can edit' ? 'text-fg-brand' : 'text-fg-primary'
                    }`}
                  >
                    {o.value}
                  </span>
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
    <>
      <p className="text-title4 font-semibold text-fg-primary">What they&rsquo;ll see</p>
      <div className="flex w-full flex-col overflow-clip rounded-md border border-border-strong bg-white">
        <div className="flex w-full items-center gap-[12px] overflow-clip px-[18px] py-[15px]">
          <div className="flex flex-1 flex-col gap-[2px] overflow-clip text-body leading-[24px]">
            <p className="w-full font-semibold text-fg-brand">CR scores &amp; why it scored</p>
            <p className="w-full text-fg-secondary">The ratings behind each pick</p>
          </div>
          <Toggle />
        </div>
      </div>
    </>
  )
}

function NoteField() {
  return (
    <div className="flex w-full flex-col gap-[8px] overflow-clip">
      <p className="text-body font-semibold text-fg-secondary">A note for them (optional)</p>
      <CommentField placeholder="Why you picked these? What should they weigh in on?" />
    </div>
  )
}

function RecipientsNote() {
  return (
    <div className="flex w-full items-start gap-[10px] overflow-clip">
      <img alt="" src={A.lockNote} className="h-[26px] w-[16px]" />
      <p className="flex-1 text-body text-fg-secondary">
        Recipients have the option to create a CR account and see your picks + CR&rsquo;s scores.
      </p>
    </div>
  )
}

function CreateButton({ enabled, onClick }: { enabled: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={enabled ? onClick : undefined}
      className={`flex h-[48px] min-h-[48px] w-full shrink-0 items-center justify-center rounded-xl ${
        enabled ? 'bg-brand' : 'bg-bg-disabled'
      }`}
    >
      <span className="text-body font-semibold text-fg-inverse">Create shared list</span>
    </button>
  )
}

/** Editable multi-line comment box. */
function CommentField({ placeholder }: { placeholder: string }) {
  return (
    <textarea
      placeholder={placeholder}
      rows={2}
      className="h-[84px] w-full resize-none rounded-sm border border-border-strong bg-bg-primary px-[16px] py-[14px] text-body text-fg-primary outline-none placeholder:text-fg-secondary focus:border-brand"
    />
  )
}

/** Section wrapper: small label + content. */
function LabeledSection({ label, style, children }: { label: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col items-start gap-[8px] overflow-clip" style={style}>
      <p className="text-[14px] font-semibold leading-[24px] text-fg-secondary">{label}</p>
      {children}
    </div>
  )
}

/* ---------- Exported screen: /browse/collaborate?stage=… ---------- */
export function CollaborationScreen() {
  const [params, setParams] = useSearchParams()
  const stage = ((params.get('stage') as Stage) || 'confirm') as Stage
  const navigate = useNavigate()
  const markShared = useCollabStore((s) => s.markShared)
  const go = (s: Stage) => setParams({ stage: s }, { replace: true })

  /* ----- C1 Confirmation (private list) ----- */
  if (stage === 'confirm') {
    return (
      <FigmaFrame backdrop={A.bg} backdropOpacity={0.4}>
        <NaviRail active="saved" />
        <Panel bg="bg-bg-secondary" height={815}>
          <CloseX onClick={() => navigate('/')} />
          <ListHeader eyebrowIcon={A.lockEyebrow} eyebrow="Your private list" onShare={() => go('share')} />
          <p className="text-body text-fg-secondary">2 saved</p>
          <div className="flex w-full items-center gap-[10px] overflow-clip rounded-sm bg-bg-tertiary px-[16px] py-[14px]">
            <img alt="" src={A.lockNotice} className="size-[18px]" />
            <p className="flex-1 text-body text-fg-secondary">
              Private until you share. You choose exactly what others can see.
            </p>
          </div>
          <ProductCard {...CARD1} />
          <ProductCard {...CARD2} />
          <div className="h-[22px] w-full" />
        </Panel>
      </FigmaFrame>
    )
  }

  /* ----- C4 Shared list ----- */
  if (stage === 'shared') {
    return (
      <FigmaFrame backdrop={A.bg} backdropOpacity={0.4}>
        <NaviRail active="saved" />
        <Panel bg="bg-bg-secondary" height={803}>
          <CloseX onClick={() => navigate(routes.postPurchase)} />
          <ListHeader eyebrowIcon={A.people} eyebrow="Your shared list" onShare={() => navigate(routes.postPurchase)} />
          {/* Owner */}
          <div className="flex items-center gap-[12px]">
            <img alt="" src={A.avatar} className="size-[48px] rounded-[32px] border border-[#f2f2ed] object-cover" />
            <div className="flex flex-col items-start">
              <p className="text-body font-semibold tracking-[-0.25px] text-fg-primary">Alex</p>
              <p className="text-[14px] leading-[20px] text-fg-secondary">alex@gmail.com</p>
            </div>
          </div>
          {/* Why these */}
          <div className="flex w-full flex-col items-start gap-[8px] overflow-clip rounded-md bg-brand-muted p-[16px]">
            <div className="flex items-start gap-[10px] overflow-clip rounded-[4px] bg-fg-primary px-[10px] py-[5px]">
              <span className="text-[12px] font-semibold leading-[16px] text-white">WHY THESE?</span>
              <img alt="" src={A.info} className="size-[14px]" />
            </div>
            <p className="w-full text-body text-fg-secondary">
              Maya shortlisted these because both fit your shared priorities - reliability and safety. UPPAbaby leads
              on ride smoothness; Graco on value. Weigh in below.
            </p>
          </div>
          <ProductCard {...CARD1} showComment />
          <ProductCard {...CARD2} showComment />
          <div className="h-[22px] w-full" />
        </Panel>
      </FigmaFrame>
    )
  }

  /* ----- C2 / C3 Share bridge (share | add | permissions) ----- */
  const hasChip = stage === 'add' || stage === 'permissions'
  const chipName = stage === 'permissions' ? 'Maya' : 'Alex'
  const dropdownOpen = stage === 'permissions'
  const canCreate = hasChip
  const panelHeight = stage === 'share' ? 760 : 800

  return (
    <FigmaFrame backdrop={A.bg} backdropOpacity={stage === 'permissions' ? 0.1 : 0.4}>
      <NaviRail active="saved" />
      <Panel bg="bg-white" height={panelHeight}>
        <CloseX onClick={() => navigate('/')} />
        <ShareHeader />

        {/* Share with */}
        <LabeledSection label="Share with" style={{ justifyContent: 'center' }}>
          {hasChip && <PersonChip name={chipName} onRemove={() => go('share')} />}
          <ShareWithField onClick={() => go('add')} />
        </LabeledSection>

        {/* They can */}
        <LabeledSection label="They can">
          <PermSelect defaultOpen={dropdownOpen} />
        </LabeledSection>

        <WhatTheySee />
        <NoteField />
        <RecipientsNote />
        <CreateButton
          enabled={canCreate}
          onClick={() => {
            markShared()
            go('shared')
          }}
        />
        {stage !== 'share' && <div className="h-[22px] w-full" />}
      </Panel>
    </FigmaFrame>
  )
}
