/** The retailer pages Connie overlays. One component each so the image, position, and size are
 *  identical on every screen that shows them.
 *
 *  Both render at FULL COLOUR. Connie's panels separate themselves from the page with the 10%
 *  `DimOverlay` scrim, not by washing the retailer out — a faded page reads as "broken", and it
 *  also misrepresents what the extension actually does to the pages you browse. The only screen
 *  that still dims is the guided tour, where the dimming *is* the spotlight. */

/** Amazon search results — three strollers. Where the shopper lands from Google. */
export const RETAIL_BG = '/figma/insights-bg.png'

/** Amazon product detail page. The background from the inline annotation onward: it stays put
 *  under the chat, decision support / saved list, and the share flow. */
export const PRODUCT_BG = '/figma/annot-backdrop.png'

export function RetailBackdrop({ opacity = 1 }: { opacity?: number }) {
  return (
    <img
      src={RETAIL_BG}
      alt=""
      className="pointer-events-none absolute object-cover"
      style={{ left: -110, top: 0, width: 1720, height: 1074, opacity }}
    />
  )
}

export function ProductBackdrop({ opacity = 1 }: { opacity?: number }) {
  return (
    <img
      src={PRODUCT_BG}
      alt=""
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      style={{ opacity }}
    />
  )
}
