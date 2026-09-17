import { config } from '../config.js';

/**
 * TTL cache with stale-while-revalidate and single-flight de-duplication.
 *
 * Three states per key:
 *   fresh  -> served immediately
 *   stale  -> served immediately, refreshed in the background
 *   absent -> awaited, and concurrent callers share the one in-flight promise
 */
class SwrCache {
  #entries = new Map();
  #inflight = new Map();
  #max;

  stats = { hit: 0, stale: 0, miss: 0, coalesced: 0, errors: 0 };

  constructor(max = 1_000) {
    this.#max = max;
  }

  #touch(key, entry) {
    // Map keeps insertion order, so re-inserting marks the key as most recent.
    this.#entries.delete(key);
    this.#entries.set(key, entry);
  }

  #evict() {
    while (this.#entries.size > this.#max) {
      const oldest = this.#entries.keys().next().value;
      this.#entries.delete(oldest);
    }
  }

  peek(key) {
    const entry = this.#entries.get(key);
    if (!entry) return null;
    if (Date.now() > entry.staleUntil) {
      this.#entries.delete(key);
      return null;
    }
    return entry;
  }

  set(key, value, ttl, swr) {
    const now = Date.now();
    this.#touch(key, {
      value,
      storedAt: now,
      freshUntil: now + ttl,
      staleUntil: now + ttl + swr,
    });
    this.#evict();
  }

  #load(key, ttl, swr, producer) {
    const pending = this.#inflight.get(key);
    if (pending) {
      this.stats.coalesced += 1;
      return pending;
    }

    const promise = (async () => {
      const value = await producer();
      this.set(key, value, ttl, swr);
      return value;
    })()
      .catch((error) => {
        this.stats.errors += 1;
        throw error;
      })
      .finally(() => {
        this.#inflight.delete(key);
      });

    this.#inflight.set(key, promise);
    return promise;
  }

  /** Resolves to `{ value, state }` where state is hit | stale | miss. */
  async resolve(key, { ttl, swr }, producer) {
    const entry = this.peek(key);

    if (entry && Date.now() <= entry.freshUntil) {
      this.stats.hit += 1;
      return { value: entry.value, state: 'hit', age: Date.now() - entry.storedAt };
    }

    if (entry) {
      this.stats.stale += 1;
      // Kick off a refresh but never let its failure reject this request.
      this.#load(key, ttl, swr, producer).catch(() => {});
      return { value: entry.value, state: 'stale', age: Date.now() - entry.storedAt };
    }

    this.stats.miss += 1;
    const value = await this.#load(key, ttl, swr, producer);
    return { value, state: 'miss', age: 0 };
  }

  get size() {
    return this.#entries.size;
  }

  clear() {
    this.#entries.clear();
    this.#inflight.clear();
  }
}

export const cache = new SwrCache(config.cache.maxEntries);
