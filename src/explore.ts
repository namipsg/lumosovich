import { TmdbHttpClient } from './http.js';
import { positiveId } from './ids.js';
import type {
  KeywordDetails, KeywordMethods, KeywordMoviesPage, NetworkAlternativeNamesResponse,
  NetworkDetails, NetworkImagesResponse, NetworkMethods, ReviewMethods,
  TrendingMethods, TrendingWindow,
} from './catalog-types.js';
import type { MovieSearchHit } from './types.js';
import { validateReviewDetails, validateIdPage } from './catalog-validation.js';
import { metadataChecks, validateIdShape } from './metadata-validation.js';
import { validateSearchPage } from './validation.js';

function timeWindow(value: TrendingWindow): TrendingWindow {
  if (value !== 'day' && value !== 'week') {
    throw new TypeError('time window must be day or week');
  }
  return value;
}

function page(value: number | undefined): number | undefined {
  if (value !== undefined && (!Number.isSafeInteger(value) || value < 1)) {
    throw new TypeError('page must be a positive integer');
  }
  return value;
}

export function createTrendingMethods(http: TmdbHttpClient): TrendingMethods {
  return {
    async all(window, options = {}) {
      return validateSearchPage(await http.get(`trending/all/${timeWindow(window)}`,
        { language: options.language }), true);
    },
    async movies(window, options = {}) {
      return validateSearchPage(await http.get(`trending/movie/${timeWindow(window)}`,
        { language: options.language }));
    },
    async people(window, options = {}) {
      return validateSearchPage(await http.get(`trending/person/${timeWindow(window)}`,
        { language: options.language }));
    },
    async tv(window, options = {}) {
      return validateSearchPage(await http.get(`trending/tv/${timeWindow(window)}`,
        { language: options.language }));
    },
  };
}

export function createReviewMethods(http: TmdbHttpClient): ReviewMethods {
  return {
    async get(id) {
      if (typeof id !== 'string' || !id.trim() || ['.', '..'].includes(id.trim())) {
        throw new TypeError('review ID must be a nonempty path identifier');
      }
      const validId = id.trim();
      return validateReviewDetails(await http.get(`review/${encodeURIComponent(validId)}`,
        {}, { includeLanguage: false }), validId);
    },
  };
}

export function createKeywordMethods(http: TmdbHttpClient): KeywordMethods {
  return {
    async get(id) {
      const validId = positiveId(id);
      return validateIdShape<KeywordDetails>(await http.get(`keyword/${validId}`,
        {}, { includeLanguage: false }), validId, { name: (value) => typeof value === 'string' });
    },
    async movies(id, options = {}) {
      const validId = positiveId(id);
      if (options.includeAdult !== undefined && typeof options.includeAdult !== 'boolean') {
        throw new TypeError('includeAdult must be a boolean');
      }
      return validateIdPage<MovieSearchHit>(await http.get(`keyword/${validId}/movies`, {
        language: options.language, page: page(options.page), include_adult: options.includeAdult,
      }), validId) as KeywordMoviesPage;
    },
  };
}

export function createNetworkMethods(http: TmdbHttpClient): NetworkMethods {
  return {
    async get(id) {
      const validId = positiveId(id);
      return validateIdShape<NetworkDetails>(await http.get(`network/${validId}`,
        {}, { includeLanguage: false }), validId, { name: (value) => typeof value === 'string' });
    },
    async alternativeNames(id) {
      const validId = positiveId(id);
      return validateIdShape<NetworkAlternativeNamesResponse>(await http.get(
        `network/${validId}/alternative_names`, {}, { includeLanguage: false },
      ), validId, { results: metadataChecks.names });
    },
    async images(id) {
      const validId = positiveId(id);
      return validateIdShape<NetworkImagesResponse>(await http.get(`network/${validId}/images`,
        {}, { includeLanguage: false }), validId, { logos: metadataChecks.images });
    },
  };
}
