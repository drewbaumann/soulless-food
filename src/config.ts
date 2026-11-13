/**
 * Ads. Leave ADSENSE_CLIENT empty to render no ads at all (dev shows placeholders instead).
 * Set it to your publisher ID ("ca-pub-1234567890123456") and each slot ID from
 * AdSense > Ads > By ad unit. A slot with an empty ID is skipped.
 */
export const ADSENSE_CLIENT = "";

export const AD_SLOTS = {
  beforeRecipe: "", // post page, between the story and the recipe card
  afterRecipe: "", // post page, below the recipe card
  inFeed: "", // homepage grid, every FEED_AD_EVERY cards
} as const;

export const FEED_AD_EVERY = 9;

export type AdSlotName = keyof typeof AD_SLOTS;
export const adsEnabled = ADSENSE_CLIENT.startsWith("ca-pub-");
