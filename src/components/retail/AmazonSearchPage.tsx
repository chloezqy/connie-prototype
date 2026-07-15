import { AmazonChrome, AMAZON_CHROME_H } from './AmazonChrome'
import { CHROME_H } from '@/components/browser/BrowserChrome'
import { SEARCH_ROSTER, SEARCH_ROW2, type RetailProduct } from '@/mocks/retail'

/**
 * Amazon's search results for "strollers" — the page Connie's badges sit on.
 *
 * Mocked, not a screenshot, so the three strollers are the real CR roster (`mocks/retail.ts`) and
 * their titles/prices can't drift from the cards Connie shows for them.
 *
 * PRESENTATIONAL ONLY: the whole page is pointer-events-none, because Connie's screens layer their
 * own click targets (open the PDP, open a badge) over the top of it.
 */

/* ==================================================================== *
 *  TWEAK HERE — the layout of the three product cards, and everything
 *  Connie draws on top of them.
 *
 *  This is the ONLY place these numbers live. The page renders itself from
 *  SEARCH_GRID, and Connie's badges / shimmer / tour spotlight all derive
 *  from the helpers below, so the overlays cannot drift off the products.
 *
 *  All values are FRAME coordinates — the 1440×900 canvas, with y=0 at the
 *  very top of the browser chrome.
 * ==================================================================== */
export const SEARCH_GRID = {
  /** Left edge of each of the three product cards, left → right. */
  lefts: [256, 578, 900],
  /** Card column width. */
  cardWidth: 304,
  /**
   * Top of the card — and, because the photo is the card's first element, the top of the photo.
   * Leave headroom above it for `overlayPad` and a negative `badgeOffsetY`, or they'll ride up
   * into the results bar (which ends at y≈224).
   */
  cardTop: 244,

  /**
   * The product photo is a SQUARE of exactly this size, centred in the card.
   *
   * It has to be square and it has to be explicit. The photos are square source images, so a
   * non-square box would letterbox them with `object-contain` and the *rendered* photo would be
   * narrower than its container — which is exactly how the badges ended up floating ~31px off the
   * right edge of each product. Box == photo, always.
   */
  photoSize: 220,

  /**
   * How far Connie's square overlay extends past the PHOTO on every side — the tour's spotlight.
   * The photo is narrower than its card, so there's room to spare here.
   */
  overlayPad: 12,

  /**
   * How far the "analyzing" shimmer extends past a whole CARD.
   *
   * Much tighter than `overlayPad`, and it has to be: the columns are 322px apart with 304px cards,
   * so there are only 18px of gutter between them. Anything above 9 makes neighbouring shimmers
   * touch, which reads as one smeared block rather than three products being analyzed.
   */
  cardOverlayPad: 6,

  /** Connie's badge (the green star / grey chat circles). */
  badgeSize: 45,
  /** Inset from the photo's RIGHT edge. Bigger = further left. */
  badgeInsetX: -20,
  /** Offset from the photo's TOP edge. NEGATIVE lifts the badge above the photo. */
  badgeOffsetY: -20,

  /**
   * Full height of a first-row card — photo through the delivery line.
   *
   * Cards are auto-height and differ by a few tens of px (their titles clamp at 1-3 lines), so this
   * is deliberately the TALLEST case: Connie's shimmer has to cover the longest card completely,
   * and a uniform box per column reads as intentional where a short one reads as a clipping bug.
   */
  cardHeight: 490,

  /** The second row, cut off by the fold. Image-only blocks — the page obviously continues. */
  row2Top: 812,
  row2Height: 200,
  /** The second row's images are square and centred, like the first row's photos. */
  row2PhotoSize: 200,
} as const

/** The six products on the page: row 1 is `lefts[i]`, row 2 is the same columns lower down. */
export const SEARCH_PRODUCT_COUNT = 6

/** Horizontal centring offset of the photo within its card. */
const PHOTO_X = (SEARCH_GRID.cardWidth - SEARCH_GRID.photoSize) / 2
const ROW2_PHOTO_X = (SEARCH_GRID.cardWidth - SEARCH_GRID.row2PhotoSize) / 2

/**
 * The photo box of card `i` (0-5) — the exact rectangle the product image occupies.
 * Connie's badges are measured from this, so they hug the image on both rows.
 */
