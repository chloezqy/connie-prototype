import { BrowserChrome, GoogleFavicon } from '@/components/browser/BrowserChrome'
import { AmazonSearchPage } from '@/components/retail/AmazonSearchPage'
import { AmazonProductPage } from '@/components/retail/AmazonProductPage'
import { PDP_PRODUCT } from '@/mocks/retail'

/**
 * The retailer pages Connie overlays. One component each, so the page is identical on every
 * screen that shows it.
 *
 * These are MOCKED PAGES, not screenshots. That matters for more than fidelity: the products on
 * them read from `mocks/retail.ts`, the same source Decision Support's cards read, so the page
 * behind Connie can never name a different stroller than the card in front of it. (It used to:
 * the product page was an Evenflo listing while every Connie surface said Baby Trend.)
 *
 * Both render at FULL COLOUR. Connie's panels separate themselves with the 10% `DimOverlay`
 * scrim, not by washing the retailer out — a faded page reads as "broken", and it misrepresents
 * what the extension does to the pages you browse. The only screen that dims is the guided tour,
 * where the dimming *is* the spotlight.
 */

/** Browser tabs shown on the Amazon screens. */
const AMAZON_TABS = (title: string) => [
  { title: 'Baby registry checklist', favicon: <GoogleFavicon size={14} /> },
  { title, favicon: <AmazonFavicon />, active: true },
  { title: 'Inbox (3)', favicon: <GoogleFavicon size={14} /> },
]

function AmazonFavicon() {
  return (
    <span className="flex size-[14px] items-center justify-center rounded-[3px] bg-[#ff9900] text-[9px] font-bold leading-none text-[#111]">
      a
    </span>
  )
}

/** Amazon search results — three strollers. Where the shopper lands from Google. */
export function RetailBackdrop() {
  return (
    <>
      {/* Page first, chrome over it: the page is laid out in frame coordinates and draws behind
          the browser's strip, so the geometry it exports needs no offset. */}
      <AmazonSearchPage />
      <BrowserChrome tabs={AMAZON_TABS('Amazon.com: strollers')} url="https://www.amazon.com/s?k=strollers" />
    </>
  )
}

/** The Amazon product page. The background from the inline annotation onward: it stays put under
 *  the chat, decision support / saved list, and the share flow. */
export function ProductBackdrop() {
  return (
    <>
      <AmazonProductPage />
      <BrowserChrome
        tabs={AMAZON_TABS(`Amazon.com: ${PDP_PRODUCT.name}`)}
        url="https://www.amazon.com/dp/B0CJ4M8KLP"
      />
    </>
  )
}
