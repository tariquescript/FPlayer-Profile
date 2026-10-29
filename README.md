# Touchline

> Working name — it lives in `src/brand.js` (header, footer, page title and meta
> tags all read it), so renaming the app is a one-line change.

Search any footballer and open a full profile — market value history, transfers,
honours, injuries, shirt numbers, rankings and club squads — built on the
Transfermarkt API.

```
FPlayerProfile/
├── src/              React 19 + Vite + Tailwind v4 frontend
│   ├── lib/          API client, two-tier cache, local search index, formatters
│   ├── hooks/        data hooks (search, profile bundle, club, lazy profile)
│   ├── components/   UI, charts, timeline, small 3D models (components/three)
│   └── pages/        Home, Profile, Club, NotFound
└── server/           caching + aggregating API gateway (Node / Express)
```

## How it stays fast

The upstream API scrapes transfermarkt.com, so an uncached call costs 1–2 s,
a cold Render instance ~40 s, and bursts get refused with `403`. Everything
below exists to hide that.

**In the browser**

- **Cards render from the search response.** The old version fetched a full
  profile for every result before showing anything; now the grid paints as soon
  as the search returns, and each card loads its portrait only when it scrolls
  into view.
- **Instant local matches.** Every player seen in any search is indexed
  (accent-insensitive — `mbappe` finds `Mbappé`). While a new query is in
  flight, matches render on the keystroke itself.
- **Two-tier cache.** Memory for navigation, `sessionStorage` for reloads.
  State is derived during render, so a cached search or profile appears on the
  first frame — this is why going back from a profile restores the results
  instantly.
- **Search lives in the URL** (`/?q=haaland`), and scroll position is
  restored per query.
- **Hover-intent prefetch.** Resting on a card for 140 ms fetches the full
  profile, so it is usually complete by the time you click.
- **Resilience.** Transient failures retry with backoff; a failed id is not
  re-requested for 30 s; a profile with missing sections is shown immediately
  and re-filled in the background.
- **Lean first load.** Routes are code-split and preloaded on idle, so page
  transitions never wait on a chunk. Fonts are self-hosted, trimmed to the
  weights and widths in use, and preloaded.
- **3D that waits its turn.** The small models (ball, trophy, coins, jersey,
  corner flag, red card) are built in code — no model files. three.js loads only
  once the browser is idle and a model is near the viewport; each model draws
  only while visible, shaders compile asynchronously, and weak devices or
  data-saver get a flat fallback instead.

**In the gateway (`server/`)**

- **One request per profile.** `/api/players/:id/bundle` fetches the profile
  and five sections in parallel next to the upstream (six browser round trips
  become one).
- **Shared stale-while-revalidate cache.** Searches are fresh for 30 min and
  served stale (while refreshing in the background) for 12 h; profiles for
  6 h / 7 days. Anything anyone has searched recently is instant for everyone.
- **Warm-up.** 40 popular searches are pre-loaded on boot and every 6 h, spaced
  out so they never trip the upstream rate limit.
- **Keep-alive** heartbeat so Render's free tier does not put the upstream (or
  the gateway, with `SELF_URL` set) to sleep.
- Request coalescing, a concurrency cap on upstream calls, retries on
  `403/429/5xx`, short negative caching, `ETag`/`Cache-Control`, gzip, a
  per-IP rate limit and structured JSON logs.

## Run locally

```bash
npm install
npm --prefix server install

# terminal 1 — gateway on :8787
npm --prefix server run dev

# terminal 2 — app on :5173 (proxies /api to the gateway)
npm run dev
```

`.env.development` sets `VITE_API_BASE=/`, so the dev server talks to the
gateway through Vite's proxy.

## Deploy (free)

Everything runs on free tiers: the site and its data gateway on a personal
Vercel Hobby project, keep-alive and snapshot refresh on GitHub Actions.

