import { AmazonChrome, AMAZON_CHROME_H } from './AmazonChrome'
import { CHROME_H } from '@/components/browser/BrowserChrome'
import { AmazonPrice } from './AmazonSearchPage'
import { PDP_PRODUCT } from '@/mocks/retail'

/**
 * The Amazon product page for Connie's #1 pick — the same product as the saved card, because it's
 * the one she clicked through to. It reads from `mocks/retail.ts`, so the title and price here are
 * literally the same strings the Decision Support card shows.
 *
 * The "About this item" bullets are the page's marketing claims: they're what the shopper
 * highlights in the inline-annotation flow, so the comfort bullet is the one CR's lab data
 * contradicts (see `features/annotations/screens.tsx`).
 *
 * PRESENTATIONAL ONLY — pointer-events-none, so the annotation screen's drag surface owns input.
 */

const p = PDP_PRODUCT

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-[1px]">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i))
        return (
          <span key={i} className="relative block h-[15px] w-[15px]">
            <svg viewBox="0 0 24 24" className="absolute inset-0" fill="#e7e7e7" aria-hidden>
              <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
            </svg>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="#de7921" aria-hidden>
                <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
              </svg>
            </span>
          </span>
        )
      })}
    </span>
  )
}

/** The page's marketing claims. The fold one is what CR's lab data contradicts (CR: 2-step,
 *  two-handed, bulky). Exported so the annotations screen can send these exact claims to the agent
 *  to verify — otherwise the agent has nothing concrete to check and just asks for them. */
export const ABOUT_BULLETS: { lead: string; rest: string }[] = [
  {
    lead: '6 WAYS TO RIDE:',
    rest: 'Modular travel system converts between six configurations — infant car seat, pramette, toddler seat, and more — so it grows with your child from day one.',
  },
  {
    lead: 'EZ-LIFT™ PLUS INFANT CAR SEAT:',
    rest: 'Weighing just 9.5 lb, the car seat suits infants 4-30 lb, installs in seconds, and transitions to the stroller with no adapters needed.',
  },
  {
    lead: 'PLUSH SEATING KEEPS BABY COMFORTABLE FOR HOURS:',
    rest: 'Extra-thick padding and a deep recline cushion every bump, so your little one stays comfortable ride after ride, mile after mile.',
  },
  {
    lead: 'FOLDS WITH ONE HAND:',
    rest: 'Self-standing trigger fold collapses the frame with one simple motion, perfect for busy parents who need quick storage.',
  },
  {
    lead: 'STORES MORE ESSENTIALS:',
    rest: 'Extra-large basket holds 20 lb of essentials, giving you room for diaper bags, toys, and everything you need for day trips.',
  },
  {
    lead: 'PARENT-READY EXTRAS:',
    rest: 'Includes a covered parent console with two cup holders, a child tray, and a large UPF 50+ canopy with a peek-a-boo window.',
  },
]

const SPECS: [string, string][] = [
  ['Brand', 'Baby Trend'],
  ['Color', 'Dash Black'],
  ['Material', 'Polyester'],
  ['Frame Material', 'Aluminum'],
  ['Age Range (Description)', 'Baby'],
]

function BuyBoxButton({ label, primary }: { label: string; primary?: boolean }) {
  return (
    <div
      className={`flex h-[30px] w-full items-center justify-center rounded-full border text-[13px] text-[#0F1111] ${
        primary ? 'border-[#FCD200] bg-[#FFD814]' : 'border-[#FFA724] bg-[#FFA41C]'
      }`}
    >
      {label}
    </div>
  )
}

