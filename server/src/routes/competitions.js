import { Router } from 'express';
import { config } from '../config.js';
import { get } from '../lib/upstream.js';
import { sendCached } from '../lib/respond.js';

export const competitions = Router();

const { search: searchPolicy, competition: competitionPolicy } = config.cache;

competitions.get('/search/:name', async (req, res) => {
  const name = encodeURIComponent(req.params.name.trim());
  const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
  const result = await get(`/competitions/search/${name}?page_number=${page}`, searchPolicy);
  sendCached(res, result, searchPolicy);
});

competitions.get('/:id/clubs', async (req, res) => {
  const season = req.query.season ? `?season_id=${encodeURIComponent(req.query.season)}` : '';
  const result = await get(`/competitions/${req.params.id}/clubs${season}`, competitionPolicy);
  sendCached(res, result, competitionPolicy);
});
