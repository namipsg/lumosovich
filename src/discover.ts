import { TmdbHttpClient } from './http.js';
import type { QueryParameters } from './http.js';
import type { DiscoverMethods, MovieDiscoverOptions, TvDiscoverOptions } from './catalog-types.js';
import type { MovieSearchHit, SearchPage, TvSearchHit } from './types.js';
import { validateSearchPage } from './validation.js';

type Kind = 'text' | 'date' | 'year' | 'integer' | 'page' | 'number' | 'boolean';
type Field = readonly [queryName: string, kind: Kind];

const common: Record<string, Field> = {
  language: ['language', 'text'],
  page: ['page', 'page'],
  includeAdult: ['include_adult', 'boolean'],
  sortBy: ['sort_by', 'text'],
  voteAverageGte: ['vote_average.gte', 'number'],
  voteAverageLte: ['vote_average.lte', 'number'],
  voteCountGte: ['vote_count.gte', 'integer'],
  voteCountLte: ['vote_count.lte', 'integer'],
  watchRegion: ['watch_region', 'text'],
  withCompanies: ['with_companies', 'text'],
  withGenres: ['with_genres', 'text'],
  withKeywords: ['with_keywords', 'text'],
  withOriginCountry: ['with_origin_country', 'text'],
  withOriginalLanguage: ['with_original_language', 'text'],
  withRuntimeGte: ['with_runtime.gte', 'integer'],
  withRuntimeLte: ['with_runtime.lte', 'integer'],
  withWatchMonetizationTypes: ['with_watch_monetization_types', 'text'],
  withWatchProviders: ['with_watch_providers', 'text'],
  withoutCompanies: ['without_companies', 'text'],
  withoutGenres: ['without_genres', 'text'],
  withoutKeywords: ['without_keywords', 'text'],
  withoutWatchProviders: ['without_watch_providers', 'text'],
};

const movie: Record<string, Field> = {
  ...common,
  certification: ['certification', 'text'],
  certificationGte: ['certification.gte', 'text'],
  certificationLte: ['certification.lte', 'text'],
  certificationCountry: ['certification_country', 'text'],
  includeVideo: ['include_video', 'boolean'],
  primaryReleaseYear: ['primary_release_year', 'year'],
  primaryReleaseDateGte: ['primary_release_date.gte', 'date'],
  primaryReleaseDateLte: ['primary_release_date.lte', 'date'],
  region: ['region', 'text'],
  releaseDateGte: ['release_date.gte', 'date'],
  releaseDateLte: ['release_date.lte', 'date'],
  withCast: ['with_cast', 'text'],
  withCrew: ['with_crew', 'text'],
  withPeople: ['with_people', 'text'],
  withReleaseType: ['with_release_type', 'integer'],
  year: ['year', 'year'],
};

const tv: Record<string, Field> = {
  ...common,
  airDateGte: ['air_date.gte', 'date'],
  airDateLte: ['air_date.lte', 'date'],
  firstAirDateYear: ['first_air_date_year', 'year'],
  firstAirDateGte: ['first_air_date.gte', 'date'],
  firstAirDateLte: ['first_air_date.lte', 'date'],
  includeNullFirstAirDates: ['include_null_first_air_dates', 'boolean'],
  screenedTheatrically: ['screened_theatrically', 'boolean'],
  timezone: ['timezone', 'text'],
  withNetworks: ['with_networks', 'integer'],
  withStatus: ['with_status', 'text'],
  withType: ['with_type', 'text'],
};

function parseValue(name: string, value: unknown, kind: Kind): string | number | boolean {
  if (kind === 'boolean') {
    if (typeof value !== 'boolean') throw new TypeError(`${name} must be a boolean`);
    return value;
  }
  if (kind === 'text' || kind === 'date') {
    if (typeof value !== 'string' || !value.trim()) {
      throw new TypeError(`${name} must be a nonempty string`);
    }
    const trimmed = value.trim();
    if (kind === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) ||
      Number.isNaN(Date.parse(`${trimmed}T00:00:00Z`)) ||
      new Date(`${trimmed}T00:00:00Z`).toISOString().slice(0, 10) !== trimmed)) {
      throw new TypeError(`${name} must be a valid YYYY-MM-DD date`);
    }
    return trimmed;
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 ||
    (kind !== 'number' && !Number.isSafeInteger(value))) {
    throw new TypeError(`${name} must be a nonnegative ${kind === 'number' ? 'number' : 'integer'}`);
  }
  if (kind === 'page' && value < 1) throw new TypeError('page must be a positive integer');
  if (kind === 'year' && (value < 1000 || value > 9999)) {
    throw new TypeError(`${name} must be a four-digit year`);
  }
  return value;
}

function parameters(options: object, fields: Record<string, Field>): QueryParameters {
  const query: QueryParameters = {};
  const values = options as Record<string, unknown>;
  for (const [name, value] of Object.entries(values)) {
    const field = fields[name];
    if (!field) throw new TypeError(`Unsupported discover option: ${name}`);
    if (value !== undefined) query[field[0]] = parseValue(name, value, field[1]);
  }
  for (const [lower, upper] of [
    ['voteAverageGte', 'voteAverageLte'], ['voteCountGte', 'voteCountLte'],
    ['withRuntimeGte', 'withRuntimeLte'],
    ['airDateGte', 'airDateLte'], ['firstAirDateGte', 'firstAirDateLte'],
    ['primaryReleaseDateGte', 'primaryReleaseDateLte'], ['releaseDateGte', 'releaseDateLte'],
  ]) {
    if (values[lower] !== undefined && values[upper] !== undefined &&
      (values[lower] as number | string) > (values[upper] as number | string)) {
      throw new TypeError(`${lower} must be on or below ${upper}`);
    }
  }
  return query;
}

export function createDiscoverMethods(http: TmdbHttpClient): DiscoverMethods {
  return {
    async movies(options: MovieDiscoverOptions = {}): Promise<SearchPage<MovieSearchHit>> {
      return validateSearchPage(await http.get('discover/movie', parameters(options, movie)));
    },
    async tv(options: TvDiscoverOptions = {}): Promise<SearchPage<TvSearchHit>> {
      return validateSearchPage(await http.get('discover/tv', parameters(options, tv)));
    },
  };
}

/** Query names supported by this client; checked against the pinned OpenAPI in tests. */
export const discoverQueryNames = {
  movie: Object.values(movie).map(([name]) => name),
  tv: Object.values(tv).map(([name]) => name),
};