export function AmazonProductPage() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-white">
      <AmazonChrome query={p.name} top={CHROME_H} />

      {/* Breadcrumb */}
      <div
        className="absolute left-0 flex w-[1440px] items-center border-b border-[#e7e7e7] bg-white px-[16px] text-[12px] text-[#565959]"
        style={{ top: CHROME_H + AMAZON_CHROME_H, height: 30 }}
      >
        Baby Products › Strollers &amp; Accessories › Travel Systems
      </div>

      {/* ---- Left: gallery ---- */}
      <div className="absolute" style={{ left: 20, top: 234, width: 96 }}>
        {p.gallery?.map((g, i) => (
          <div
            key={i}
            className={`mb-[8px] flex h-[64px] w-[64px] items-center justify-center rounded-[4px] border bg-white p-[3px] ${
              i === 0 ? 'border-[#e77600] shadow-[0_0_3px_2px_rgba(228,121,17,0.5)]' : 'border-[#d5d9d9]'
            }`}
          >
            <img src={g} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        ))}
        <div className="flex h-[64px] w-[64px] items-center justify-center rounded-[4px] border border-[#d5d9d9] bg-[#f7f7f7] text-[11px] text-[#565959]">
          ▶ 6 VIDEOS
        </div>
      </div>

      <div
        className="absolute flex items-center justify-center bg-white"
        style={{ left: 132, top: 234, width: 400, height: 400 }}
      >
        <img src={p.img} alt="" className="max-h-full max-w-full object-contain" />
      </div>
      <p className="absolute text-[13px] text-[#007185]" style={{ left: 132, top: 644, width: 400 }}>
        <span className="block text-center">Roll over image to zoom in</span>
      </p>

      {/* ---- Middle: title, rating, about ---- */}
      <div className="absolute" style={{ left: 566, top: 234, width: 500 }}>
        <p className="text-[22px] font-medium leading-[28px] text-[#0F1111]">{p.amazonTitle}</p>
        <p className="mt-[4px] text-[13px] text-[#007185]">
          Visit the {p.brand} Store
        </p>
        <div className="mt-[5px] flex items-center gap-[6px]">
          <span className="text-[14px] text-[#0F1111]">{p.rating}</span>
          <Stars rating={p.rating} />
          <span className="text-[13px] text-[#007185]">{p.ratingCount} ratings</span>
        </div>
        <div className="mt-[6px] h-px w-full bg-[#e7e7e7]" />
        <p className="mt-[6px] text-[13px] text-[#565959]">{p.bought}</p>

        {/* Specs table */}
        <div className="mt-[10px] flex flex-col gap-[4px]">
          {SPECS.map(([k, v]) => (
            <div key={k} className="flex text-[13px] leading-[18px]">
              <span className="w-[150px] shrink-0 font-bold text-[#0F1111]">{k}</span>
              <span className="text-[#0F1111]">{v}</span>
            </div>
          ))}
        </div>

        {/* About this item — the claims the shopper highlights */}
        <p className="mt-[14px] text-[18px] font-bold text-[#0F1111]">About this item</p>
        <ul className="mt-[6px] flex flex-col gap-[7px] pl-[16px]">
          {ABOUT_BULLETS.map((b) => (
            <li key={b.lead} className="list-disc text-[13px] leading-[19px] text-[#0F1111]">
              <span className="font-bold">{b.lead}</span> {b.rest}
            </li>
          ))}
        </ul>
        <p className="mt-[8px] text-[13px] text-[#C7511F]">› See more product details</p>
      </div>

      {/* ---- Right: buy box ---- */}
      <div
        className="absolute rounded-[8px] border border-[#d5d9d9] bg-white p-[14px]"
        style={{ left: 1096, top: 234, width: 240 }}
      >
        <div className="flex items-end gap-[4px]">
          <AmazonPrice price={p.price} />
        </div>
        {p.listPrice && (
          <p className="mt-[2px] text-[12px] text-[#565959]">
            List Price: <span className="line-through">{p.listPrice}</span>
          </p>
        )}
        <p className="mt-[6px] text-[13px] text-[#0F1111]">
          FREE delivery <span className="font-bold">{p.delivery}</span>
        </p>
        <p className="mt-[2px] text-[13px] text-[#0F1111]">
          Or fastest delivery <span className="font-bold">Wed, Jun 17</span>
        </p>
        <p className="mt-[8px] text-[16px] text-[#007600]">In Stock</p>
        <div className="mt-[8px] flex h-[28px] w-[86px] items-center justify-between rounded-[7px] border border-[#d5d9d9] bg-[#f0f2f2] px-[8px] text-[13px]">
          Qty: 1 <span className="text-[8px]">▼</span>
        </div>
        <div className="mt-[10px] flex flex-col gap-[7px]">
          <BuyBoxButton label="Add to Cart" primary />
          <BuyBoxButton label="Buy Now" />
        </div>
        <div className="mt-[10px] flex flex-col gap-[3px] text-[12px] leading-[17px]">
          <div className="flex justify-between">
            <span className="text-[#565959]">Ships from</span>
            <span className="text-[#0F1111]">Amazon.com</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#565959]">Sold by</span>
            <span className="text-[#007185]">Baby Trend Inc</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#565959]">Returns</span>
            <span className="text-[#007185]">30-day refund</span>
          </div>
        </div>
        <div className="mt-[10px] flex h-[28px] w-full items-center justify-center rounded-full border border-[#8d8d8d] bg-white text-[13px] text-[#0F1111]">
          Add to List
        </div>
      </div>
    </div>
  )
}
