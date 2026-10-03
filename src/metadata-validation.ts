import { invalidResponse, isRecord } from './validation.js';

type Check = (value: unknown) => boolean;

const hasId: Check = (value) => isRecord(value) &&
  Number.isSafeInteger(value.id) && Number(value.id) > 0;
const hasName: Check = (value) => isRecord(value) && typeof value.name === 'string';
const hasFilePath: Check = (value) => isRecord(value) && typeof value.file_path === 'string';
const hasLanguage: Check = (value) => isRecord(value) &&
  typeof value.iso_3166_1 === 'string' && typeof value.iso_639_1 === 'string';
const arrayOf = (item: Check): Check => (value) => Array.isArray(value) && value.every(item);

export const metadataChecks = {
  names: arrayOf(hasName),
  identities: arrayOf(hasId),
  images: arrayOf(hasFilePath),
  credits: arrayOf((value) => hasId(value) && hasName(value)),
  titles: arrayOf((value) => isRecord(value) &&
    typeof value.iso_3166_1 === 'string' && typeof value.title === 'string'),
  keywords: arrayOf((value) => hasId(value) && hasName(value)),
  translations: arrayOf((value) => hasLanguage(value) &&
    isRecord(value) && typeof value.name === 'string' &&
    typeof value.english_name === 'string' && isRecord(value.data)),
  releaseDates: arrayOf((value) => isRecord(value) &&
    typeof value.iso_3166_1 === 'string' &&
    arrayOf((date) => isRecord(date) &&
      (date.certification === undefined || typeof date.certification === 'string') &&
      (date.release_date === undefined || typeof date.release_date === 'string'))(value.release_dates)),
  externalId: (value: unknown) => value === undefined || value === null || typeof value === 'string',
  videos: arrayOf((value) => isRecord(value) &&
    ['id', 'key', 'name', 'site', 'type'].every((key) => typeof value[key] === 'string')),
  watchProviders: (value: unknown) => isRecord(value) &&
    Object.values(value).every((region) => isRecord(region) &&
      (region.link === undefined || typeof region.link === 'string') &&
      ['flatrate', 'rent', 'buy', 'free', 'ads'].every((key) =>
        region[key] === undefined || arrayOf((provider) => isRecord(provider) &&
          Number.isSafeInteger(provider.provider_id) && Number(provider.provider_id) > 0 &&
          typeof provider.provider_name === 'string' &&
          typeof provider.logo_path === 'string')(region[key]))),
} satisfies Record<string, Check>;

export function validateIdShape<T>(
  value: unknown,
  expectedId: number,
  fields: Record<string, Check>,
): T {
  if (!hasId(value) || !isRecord(value) || value.id !== expectedId ||
    !Object.entries(fields).every(([key, check]) => check(value[key]))) {
    invalidResponse();
  }
  return value as T;
}

export function validateLatestMovie<T>(value: unknown): T {
  if (!hasId(value) || !isRecord(value) || typeof value.title !== 'string') {
    invalidResponse();
  }
  return value as T;
}

export function validateMovieChanges<T>(value: unknown): T {
  if (!isRecord(value) || !Array.isArray(value.changes) ||
    !value.changes.every((change: unknown) => isRecord(change) &&
      typeof change.key === 'string' && arrayOf(isRecord)(change.items))) {
    invalidResponse();
  }
  return value as T;
}
