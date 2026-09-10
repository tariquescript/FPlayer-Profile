/**
 * An in-memory index of every player this browser has seen in a search
 * response. While a new query is in flight, matches from here render at once,
 * so typing "bellin" after having searched "bell" shows cards immediately and
 * the network answer only refines them.
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

export function indexPlayers(list = []) {
  list.forEach((player) => {
    if (!player?.id || !player.name) return;
    players.set(player.id, { ...player, _tokens: normalize(player.name).split(/[\s-]+/) });
  });
}

/** Rebuild from search responses persisted by the session cache. */
function hydrate() {
  hydrated = true;
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith('fpp:v2:search:'))
      .forEach((key) => {
        const entry = JSON.parse(sessionStorage.getItem(key) || 'null');
        indexPlayers(entry?.value?.results);
      });
  } catch {
    /* storage unavailable */
  }
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
