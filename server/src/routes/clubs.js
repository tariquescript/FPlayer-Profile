import { Router } from 'express';
import { config } from '../config.js';
import { combinedState, get, tryGet } from '../lib/upstream.js';
import { sendCached } from '../lib/respond.js';

export const clubs = Router();

const { search: searchPolicy, club: clubPolicy } = config.cache;

clubs.get('/search/:name', async (req, res) => {
  const name = encodeURIComponent(req.params.name.trim());
  const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
  const result = await get(`/clubs/search/${name}?page_number=${page}`, searchPolicy);
  sendCached(res, result, searchPolicy);
});

/** Club profile plus squad in a single response. */
clubs.get('/:id/bundle', async (req, res) => {
  const { id } = req.params;
  const [profile, squad] = await Promise.all([
    get(`/clubs/${id}/profile`, clubPolicy),
    tryGet(`/clubs/${id}/players`, clubPolicy),
  ]);

  const value = {
    id,
    profile: profile.value,
    players: squad.value?.players ?? [],
    partial: squad.value ? [] : ['players'],
  };

  sendCached(res, { value, state: combinedState([profile, squad]), age: profile.age }, clubPolicy);
});

clubs.get('/:id/profile', async (req, res) => {
  const result = await get(`/clubs/${req.params.id}/profile`, clubPolicy);
  sendCached(res, result, clubPolicy);
});

clubs.get('/:id/players', async (req, res) => {
  const result = await get(`/clubs/${req.params.id}/players`, clubPolicy);
  sendCached(res, result, clubPolicy);
});
