/**
 * The retailer's own catalogue — what Amazon says about these products, before Connie touches them.
 *
 * This is the single source of truth for a product's NAME, PRICE and PHOTO across the prototype:
 * the mocked Amazon search page, the mocked product page, and Decision Support's saved cards all
 * read from here. They used to restate each other, which is how the saved list ended up naming a
 * stroller that wasn't the one on the page behind it.
 *
 * Connie's *opinions* (rank, rationale, evidence) live with Connie — see
 * `features/decisionSupport/screens.tsx`. Only the retailer's facts belong in this file.
 *
 * The three strollers here are the live CR roster — see `backend-data/README.md`. Changing a name
 * here means changing it in the CR data file and the Langflow prompt too.
 */

const A = '/figma/ds-'

export type RetailProduct = {
  id: string
  /** The full Amazon listing title, as it appears on the retailer's page. */
  amazonTitle: string
  /** The short name Connie uses in its own cards and chat. */
  name: string
  brand: string
  price: string
  listPrice?: string
  /** Star rating out of 5, and the review count Amazon shows beside it. */
  rating: number
  ratingCount: string
  bought: string
  img: string
  /** Extra shots for the product page gallery. */
  gallery?: string[]
  colors: string[]
  delivery: string
  deliveryNote?: string
  prime: boolean
  bestSeller?: boolean
  count?: string
}

export const AMAZON_PRODUCTS: Record<string, RetailProduct> = {
  aero: {
    id: 'aero',
    amazonTitle:
      'Dream On Me Aero Travel Umbrella Stroller, One-Hand Quick Fold, 3-Point Safety Harness, Dual Brakes, Adjustable Backrest, Black',
    name: 'Dream On Me Aero Travel Umbrella',
    brand: 'Dream On Me',
    price: '$33.99',
    listPrice: '$39.99',
    rating: 4.4,
    ratingCount: '1K',
    bought: '1K+ bought in past month',
    img: `${A}prod-aero.png`,
    colors: ['#3a3a3a', '#9a9a9a', '#d8c3c3'],
    delivery: 'Wed, Jun 17',
    prime: true,
  },
  babytrend: {
    id: 'babytrend',
    amazonTitle:
      'Baby Trend Passport® Switch 6-in-1 Modular Stroller Travel System with EZ-Lift™ Plus Infant Car Seat, Dash Black',
    name: 'Baby Trend Passport Switch 6-in-1',
    brand: 'Baby Trend',
    price: '$199.99',
    listPrice: '$249.99',
    rating: 4.6,
    ratingCount: '928',
    bought: '1K+ bought in past month',
    img: `${A}prod-babytrend.png`,
    gallery: [
      `${A}prod-babytrend.png`,
      `${A}prod-babytrend-stroller.png`,
      `${A}prod-babytrend-bassinet.png`,
      `${A}prod-babytrend-carseat.png`,
    ],
    colors: ['#1a1a1a', '#4a4a52'],
    delivery: 'Wed, Jun 24',
    deliveryNote: 'for Prime members',
    prime: false,
    count: '1 Count (Pack of 1)',
  },
  graco: {
    id: 'graco',
    amazonTitle:
      'Graco Ready2Grow 2.0 Double Stroller, Twin Baby Stroller Features Bench Seat and Standing Platform Options, Gotham',
    name: 'Graco Ready2Grow 2.0 Double Stroller',
    brand: 'Graco',
    price: '$299.00',
    rating: 4.6,
    ratingCount: '5.1K',
    bought: '1K+ bought in past month',
    img: `${A}prod-graco.png`,
    colors: ['#3f4652', '#9a9a9a'],
    delivery: 'Wed, Jun 17',
    prime: true,
    bestSeller: true,
    count: '1 Count (Pack of 1)',
  },
  evenflo: {
    id: 'evenflo',
    amazonTitle:
      'Evenflo Pivot NXT Travel System with LiteMax NXT Infant Car Seat, Modular Design, Latte Tan',
    name: 'Evenflo Pivot NXT Travel System',
    brand: 'Evenflo',
    price: '$379.99',
    rating: 4.5,
    ratingCount: '2.3K',
    bought: '500+ bought in past month',
    img: `${A}prod-evenflo.png`,
    colors: ['#c8b9a3', '#3a3a3a'],
    delivery: 'Thu, Jun 18',
    prime: true,
  },
  joie: {
    id: 'joie',
    amazonTitle: 'Joie Baby, Kava and Rue Travel System with Infant Car Seat, Lightweight, Oyster',
    name: 'Joie Baby Kava & Rue Travel System',
    brand: 'Joie',
    price: '$549.99',
    rating: 4.3,
    ratingCount: '16',
    bought: '200+ bought in past month',
    img: `${A}prod-joie.png`,
    colors: ['#b9b4a8', '#2f2f2f'],
    delivery: 'Fri, Jun 19',
    prime: true,
  },
}

/** The three strollers in the Amazon search page's first row, left to right. */
export const SEARCH_ROSTER: RetailProduct[] = [
  AMAZON_PRODUCTS.aero,
  AMAZON_PRODUCTS.babytrend,
  AMAZON_PRODUCTS.graco,
]

/** The second row, cut off by the fold. Connie badges these too — all three are passes. */
export const SEARCH_ROW2: RetailProduct[] = [
  AMAZON_PRODUCTS.evenflo,
  AMAZON_PRODUCTS.joie,
  AMAZON_PRODUCTS.aero,
]

/** The product whose detail page the shopper opens — Connie's #1 pick, and the one she saves. */
export const PDP_PRODUCT = AMAZON_PRODUCTS.babytrend