1. **Push to `master`.** Vercel builds the site and turns `api/index.js` into a
   Vercel Function on the same domain. `.env.production` sets
   `VITE_API_BASE=/`, so the app calls `/api/*` on its own origin, with no CORS
   and no separate server to host.
2. **Edge caching is automatic.** Gateway responses carry
   `s-maxage` + `stale-while-revalidate`, so Vercel's CDN serves repeat requests
   from the edge (~50 ms) and refreshes them in the background: profiles for 6 h
   fresh / 7 days stale, searches for 30 min / 12 h.
3. **The snapshot ships with the site.** `npm run snapshot` writes full
   profiles for the home-page players and ~40 popular searches to
   `public/snapshot/`; the app renders those instantly and refreshes them in the
   background. `.github/workflows/refresh-snapshot.yml` re-runs it every Monday
   and commits the result, which redeploys the site.
4. **The upstream stays awake.** `.github/workflows/keep-warm.yml` pings the
   Transfermarkt API on Render every 10 minutes, so visitors never meet its
   30–60 s cold start. Scheduled workflows are free on public repositories, and
   one always-on service fits in Render's free 750 hours a month.

In the browser, the cache now lives in `localStorage` with the same
stale-while-revalidate rule: a returning visitor sees every player they have
opened before on the first frame, then gets fresh data a moment later.

`server/` still runs standalone (`npm --prefix server run dev`) for local
development or any Node host; `render.yaml` is kept for that, but production
no longer needs it.

## Configuration

Frontend (`.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE` | *(empty)* | Gateway origin, `/` for same-origin, empty for direct mode |
| `VITE_UPSTREAM_URL` | Render Transfermarkt API | Upstream used in direct mode |
| `VITE_REQUEST_TIMEOUT_MS` | `60000` | Per-request timeout (covers cold starts) |

Gateway (`server/.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `UPSTREAM_URL` | Render Transfermarkt API | API the gateway fronts |
| `PORT` | `8787` | Listen port (Render sets this) |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |
| `SELF_URL` | *(empty)* | Public URL, lets the heartbeat keep the gateway awake |
| `KEEP_ALIVE` | `true` | Heartbeat on/off |
| `UPSTREAM_CONCURRENCY` | `4` | Parallel upstream requests (keep low; the upstream rate-limits) |
| `UPSTREAM_RETRIES` | `3` | Retries for `403/429/5xx` |
| `WARM_CACHE` / `WARM_QUERIES` | `true` / 40 names | Pre-loaded searches |
| `CACHE_MAX_ENTRIES` | `3000` | In-memory cache size |
| `RATE_LIMIT_MAX` | `240` | Requests per IP per minute |

## Gateway API

| Endpoint | Returns |
| --- | --- |
| `GET /api/health` | Status, uptime, cache stats |
| `GET /api/players/search/:name?page=` | Search results |
| `GET /api/players/:id/bundle` | Profile + market value + transfers + shirt numbers + honours + injuries |
| `GET /api/players/:id/:section` | One section (`profile`, `market_value`, `transfers`, `jersey_numbers`, `injuries?page=`, `achievements`, `stats`) |
| `GET /api/players?ids=1,2,3` | Up to 25 profiles in one call |
| `GET /api/clubs/search/:name` | Club search |
| `GET /api/clubs/:id/bundle` | Club profile + squad |
| `GET /api/competitions/search/:name` | Competition search |
| `GET /api/competitions/:id/clubs?season=` | Clubs in a competition |

Responses carry `X-Cache: hit | stale | miss | partial`. A `partial` bundle
(some sections refused upstream) is sent with `no-store` so it is never cached
downstream.

## Notes on the data

- The upstream `stats` endpoint currently returns an empty list for every
  player, so the profile bundle skips it (it is still available individually).
- Date of birth is not a profile field; it is parsed from the profile
  description, which always ends with `* DD/MM/YYYY in …`.
- Some lesser-known players have no portrait on Transfermarkt; they get a
  tinted monogram instead.