export function productSquare(i: number) {
  const col = i % 3
  if (i < 3) {
    return {
      left: SEARCH_GRID.lefts[col] + PHOTO_X,
      top: SEARCH_GRID.cardTop,
      width: SEARCH_GRID.photoSize,
      height: SEARCH_GRID.photoSize,
    }
  }
  return {
    left: SEARCH_GRID.lefts[col] + ROW2_PHOTO_X,
    top: SEARCH_GRID.row2Top,
    width: SEARCH_GRID.row2PhotoSize,
    height: SEARCH_GRID.row2PhotoSize,
  }
}

/**
 * The FULL card box of product `i` (0-5) — everything the shopper reads as "the product":
 * photo, title, rating, price, delivery. Row 2's cards are image-only blocks, cut off by the fold.
 */
export function productCardBox(i: number) {
  const col = i % 3
  return i < 3
    ? {
        left: SEARCH_GRID.lefts[col],
        top: SEARCH_GRID.cardTop,
        width: SEARCH_GRID.cardWidth,
        height: SEARCH_GRID.cardHeight,
      }
    : {
        left: SEARCH_GRID.lefts[col],
        top: SEARCH_GRID.row2Top,
        width: SEARCH_GRID.cardWidth,
        height: SEARCH_GRID.row2Height,
      }
}

/**
 * The box Connie's "analyzing" shimmer covers — the whole card plus `overlayPad`, so the gradient
 * reads as covering the *product*, not just its photo.
 */
export function cardOverlayBox(i: number) {
  const c = productCardBox(i)
  const pad = SEARCH_GRID.cardOverlayPad
  return {
    left: c.left - pad,
    top: c.top - pad,
    width: c.width + pad * 2,
    height: c.height + pad * 2,
  }
}

/**
 * The square Connie draws over a product's PHOTO — the photo plus `overlayPad` on each side.
 *
 * This is the guided tour's spotlight: the tour points at one product, so it frames the photo.
 * The insights shimmer uses `cardOverlayBox` instead, because "analyzing" acts on the whole
 * product (title, rating, price and all), not just its picture.
 */
export function overlayBox(i: number) {
  const photo = productSquare(i)
  const pad = SEARCH_GRID.overlayPad
  return {
    left: photo.left - pad,
    top: photo.top - pad,
    width: photo.width + pad * 2,
    height: photo.height + pad * 2,
  }
}

/** Where Connie's badge sits on card `i` — near the top-right corner of the photo. */
export function badgePos(i: number) {
  const photo = productSquare(i)
  return {
    left: photo.left + photo.width - SEARCH_GRID.badgeSize - SEARCH_GRID.badgeInsetX,
    top: photo.top + SEARCH_GRID.badgeOffsetY,
  }
}

/* ------------------------------------------------------------------ bits */

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-[1px]">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i))
        return (
          <span key={i} className="relative block h-[13px] w-[13px]">
            <svg viewBox="0 0 24 24" className="absolute inset-0" fill="#e7e7e7" aria-hidden>
              <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
            </svg>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" fill="#de7921" aria-hidden>
                <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
              </svg>
            </span>
          </span>
        )
      })}
    </span>
  )
}

/** Amazon's split price: big dollars, small superscript cents. */
export function AmazonPrice({ price, size = 'lg' }: { price: string; size?: 'lg' | 'sm' }) {
  const [dollars, cents] = price.replace('$', '').split('.')
  const big = size === 'lg' ? 'text-[26px]' : 'text-[18px]'
  const small = size === 'lg' ? 'text-[13px]' : 'text-[10px]'
  return (
    <span className="flex items-start text-[#0F1111]">
      <span className={`${small} mt-[4px]`}>$</span>
      <span className={`${big} font-medium leading-[26px]`}>{dollars}</span>
      <span className={`${small} mt-[3px]`}>{cents}</span>
    </span>
  )
}

function PrimeMark() {
  return (
    <span className="flex items-center gap-[2px]">
      <svg width="14" height="12" viewBox="0 0 24 20" aria-hidden>
        <path d="M2 12l6 5L22 3" stroke="#f90" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </svg>
      <span className="text-[13px] font-bold italic text-[#00A8E1]">prime</span>
    </span>
  )
}

