import manifest from './snapshot-manifest.json';
import { searchSlug } from './playerIndex.js';

/**
 * Data baked into the deploy by `npm run snapshot`: full profiles for the
 * players on the home page and results for popular searches, served as static
 * files from Vercel's CDN.
 *
 * The app shows a snapshot the moment it is asked for — even right after a
 * deploy, or while the data service is asleep — and then fetches a fresh copy
 * in the background. Only the list of what exists ships in the JavaScript, so
 * a name not in the snapshot costs nothing.
 */

const players = new Set(manifest.players);
const searches = new Set(manifest.searches);

async function load(path) {
  try {
    const response = await fetch(`/snapshot/${path}`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export function snapshotBundle(id) {
  return players.has(String(id)) ? load(`players/${id}.json`) : Promise.resolve(null);
}

export function snapshotSearch(query, page = 1) {
  const slug = searchSlug(query);
  return page === 1 && searches.has(slug) ? load(`search/${slug}.json`) : Promise.resolve(null);
}
