/**
 * The data gateway as a Vercel Function, on the same domain as the site.
 *
 * vercel.json rewrites every /api/* request here and the Express app routes
 * it (Vercel passes the original URL through). Responses carry s-maxage and
 * stale-while-revalidate, so Vercel's CDN answers repeat requests from the
 * edge and refreshes them in the background — free on the Hobby plan.
 */
import { app } from '../server/src/app.js';

export default app;
