// Temporary feature switches. Flip these when the blocker behind them clears.

// Liga Pokémon has no public API and their pages are scraped server-side,
// which Cloudflare blocks from Vercel's IPs. Card price badges stay hidden
// until we have a workable price source.
export const PRICES_ENABLED = false;

// Soft caps while the Fichário is in beta — cheap to raise later, just here.
export const BINDER_LIMITS = {
  /** signed-in accounts */
  user: 5,
  /** guest / not signed in (no guest binders yet — reserved for when there are) */
  guest: 2,
} as const;