function ProductCard({ p, left }: { p: RetailProduct; left: number }) {
  return (
    <div
      className="absolute flex flex-col bg-white"
      style={{ left, top: SEARCH_GRID.cardTop, width: SEARCH_GRID.cardWidth }}
    >
      {/* Photo — a square, centred, sized from SEARCH_GRID.
          `productSquare(i)` describes this exact element; keep them in step. The source images are
          square, so the image fills the box edge to edge and the box IS the visible photo. */}
      <div
        className="relative mx-auto bg-white"
        style={{ width: SEARCH_GRID.photoSize, height: SEARCH_GRID.photoSize }}
      >
        {/* No z-index here. The page root has no stacking context of its own, so a z-10 on this
            tag competed in the ROOT stacking order and painted over Connie's shimmer — which is
            meant to cover the whole product, badge and all. Plain DOM order is what we want. */}
        {p.bestSeller && (
          <span className="absolute -left-[10px] top-0 rounded-[2px] bg-[#CC0C39] px-[7px] py-[2px] text-[11px] font-bold text-white">
            Best Seller
          </span>
        )}
        <img src={p.img} alt="" className="h-full w-full object-contain" />
      </div>

      {/* Colour swatches */}
      <div className="mt-[10px] flex items-center gap-[6px]">
        {p.colors.map((c, i) => (
          <span
            key={i}
            className={`block size-[16px] rounded-full ${i === 0 ? 'ring-1 ring-[#232f3e] ring-offset-1' : ''}`}
            style={{ background: c }}
          />
        ))}
      </div>

      {/* Title */}
      <p className="mt-[8px] line-clamp-3 text-[15px] leading-[21px] text-[#0F1111]">{p.amazonTitle}</p>

      {p.count && <p className="mt-[6px] text-[13px] text-[#0F1111]">{p.count}</p>}

      {/* Rating */}
      <div className="mt-[5px] flex items-center gap-[5px]">
        <span className="text-[13px] text-[#0F1111]">{p.rating}</span>
        <Stars rating={p.rating} />
        <span className="text-[9px] text-[#565959]">▼</span>
        <span className="text-[13px] text-[#007185]">({p.ratingCount})</span>
      </div>

      <p className="mt-[3px] text-[13px] text-[#565959]">{p.bought}</p>

      {/* Price */}
      <div className="mt-[6px] flex items-end gap-[6px]">
        <AmazonPrice price={p.price} />
        <span className="mb-[2px] text-[12px] text-[#565959]">({p.price}/count)</span>
        {p.listPrice && (
          <span className="mb-[2px] text-[12px] text-[#565959]">
            List: <span className="line-through">{p.listPrice}</span>
          </span>
        )}
      </div>

      {/* Delivery */}
      {p.prime && (
        <div className="mt-[5px] flex items-center gap-[5px]">
          <PrimeMark />
          <span className="text-[13px] font-bold text-[#0F1111]">Two-Day</span>
        </div>
      )}
      <p className="mt-[3px] text-[13px] text-[#0F1111]">
        FREE delivery <span className="font-bold">{p.delivery}</span>
        {p.deliveryNote ? ` ${p.deliveryNote}` : ''}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ sidebar */
function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-[18px] flex flex-col gap-[7px]">
      <p className="text-[16px] font-bold text-[#0F1111]">{title}</p>
      {children}
    </div>
  )
}
function Check({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-[7px]">
      <span className="block size-[13px] rounded-[2px] border border-[#888]" />
      <span className="text-[14px] text-[#0F1111]">{label}</span>
    </div>
  )
}

