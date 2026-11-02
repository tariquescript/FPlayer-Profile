import { storedValues } from './cache.js';

/**
 * An in-memory index of every player this browser has seen in a search
 * response, plus the players baked into the site (public/snapshot/index.json).
 * While a new query is in flight, matches from here render at once, so typing
 * "bellin" shows cards immediately and the network answer only refines them;
 * when live search is unavailable, they are what still answers.
 */

const players = new Map();
let hydrated = false;

/** Letters NFD cannot decompose because they are not accented forms. */
const STANDALONE = { ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' };

/** Lowercase and strip accents, so "mbappe" finds "Mbappé" and "odegaard" finds "Ødegaard". */
export function normalize(text = '') {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[øæœßłđðþı]/g, (letter) => STANDALONE[letter])
    .trim();
}

/** A file-name-safe form of a search, shared by the snapshot script and the app. */
export function searchSlug(query = '') {
  return normalize(query).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** `keep` leaves players already indexed alone, so baked data never overwrites a fresher result. */
export function indexPlayers(list = [], { keep = false } = {}) {
  list.forEach((player) => {
    if (!player?.id || !player.name || (keep && players.has(player.id))) return;
    players.set(player.id, { ...player, _tokens: normalize(player.name).split(/[\s-]+/) });
  });
}

let known = null;

/** Loads the players baked into the site, once. Resolves when they are searchable. */
export function loadKnownPlayers() {
  if (!known) {
    known = fetch('/snapshot/index.json')
      .then((response) => (response.ok ? response.json() : []))
      .then((list) => indexPlayers(Array.isArray(list) ? list : [], { keep: true }))
      .catch(() => {
        known = null;
      });
  }
  return known;
}

/** Rebuild from search responses the cache has kept from earlier visits. */
function hydrate() {
  hydrated = true;
  storedValues('search:').forEach((value) => indexPlayers(value?.results));
}

/**
 * Every query token must prefix one of the name's tokens; results are ordered
 * by market value, which is a decent proxy for who the visitor meant.
 */
export function localSearch(query, limit = 12) {
  if (!hydrated) hydrate();
  const terms = normalize(query).split(/[\s-]+/).filter(Boolean);
  if (!terms.length) return [];

  const matches = [];
  for (const player of players.values()) {
    const hit = terms.every((term) => player._tokens.some((token) => token.startsWith(term)));
    if (hit) matches.push(player);
  }

  return matches
    .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))
    .slice(0, limit);
}
