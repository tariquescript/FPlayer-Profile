/**
 * Derived views over a player bundle. The API leaves a few useful facts only in
 * prose or spread across sections, so they are reconstructed here rather than
 * in the components.
 */

/**
 * The profile endpoint has no date of birth field, but its description always
 * ends with "* 21/07/2000 in Leeds, England". Parsing it is the only way to
 * show a birthday, and a miss simply yields nulls.
 */
export function birth(description) {
  if (!description) return { dateOfBirth: null, age: null };

  const match = description.match(/\*\s*(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return { dateOfBirth: null, age: null };

  const [, day, month, yearPart] = match;
  const dateOfBirth = `${yearPart}-${month}-${day}`;
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) return { dateOfBirth: null, age: null };

  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;

  return { dateOfBirth, age: age >= 0 && age < 120 ? age : null };
}

/** Club id -> name, gathered from every section that happens to carry both. */
export function clubNames(bundle) {
  const names = {};
  const add = (id, name) => {
    if (id && name) names[String(id)] = name;
  };

  add(bundle?.profile?.club?.id, bundle?.profile?.club?.name);
  bundle?.marketValue?.marketValueHistory?.forEach((entry) => add(entry.clubId, entry.clubName));
  bundle?.transfers?.transfers?.forEach((transfer) => {
    add(transfer.clubFrom?.id, transfer.clubFrom?.name);
    add(transfer.clubTo?.id, transfer.clubTo?.name);
  });
  bundle?.achievements?.achievements?.forEach((achievement) =>
    achievement.details?.forEach((detail) => add(detail.club?.id, detail.club?.name)),
  );

  return names;
}

/** Headline career numbers for the summary strip. */
export function careerSummary(bundle) {
  const history = bundle?.marketValue?.marketValueHistory ?? [];
  const transfers = bundle?.transfers?.transfers ?? [];
  const achievements = bundle?.achievements?.achievements ?? [];
  const injuries = bundle?.injuries?.injuries ?? [];

  const peak = history.reduce(
    (best, entry) => (Number(entry.marketValue) > (best?.marketValue ?? 0) ? entry : best),
    null,
  );

  const totalFees = transfers.reduce(
    (sum, transfer) => sum + (typeof transfer.fee === 'number' ? transfer.fee : 0),
    0,
  );

  const clubs = new Set();
  transfers.forEach((transfer) => {
    if (transfer.clubTo?.name) clubs.add(transfer.clubTo.name);
    if (transfer.clubFrom?.name) clubs.add(transfer.clubFrom.name);
  });

  const trophies = achievements.reduce((sum, achievement) => sum + (Number(achievement.count) || 0), 0);
  const daysOut = injuries.reduce((sum, entry) => sum + (Number(entry.days) || 0), 0);

  return { peak, totalFees, clubCount: clubs.size, trophies, daysOut, transferCount: transfers.length };
}

/** Value change between the previous valuation and the current one. */
export function valueTrend(history = []) {
  if (history.length < 2) return null;
  const last = Number(history[history.length - 1].marketValue);
  const previous = Number(history[history.length - 2].marketValue);
  if (!previous || !last) return null;

  const delta = last - previous;
  return { delta, percent: (delta / previous) * 100, direction: Math.sign(delta) };
}

/** Best available ranking lines, worldwide first. */
export function rankings(ranking) {
  if (!ranking || typeof ranking !== 'object') return [];
  return Object.entries(ranking)
    .filter(([, position]) => Number.isFinite(Number(position)))
    .map(([scope, position]) => ({ scope, position: Number(position) }))
    .sort((a, b) => {
      if (a.scope === 'Worldwide') return -1;
      if (b.scope === 'Worldwide') return 1;
      return a.position - b.position;
    })
    .slice(0, 6);
}

const SOCIAL_MATCHERS = [
  { test: /instagram\./i, key: 'instagram', label: 'Instagram' },
  { test: /(x\.com|twitter\.)/i, key: 'twitter', label: 'X' },
  { test: /youtube\./i, key: 'youtube', label: 'YouTube' },
  { test: /facebook\./i, key: 'facebook', label: 'Facebook' },
  { test: /tiktok\./i, key: 'tiktok', label: 'TikTok' },
  { test: /twitch\./i, key: 'twitch', label: 'Twitch' },
];

export function classifySocial(url) {
  const match = SOCIAL_MATCHERS.find((matcher) => matcher.test.test(url));
  return match ?? { key: 'portfolio', label: 'Website' };
}
