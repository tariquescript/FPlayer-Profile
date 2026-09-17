import { Router } from 'express';
import { config } from '../config.js';
import { combinedState, get, tryGet } from '../lib/upstream.js';
import { sendCached } from '../lib/respond.js';

export const players = Router();

const { search: searchPolicy, player: playerPolicy } = config.cache;

/**
 * The parts of a player that the profile page shows. Everything except the
 * profile is optional: Transfermarkt drops sections for some players, and one
 * missing section must never blank out the page.
 */
const SECTIONS = [
  ['marketValue', 'market_value'],
  ['transfers', 'transfers'],
  ['jerseyNumbers', 'jersey_numbers'],
  ['achievements', 'achievements'],
  ['injuries', 'injuries'],
  // `stats` is left out on purpose: the upstream scraper currently returns an
  // empty list for every player, so it would cost a request and add nothing.
  // It is still reachable through the passthrough route below.
];

players.get('/search/:name', async (req, res) => {
  const name = encodeURIComponent(req.params.name.trim());
  const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
  const result = await get(`/players/search/${name}?page_number=${page}`, searchPolicy);
  sendCached(res, result, searchPolicy);
});

/**
 * One round trip for the whole profile page. Fetching seven endpoints from the
 * browser costs seven RTTs to Render; here they run in parallel next to the
 * upstream and come back as a single payload.
 */
players.get('/:id/bundle', async (req, res) => {
  const { id } = req.params;

  const [profile, ...sections] = await Promise.all([
    get(`/players/${id}/profile`, playerPolicy),
    ...SECTIONS.map(([, path]) => tryGet(`/players/${id}/${path}`, playerPolicy)),
  ]);

  const bundle = { id, profile: profile.value, fetchedAt: new Date().toISOString() };
  const partial = [];

  SECTIONS.forEach(([key], index) => {
    const section = sections[index];
    bundle[key] = section.value;
    if (section.value === null) partial.push(key);
  });

  bundle.partial = partial;

  if (partial.length) {
    // A degraded bundle must not be cached downstream: the missing sections
    // are usually a passing upstream refusal and will load on the next try.
    console.warn(JSON.stringify({ t: new Date().toISOString(), message: 'partial bundle', id, partial }));
    res.set('Cache-Control', 'no-store');
    res.set('X-Cache', 'partial');
    return res.json(bundle);
  }

  const state = combinedState([profile, ...sections]);
  const age = Math.max(profile.age, ...sections.map((section) => section.age || 0));
  sendCached(res, { value: bundle, state, age }, playerPolicy);
});

/** Individual passthroughs, useful for progressive loading and debugging. */
const PASSTHROUGH = ['profile', 'market_value', 'transfers', 'jersey_numbers', 'stats', 'injuries', 'achievements'];

players.get('/:id/:section', async (req, res, next) => {
  const { id, section } = req.params;
  if (!PASSTHROUGH.includes(section)) return next();

  const query = req.query.page ? `?page_number=${Number(req.query.page) || 1}` : '';
  const result = await get(`/players/${id}/${section}${query}`, playerPolicy);
  sendCached(res, result, playerPolicy);
});

/**
 * Batched profiles for a result grid. The browser asks once and the gateway
 * fans out with a concurrency cap, so a 10-card grid is one request instead of
 * ten waterfalled ones.
 */
players.get('/', async (req, res) => {
  const ids = String(req.query.ids || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 25);

  if (!ids.length) return res.status(400).json({ error: 'ids query parameter is required' });

  const results = await Promise.all(
    ids.map((id) => tryGet(`/players/${id}/profile`, playerPolicy)),
  );

  const profiles = {};
  ids.forEach((id, index) => {
    if (results[index].value) profiles[id] = results[index].value;
  });

  sendCached(res, { value: { profiles }, state: 'batch', age: 0 }, playerPolicy);
});
