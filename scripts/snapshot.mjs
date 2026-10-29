/**
 * Bakes data into the deploy: full profiles for the players on the home page
 * and results for popular searches, written as static JSON under
 * public/snapshot/ (served from Vercel's CDN), plus a small manifest the app
 * imports so it knows what exists.
 *
 *   npm run snapshot
 *
 * Run it whenever you like; a GitHub Action also runs it weekly. Anything the
 * upstream fails to return keeps its previous file, so a bad run never makes
 * the snapshot worse.
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Be gentle with the upstream: it scrapes transfermarkt.com on every request,
// and transfermarkt.com blocks a scraper that asks too often. One request at a
// time, with a pause after each player and search.
process.env.UPSTREAM_CONCURRENCY ??= '1';
process.env.UPSTREAM_TIMEOUT_MS ??= '60000';
const PAUSE_MS = 2_000;
const pause = () => new Promise((resolve) => setTimeout(resolve, PAUSE_MS));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'snapshot');

const { config } = await import('../server/src/config.js');
const { get, tryGet } = await import('../server/src/lib/upstream.js');
const { FEATURED } = await import('../src/lib/featured.js');
const { searchSlug } = await import('../src/lib/playerIndex.js');

const SECTIONS = [
  ['marketValue', 'market_value'],
  ['transfers', 'transfers'],
  ['jerseyNumbers', 'jersey_numbers'],
  ['achievements', 'achievements'],
  ['injuries', 'injuries'],
];
const policy = { ttl: 0, swr: 0 };

const SEARCHES = [
  ...new Set([...config.warm.queries, 'haaland', 'bellingham', 'yamal', 'mbappe', 'musiala', 'saka', 'pedri']),
];

async function bundleFor(id) {
  const [profile, ...sections] = await Promise.all([
    get(`/players/${id}/profile`, policy),
    ...SECTIONS.map(([, section]) => tryGet(`/players/${id}/${section}`, policy)),
  ]);
  const bundle = { id, profile: profile.value, fetchedAt: new Date().toISOString(), partial: [] };
  SECTIONS.forEach(([key], index) => {
    bundle[key] = sections[index].value;
    if (sections[index].value === null) bundle.partial.push(key);
  });
  return bundle;
}

const existing = async (dir) => {
  try {
    return (await readdir(dir)).filter((file) => file.endsWith('.json')).map((file) => file.slice(0, -5));
  } catch {
    return [];
  }
};

await mkdir(path.join(out, 'players'), { recursive: true });
await mkdir(path.join(out, 'search'), { recursive: true });

let wrote = 0;
let kept = 0;

for (const player of FEATURED) {
  try {
    const bundle = await bundleFor(player.id);
    if (bundle.partial.length) throw new Error(`missing ${bundle.partial.join(', ')}`);
    await writeFile(path.join(out, 'players', `${player.id}.json`), JSON.stringify(bundle));
    wrote += 1;
    console.log(`player  ${player.name.padEnd(18)} ok`);
  } catch (error) {
    kept += 1;
    console.warn(`player  ${player.name.padEnd(18)} kept previous (${error.message})`);
  }
  await pause();
}

for (const query of SEARCHES) {
  const slug = searchSlug(query);
  try {
    const result = await get(`/players/search/${encodeURIComponent(query)}?page_number=1`, policy);
    if (!result.value?.results?.length) throw new Error('no results');
    await writeFile(path.join(out, 'search', `${slug}.json`), JSON.stringify(result.value));
    wrote += 1;
    console.log(`search  ${query.padEnd(18)} ok`);
  } catch (error) {
    kept += 1;
    console.warn(`search  ${query.padEnd(18)} kept previous (${error.message})`);
  }
  await pause();
}

const manifest = {
  generatedAt: new Date().toISOString(),
  players: await existing(path.join(out, 'players')),
  searches: await existing(path.join(out, 'search')),
};
await writeFile(path.join(root, 'src', 'lib', 'snapshot-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`\n${wrote} written, ${kept} kept from before — ${manifest.players.length} players, ${manifest.searches.length} searches.`);
