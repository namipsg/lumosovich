import type { TmdbId } from './types.js';

export function positiveId(id: TmdbId): TmdbId {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new TypeError('TMDB ID must be a positive integer');
  }
  return id;
}
