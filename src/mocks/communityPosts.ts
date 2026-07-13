/**
 * ILLUSTRATIVE community posts for the social-listening concept.
 *
 * These are AUTHORED SAMPLES, not live-scraped data — we don't run a real social-listening
 * pipeline yet (Instagram/TikTok/Pinterest have no open content APIs). They exist to demo the
 * vision: when a shopper connects communities in onboarding, Connie surfaces community sentiment
 * alongside the real CR + web evidence.
 *
 * Every community offered in onboarding (N4a) has an entry for every insight category, so whatever
 * the shopper connects actually shows up. Keep this clearly separate from the real evidence.
 */

export type CommunitySource =
  | 'Instagram'
  | 'Reddit'
  | 'YouTube'
  | 'Tiktok'
  | 'Pinterest'
  | 'Online blogs'

export type CommunityPost = { source: CommunitySource; handle: string; quote: string }

export const communityPosts: Record<string, CommunityPost[]> = {
  safety: [
    { source: 'Instagram', handle: '@nyc.momlife', quote: 'Feel so secure with the harness + brakes — zero wobble on hills.' },
    { source: 'Reddit', handle: 'r/BeyondtheBump', quote: 'Stability is unreal. Never once felt like it would tip.' },
    { source: 'YouTube', handle: 'Stroller Lab', quote: 'Passed every tip test we threw at it in this walkthrough.' },
    { source: 'Tiktok', handle: '@parenthacks', quote: 'The brake locks with one tap. Genuinely reassuring.' },
    { source: 'Pinterest', handle: 'Safe Baby Gear', quote: 'Pinned as a top safety pick for city parents.' },
    { source: 'Online blogs', handle: 'The Stroller Diary', quote: 'Stable over curbs and cobblestone, no white-knuckle moments.' },
  ],
  maneuverability: [
    { source: 'Instagram', handle: '@strollergrams', quote: 'One-hand steering through packed farmers markets, no problem.' },
    { source: 'Reddit', handle: 'r/Strollers', quote: 'Turns on a dime. Best handling stroller I have pushed.' },
    { source: 'YouTube', handle: 'Gear Test Weekly', quote: 'Cornering is effortless even loaded with a diaper bag.' },
    { source: 'Tiktok', handle: '@citydad', quote: 'Pushed it through a crowded subway platform one-handed. Easy.' },
    { source: 'Pinterest', handle: 'Urban Parenting', quote: 'Saved for its tight turning radius in small shops.' },
    { source: 'Online blogs', handle: 'Pram Notes', quote: 'Glides rather than fights you — a rare thing at this size.' },
  ],
  ease_of_use: [
    { source: 'Instagram', handle: '@dad_at_home', quote: 'So intuitive my partner set it up without the manual.' },
    { source: 'Reddit', handle: 'r/NewParents', quote: 'Adjustments are all one-click. Genuinely easy day to day.' },
    { source: 'YouTube', handle: 'First Time Parents', quote: 'Assembled it on camera in under ten minutes, no tools drama.' },
    { source: 'Tiktok', handle: '@momsofttips', quote: 'Recline, harness, canopy — all one-handed. Sold.' },
    { source: 'Pinterest', handle: 'Baby Gear Guides', quote: 'Pinned for the simplest setup we have tried.' },
    { source: 'Online blogs', handle: 'Everyday Parent', quote: 'The kind of stroller you stop thinking about — it just works.' },
  ],
  durability: [
    { source: 'Instagram', handle: '@twinmomdiaries', quote: 'On baby #2 and it still looks brand new. Built like a tank.' },
    { source: 'Reddit', handle: 'r/BeyondtheBump', quote: 'Two years of daily abuse and the frame is flawless.' },
    { source: 'YouTube', handle: 'Long Term Review', quote: 'Three years in: no rattles, no sag, wheels still true.' },
    { source: 'Tiktok', handle: '@thriftyparent', quote: 'Bought second-hand and it still feels solid. Holds value.' },
    { source: 'Pinterest', handle: 'Hand-Me-Down Gear', quote: 'Saved as a buy-once-cry-once pick.' },
    { source: 'Online blogs', handle: 'Pram Notes', quote: 'Fabric and frame shrug off what usually wrecks strollers.' },
  ],
  fold: [
    { source: 'Instagram', handle: '@citystroller', quote: 'Honestly the fold is bulky — eats my whole trunk.' },
    { source: 'Reddit', handle: 'r/Strollers', quote: 'Great stroller but the two-hand fold is a workout.' },
    { source: 'YouTube', handle: 'Stroller Lab', quote: 'Folding it on camera took both hands and some patience.' },
    { source: 'Tiktok', handle: '@parenthacks', quote: 'Fair warning: this fold is NOT a one-hander.' },
    { source: 'Pinterest', handle: 'Small Space Living', quote: 'Skipped it — too big folded for our apartment closet.' },
    { source: 'Online blogs', handle: 'The Stroller Diary', quote: 'The fold is the one place this stroller asks something of you.' },
  ],
  value: [
    { source: 'Instagram', handle: '@budgetbaby', quote: 'Pricey, but resale held 70% — worth it long term.' },
    { source: 'Reddit', handle: 'r/Frugal', quote: 'Expensive upfront, but it lasts and resells. Net worth it.' },
    { source: 'YouTube', handle: 'Gear Test Weekly', quote: 'Cost per year of use, it undercuts cheaper strollers.' },
    { source: 'Tiktok', handle: '@thriftyparent', quote: 'Sticker shock, then relief. Nothing else lasted this long.' },
    { source: 'Pinterest', handle: 'Baby Budget Board', quote: 'Pinned under "splurges that actually pay off".' },
    { source: 'Online blogs', handle: 'Everyday Parent', quote: 'Not cheap. Arguably still the best value in the category.' },
  ],
  comfort: [
    { source: 'Instagram', handle: '@parkstrolls', quote: 'Seat is huge and plush — baby naps every single walk.' },
    { source: 'Reddit', handle: 'r/BeyondtheBump', quote: 'Roomiest seat we tried, converts easily as they grow.' },
    { source: 'YouTube', handle: 'First Time Parents', quote: 'Our toddler actually stays put in it. That says everything.' },
    { source: 'Tiktok', handle: '@momsofttips', quote: 'The recline is so smooth she never wakes up.' },
    { source: 'Pinterest', handle: 'Nap Time Wins', quote: 'Saved for the "naps anywhere" seat padding.' },
    { source: 'Online blogs', handle: 'Pram Notes', quote: 'Suspension takes the sting out of bad pavement.' },
  ],
  service: [
    { source: 'Instagram', handle: '@momreviews', quote: 'Warranty claim was painless, replacement shipped in days.' },
    { source: 'Reddit', handle: 'r/NewParents', quote: 'Customer service actually answered and fixed it fast.' },
    { source: 'YouTube', handle: 'Long Term Review', quote: 'They sent a replacement part free, no fight required.' },
    { source: 'Tiktok', handle: '@citydad', quote: 'Cracked a wheel, had a new one in a week. No charge.' },
    { source: 'Pinterest', handle: 'Baby Gear Guides', quote: 'Noted for genuinely good after-sales support.' },
    { source: 'Online blogs', handle: 'The Stroller Diary', quote: 'Support is responsive — rarer than it should be.' },
  ],
}
