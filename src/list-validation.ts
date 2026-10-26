import type { CreateListResponse, ListDetails, ListItemStatus, ListMutationResponse } from './list-types.js';
import { invalidResponse, isRecord } from './validation.js';

function positive(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function count(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function nullableString(value: unknown): boolean {
  return value === null || typeof value === 'string';
}

function movie(value: unknown): boolean {
  return isRecord(value) && positive(value.id) &&
    ['title', 'original_title', 'original_language', 'overview', 'release_date']
      .every((key) => typeof value[key] === 'string') &&
    typeof value.adult === 'boolean' && typeof value.video === 'boolean' &&
    Array.isArray(value.genre_ids) && value.genre_ids.every(positive) &&
    finite(value.popularity) && nullableString(value.poster_path) &&
    nullableString(value.backdrop_path) && finite(value.vote_average) &&
    count(value.vote_count) && (value.media_type === undefined || value.media_type === 'movie');
}

export function validateListDetails(value: unknown, expectedId: number): ListDetails {
  if (!isRecord(value) ||
    !(value.id === expectedId || value.id === String(expectedId)) ||
    !['created_by', 'description', 'iso_639_1', 'name'].every((key) => typeof value[key] === 'string') ||
    !count(value.favorite_count) || !count(value.item_count) ||
    !nullableString(value.poster_path) || !Array.isArray(value.items) || !value.items.every(movie)) {
    invalidResponse();
  }
  return value as unknown as ListDetails;
}

export function validateListItemStatus(value: unknown, expectedId: number): ListItemStatus {
  if (!isRecord(value) ||
    !(value.id === expectedId || value.id === String(expectedId)) ||
    typeof value.item_present !== 'boolean') {
    invalidResponse();
  }
  return value as unknown as ListItemStatus;
}

export function validateListMutation(value: unknown): ListMutationResponse {
  if (!isRecord(value) || !positive(value.status_code) || typeof value.status_message !== 'string' ||
    (value.success !== undefined && typeof value.success !== 'boolean')) {
    invalidResponse();
  }
  return value as unknown as ListMutationResponse;
}

export function validateCreateList(value: unknown): CreateListResponse {
  const response = validateListMutation(value);
  if (typeof response.success !== 'boolean' || !positive(response.list_id)) invalidResponse();
  return response as CreateListResponse;
}
