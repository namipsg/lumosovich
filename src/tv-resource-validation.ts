import { validRated } from './catalog-validation.js';
import { invalidResponse, isRecord } from './validation.js';
import type {
  TvEpisodeGroupDetails, TvEpisodeGroupsResponse, TvSeasonAccountStates,
} from './tv-resource-types.js';

const positive = (value: unknown): boolean => Number.isSafeInteger(value) && Number(value) > 0;
const slot = (value: unknown): boolean => Number.isSafeInteger(value) && Number(value) >= 0;
const namedGroup = (value: unknown): boolean => isRecord(value) &&
  typeof value.id === 'string' && !!value.id && typeof value.name === 'string';

export function validateSeasonAccountStates(value: unknown): TvSeasonAccountStates {
  if (!isRecord(value) || !positive(value.id) || !Array.isArray(value.results) ||
    !value.results.every((result: unknown) => isRecord(result) &&
      positive(result.id) && slot(result.episode_number) && validRated(result.rated))) {
    invalidResponse();
  }
  return value as unknown as TvSeasonAccountStates;
}

export function validateEpisodeGroups(value: unknown, seriesId: number): TvEpisodeGroupsResponse {
  if (!isRecord(value) || value.id !== seriesId || !Array.isArray(value.results) ||
    !value.results.every(namedGroup)) {
    invalidResponse();
  }
  return value as unknown as TvEpisodeGroupsResponse;
}

export function validateEpisodeGroupDetails(value: unknown, groupId: string): TvEpisodeGroupDetails {
  if (!namedGroup(value) || !isRecord(value) || value.id !== groupId ||
    !Array.isArray(value.groups) || !value.groups.every((group: unknown) =>
      namedGroup(group) && isRecord(group) && slot(group.order) &&
      Array.isArray(group.episodes) && group.episodes.every((episode: unknown) =>
        isRecord(episode) && positive(episode.id) &&
        slot(episode.season_number) && slot(episode.episode_number) &&
        typeof episode.name === 'string'))) {
    invalidResponse();
  }
  return value as unknown as TvEpisodeGroupDetails;
}
