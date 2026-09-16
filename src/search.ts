import type { QueryParameters } from './http.js';
import { TmdbHttpClient } from './http.js';
import type {
  MovieSearchHit,
  MovieSearchOptions,
  MultiSearchHit,
  SearchMethods,
  SearchOptions,
  TvSearchHit,
  TvSearchOptions,
} from './types.js';
import { validateSearchPage } from './validation.js';

function searchQuery(query: string): string {
  if (typeof query !== 'string' || !query.trim()) {
    throw new TypeError('query must not be empty');
  }
  return query.trim();
}

function year(value: number | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 1000 || value > 9999) {
    throw new TypeError(`${name} must be a four-digit year`);
  }
  return value;
}

function commonParameters(
  query: string,
  options: SearchOptions,
): QueryParameters {
  if (
    options.page !== undefined &&
    (!Number.isSafeInteger(options.page) || options.page < 1)
  ) {
    throw new TypeError('page must be a positive integer');
  }
  if (
    options.includeAdult !== undefined &&
    typeof options.includeAdult !== 'boolean'
  ) {
    throw new TypeError('includeAdult must be a boolean');
  }
  return {
    query: searchQuery(query),
    language: options.language,
    page: options.page,
    include_adult: options.includeAdult,
  };
}

export function createSearchMethods(http: TmdbHttpClient): SearchMethods {
  return {
    async movies(query: string, options: MovieSearchOptions = {}) {
      const parameters = commonParameters(query, options);
      if (options.region !== undefined && !options.region.trim()) {
        throw new TypeError('region must not be empty');
      }
      const payload = await http.get('search/movie', {
        ...parameters,
        year: year(options.year, 'year'),
        primary_release_year: year(
          options.primaryReleaseYear,
          'primaryReleaseYear',
        ),
        region: options.region,
      });
      return validateSearchPage<MovieSearchHit>(payload);
    },
    async tv(query: string, options: TvSearchOptions = {}) {
      const payload = await http.get('search/tv', {
        ...commonParameters(query, options),
        year: year(options.year, 'year'),
        first_air_date_year: year(
          options.firstAirDateYear,
          'firstAirDateYear',
        ),
      });
      return validateSearchPage<TvSearchHit>(payload);
    },
    async multi(query: string, options: SearchOptions = {}) {
      const payload = await http.get('search/multi', commonParameters(query, options));
      return validateSearchPage<MultiSearchHit>(payload, true);
    },
  };
}
