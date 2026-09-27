import type {
  CertificationsResponse,
  ConfigurationResponse,
  Country,
  CountryTimezones,
  DepartmentJobs,
  GenresResponse,
  Language,
} from './reference-types.js';
import { invalidResponse, isRecord } from './validation.js';

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function stringFields(value: unknown, fields: string[]): value is Record<string, unknown> {
  return isRecord(value) && fields.every((field) => typeof value[field] === 'string');
}

function arrayOf<T>(value: unknown, matches: (item: unknown) => boolean): T[] {
  if (!Array.isArray(value) || !value.every(matches)) invalidResponse();
  return value as T[];
}

export function validateConfiguration(value: unknown): ConfigurationResponse {
  if (
    !isRecord(value) ||
    !stringFields(value.images, ['base_url', 'secure_base_url']) ||
    !['backdrop_sizes', 'logo_sizes', 'poster_sizes', 'profile_sizes', 'still_sizes']
      .every((key) => strings((value.images as Record<string, unknown>)[key])) ||
    !strings(value.change_keys)
  ) invalidResponse();
  return value as unknown as ConfigurationResponse;
}

export function validateCountries(value: unknown): Country[] {
  return arrayOf<Country>(value, (item) =>
    stringFields(item, ['iso_3166_1', 'english_name', 'native_name']));
}

export function validateJobs(value: unknown): DepartmentJobs[] {
  return arrayOf<DepartmentJobs>(value, (item) =>
    stringFields(item, ['department']) && strings(item.jobs));
}

export function validateLanguages(value: unknown): Language[] {
  return arrayOf<Language>(value, (item) =>
    stringFields(item, ['iso_639_1', 'english_name', 'name']));
}

export function validateTranslations(value: unknown): string[] {
  if (!strings(value)) invalidResponse();
  return value;
}

export function validateTimezones(value: unknown): CountryTimezones[] {
  return arrayOf<CountryTimezones>(value, (item) =>
    stringFields(item, ['iso_3166_1']) && strings(item.zones));
}

export function validateCertifications(value: unknown): CertificationsResponse {
  if (
    !isRecord(value) || !isRecord(value.certifications) ||
    !Object.values(value.certifications).every((list) =>
      Array.isArray(list) && list.every((item: unknown) =>
        stringFields(item, ['certification', 'meaning']) &&
        typeof item.order === 'number' && Number.isSafeInteger(item.order) && item.order >= 0))
  ) invalidResponse();
  return value as unknown as CertificationsResponse;
}

export function validateGenres(value: unknown): GenresResponse {
  if (
    !isRecord(value) || !Array.isArray(value.genres) ||
    !value.genres.every((item: unknown) =>
      stringFields(item, ['name']) &&
      typeof item.id === 'number' && Number.isSafeInteger(item.id) && item.id > 0)
  ) invalidResponse();
  return value as unknown as GenresResponse;
}
