import { TmdbError } from './errors.js';
import type { TvEpisodeDetails, TvSeasonDetails } from './detail-types.js';
import type { FindResponse, FindHit, SearchPage } from './types.js';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasId(value: unknown): value is FindHit {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    Number.isSafeInteger(value.id) &&
    value.id > 0
  );
}

export function invalidResponse(): never {
  throw new TmdbError('INVALID_RESPONSE', 'TMDB returned an unexpected response');
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function validateFindResponse(value: unknown): FindResponse {
  if (!isRecord(value)) invalidResponse();
  const keys = [
    'movie_results',
    'tv_results',
    'tv_season_results',
    'tv_episode_results',
    'person_results',
  ];
  if (
    !keys.every(
      (key) => Array.isArray(value[key]) && value[key].every(hasId),
    )
  ) {
    invalidResponse();
  }
  return value as unknown as FindResponse;
}

export function validateSearchPage<T extends FindHit>(
  value: unknown,
  requireMediaType = false,
): SearchPage<T> {
  if (!isRecord(value)) invalidResponse();
  if (
    !isCount(value.page) ||
    value.page < 1 ||
    !isCount(value.total_pages) ||
    !isCount(value.total_results) ||
    !Array.isArray(value.results) ||
    !value.results.every(
      (result: unknown) =>
        hasId(result) &&
        (!requireMediaType ||
          ['movie', 'tv', 'person'].includes(
            String((result as Record<string, unknown>).media_type),
          )),
    )
  ) {
    invalidResponse();
  }
  return value as unknown as SearchPage<T>;
}

export function validateDetailResponse<T>(
  value: unknown,
  expectedId: number,
  nameField: 'title' | 'name',
): T {
  if (
    !hasId(value) ||
    value.id !== expectedId ||
    typeof value[nameField] !== 'string'
  ) {
    invalidResponse();
  }
  return value as T;
}

function isSlotNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function validateSeasonResponse(
  value: unknown,
  seriesId: number,
  seasonNumber: number,
): TvSeasonDetails {
  if (
    !hasId(value) ||
    value.season_number !== seasonNumber ||
    typeof value.name !== 'string' ||
    !Array.isArray(value.episodes) ||
    !value.episodes.every(
      (episode: unknown) =>
        hasId(episode) &&
        episode.season_number === seasonNumber &&
        isSlotNumber(episode.episode_number) &&
        typeof episode.name === 'string' &&
        (episode.show_id === undefined || episode.show_id === seriesId),
    )
  ) {
    invalidResponse();
  }
  return value as TvSeasonDetails;
}

export function validateEpisodeResponse(
  value: unknown,
  seriesId: number,
  seasonNumber: number,
  episodeNumber: number,
): TvEpisodeDetails {
  if (
    !hasId(value) ||
    (value.show_id !== undefined && value.show_id !== seriesId) ||
    value.season_number !== seasonNumber ||
    value.episode_number !== episodeNumber ||
    typeof value.name !== 'string'
  ) {
    invalidResponse();
  }
  return value as TvEpisodeDetails;
}
