const CREST_HOST = 'https://tmssl.akamaized.net/images/wappen';
const LOGO_HOST = 'https://tmssl.akamaized.net/images/logo';

/**
 * Club crests are addressable by id, so a card can show one with no API call.
 * The variant is picked for a 2x display: `small` is 30px (0.8 kB), `medium`
 * 58x76 (7 kB) — no reason to ship the latter to a 14px icon.
 */
export function clubCrest(clubId, displaySize = 24) {
  if (!clubId) return null;
  const variant = displaySize <= 15 ? 'small' : 'medium';
  return `${CREST_HOST}/${variant}/${clubId}.png`;
}

/** Competition logos, keyed by Transfermarkt's competition code (e.g. GB1). */
export function competitionLogo(competitionId) {
  if (!competitionId) return null;
  return `${LOGO_HOST}/verysmall/${String(competitionId).toLowerCase()}.png`;
}

/** Deterministic accent per player, so placeholder avatars stay stable. */
export function accentFor(seed = '') {
  const hues = [158, 172, 200, 262, 292, 32];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hues[hash % hues.length];
}

/** Transfermarkt marks retired and free players with a placeholder club id. */
export const RETIRED_CLUB_ID = '123';
export const WITHOUT_CLUB_IDS = new Set(['123', '515']);
