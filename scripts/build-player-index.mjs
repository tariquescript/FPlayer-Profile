/**
 * Writes public/snapshot/index.json: every player found in the baked search
 * results, in the shape a search result has. The app loads it once (about
 * 10 kB over the wire) and answers searches from it on the first keystroke —
 * and when live search is unavailable, it is what still finds players.
 *
 *   node scripts/build-player-index.mjs
 *
 * The snapshot script runs this at the end; it needs no network.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = path.join(root, 'public', 'snapshot');

export async function buildPlayerIndex() {
  const dir = path.join(snapshot, 'search');
  const files = (await readdir(dir)).filter((file) => file.endsWith('.json'));
  const players = new Map();

  for (const file of files) {
    const { results = [] } = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
    results.forEach(({ id, name, position, club, age, nationalities, marketValue }) => {
      if (!id || !name) return;
      players.set(id, { id, name, position, club, age, nationalities, marketValue });
    });
  }

  const list = [...players.values()].sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));
  await writeFile(path.join(snapshot, 'index.json'), JSON.stringify(list));
  return list.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`index.json: ${await buildPlayerIndex()} players`);
}