function Sidebar() {
  return (
    <div className="absolute left-[16px] flex w-[210px] flex-col" style={{ top: 236 }}>
      <FilterGroup title="Popular Shopping Ideas">
        {['Lightweight', 'Travel System', 'Double Stroller', 'Jogging'].map((l) => (
          <span key={l} className="text-[14px] text-[#0F1111]">
            {l}
          </span>
        ))}
        <span className="text-[14px] text-[#007185]">⌄ See more</span>
      </FilterGroup>
      <FilterGroup title="Delivery">
        <Check label="All Prime" />
      </FilterGroup>
      <FilterGroup title="Prime Delivery">
        <Check label="In 3 Hours" />
        <Check label="Today by 6PM" />
        <Check label="Overnight by 8AM" />
      </FilterGroup>
      <FilterGroup title="Customer Reviews">
        <div className="flex items-center gap-[6px]">
          <Stars rating={4} />
          <span className="text-[14px] text-[#0F1111]">&amp; Up</span>
        </div>
      </FilterGroup>
      <FilterGroup title="Age Range">
        <Check label="Birth to 3 Months" />
        <Check label="4 to 7 Months" />
        <Check label="8 to 11 Months" />
        <Check label="12 to 23 Months" />
      </FilterGroup>
      <FilterGroup title="Brands">
        <Check label="Baby Trend" />
        <Check label="Graco" />
        <Check label="Evenflo" />
      </FilterGroup>
    </div>
  )
}

/* ------------------------------------------------------------------ right rail */
/** Maya's cart, empty — she hasn't bought anything yet, which is the whole point of the story.
 *  So the rail shows Amazon's empty-cart state rather than a subtotal and line items. */
function RightRail() {
  return (
    <div className="absolute w-[196px]" style={{ left: 1224, top: 236 }}>
      <div className="flex flex-col items-center gap-[6px] border border-[#e7e7e7] bg-white p-[12px]">
        <div className="flex w-full items-center justify-between">
          <span className="text-[14px] font-bold lowercase tracking-[-0.5px] text-[#131921]">amazon</span>
          <span className="text-[9px] text-[#565959]">▼</span>
        </div>
        <p className="text-[13px] text-[#0F1111]">0 items</p>
        <p className="text-[16px] font-bold text-[#0F1111]">$0.00</p>
        <p className="text-center text-[12px] leading-[16px] text-[#0F1111]">
          Your cart is empty. <span className="text-[#007185]">Shop today’s deals ›</span>
        </p>
        <div className="mt-[4px] flex h-[27px] w-full items-center justify-center rounded-full border border-[#8d8d8d] bg-white text-[12px] text-[#0F1111]">
          Go to Cart
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ page */
export function AmazonSearchPage() {
  return (
    /* `isolate` gives the page its own stacking context, so anything z-indexed inside it stacks
       against the page rather than against Connie's overlays in the root context. */
    <div aria-hidden className="pointer-events-none absolute inset-0 isolate overflow-hidden bg-white">
      {/* Amazon's header sits at the top of its own page, below the browser chrome. */}
      <AmazonChrome query="strollers" top={CHROME_H} />

      {/* Results bar */}
      <div
        className="absolute left-0 flex w-[1440px] items-center justify-between border-b border-[#e7e7e7] bg-white px-[16px]"
        style={{ top: CHROME_H + AMAZON_CHROME_H, height: 40 }}
      >
        <p className="text-[14px] text-[#0F1111]">
          1-48 of over 1,000 results for <span className="font-bold text-[#C7511F]">"strollers"</span>
        </p>
        <div className="flex h-[28px] items-center gap-[6px] rounded-[3px] border border-[#d5d9d9] bg-[#f0f2f2] px-[10px] text-[13px] text-[#0F1111]">
          Sort by: <span className="font-bold">Featured</span>
          <span className="text-[8px]">▼</span>
        </div>
      </div>

      <Sidebar />

      {/* The three strollers Connie has an opinion about. */}
      {SEARCH_ROSTER.map((p, i) => (
        <ProductCard key={p.id} p={p} left={SEARCH_GRID.lefts[i]} />
      ))}

      {/* The next row, cut off by the fold — the page obviously continues. Connie has an opinion
          on these too, so they're laid out from the same grid its badges/shimmer measure from. */}
      {SEARCH_ROW2.map((p, i) => (
        <div
          key={`row2-${p.id}`}
          className="absolute flex items-center justify-center bg-white"
          style={{
            left: SEARCH_GRID.lefts[i],
            top: SEARCH_GRID.row2Top,
            width: SEARCH_GRID.cardWidth,
            height: SEARCH_GRID.row2Height,
          }}
        >
          <img src={p.img} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      ))}

      <RightRail />
    </div>
  )
}
