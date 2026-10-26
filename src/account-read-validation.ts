import type { AccountDetails } from './account-read-types.js';
import type { FindHit, SearchPage } from './types.js';
import { invalidResponse, isRecord, validateSearchPage } from './validation.js';

const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const positive = (value: unknown): value is number => count(value) && value > 0;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const nullableString = (value: unknown): boolean => value === null || typeof value === 'string';
const strings = (value: Record<string, unknown>, keys: string[]): boolean => keys.every((key) => typeof value[key] === 'string');
const rating = (value: unknown): boolean => finite(value) && value >= 0.5 && value <= 10 && Number.isInteger(value * 2);

export function validateAccountDetails(value: unknown, accountId: number): AccountDetails {
  if (!isRecord(value) || value.id !== accountId ||
    !strings(value, ['iso_639_1', 'iso_3166_1', 'name', 'username']) || typeof value.include_adult !== 'boolean' ||
    !isRecord(value.avatar) || !isRecord(value.avatar.gravatar) || typeof value.avatar.gravatar.hash !== 'string' ||
    !isRecord(value.avatar.tmdb) || !nullableString(value.avatar.tmdb.avatar_path)) invalidResponse();
  return value as unknown as AccountDetails;
}

function media(item: FindHit, kind: 'movie' | 'tv'): boolean {
  return strings(item, ['original_language', 'overview', ...(kind === 'movie'
    ? ['title', 'original_title', 'release_date'] : ['name', 'original_name', 'first_air_date'])]) &&
    typeof item.adult === 'boolean' && (kind !== 'movie' || typeof item.video === 'boolean') &&
    Array.isArray(item.genre_ids) && item.genre_ids.every(positive) &&
    (kind !== 'tv' || (Array.isArray(item.origin_country) && item.origin_country.every((country) => typeof country === 'string'))) &&
    finite(item.popularity) && finite(item.vote_average) && count(item.vote_count) &&
    nullableString(item.poster_path) && nullableString(item.backdrop_path) &&
    (item.media_type === undefined || item.media_type === kind);
}

export function validateAccountPage<T extends FindHit>(
  value: unknown, kind: 'movie' | 'tv' | 'episode' | 'list', rated = false,
): SearchPage<T> {
  const page = validateSearchPage<T>(value);
  if (!page.results.every((item) => {
    if (kind === 'list') return strings(item, ['description', 'iso_639_1', 'list_type', 'name']) &&
      count(item.favorite_count) && count(item.item_count) && nullableString(item.poster_path);
    if (kind === 'episode') return strings(item, ['name', 'overview', 'production_code']) &&
      nullableString(item.air_date) && nullableString(item.still_path) &&
      (item.runtime === null || count(item.runtime)) && positive(item.show_id) &&
      count(item.season_number) && count(item.episode_number) && finite(item.vote_average) &&
      count(item.vote_count) && rating(item.rating);
    return media(item, kind) && (!rated || rating(item.rating));
  })) invalidResponse();
  return page;
}
