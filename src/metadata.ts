import { TmdbHttpClient } from './http.js';
import type { QueryParameters } from './http.js';
import { positiveId } from './ids.js';
import type { MovieDetails, MovieReleaseDatesResponse } from './detail-types.js';
import type {
  CollectionDetails,
  CollectionImagesResponse,
  CollectionMethods,
  CompanyAlternativeNamesResponse,
  CompanyDetails,
  CompanyImagesResponse,
  CompanyMethods,
  ImageOptions,
  MovieAlternativeTitlesResponse,
  MovieChangesOptions,
  MovieChangesResponse,
  MovieCreditsResponse,
  MovieExternalIdsResponse,
  MovieImagesResponse,
  MovieKeywordsResponse,
  MovieMetadataMethods,
  MovieVideosResponse,
  MovieWatchProvidersResponse,
  TranslationsResponse,
} from './metadata-types.js';
import { metadataChecks, validateIdShape, validateLatestMovie, validateMovieChanges } from './metadata-validation.js';
import type { LanguageOptions } from './reference-types.js';

export function imageParameters(options: ImageOptions): QueryParameters {
  const languages = options.imageLanguages;
  if (languages !== undefined && (
    !Array.isArray(languages) || languages.length === 0 ||
    languages.some((language) => typeof language !== 'string' ||
      !language.trim() || language.includes(','))
  )) {
    throw new TypeError('imageLanguages must be a nonempty array of language values');
  }
  return {
    language: options.language,
    include_image_language: languages ? [...new Set(languages.map((value) => value.trim()))].join(',') : undefined,
  };
}

function changeParameters(options: MovieChangesOptions): QueryParameters {
  const dates = [options.startDate, options.endDate];
  for (const date of dates) {
    if (date === undefined) continue;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
      throw new TypeError('startDate and endDate must be valid YYYY-MM-DD dates');
    }
  }
  if (options.startDate && options.endDate && options.startDate > options.endDate) {
    throw new TypeError('startDate must be on or before endDate');
  }
  if (options.page !== undefined && (!Number.isSafeInteger(options.page) || options.page < 1)) {
    throw new TypeError('page must be a positive integer');
  }
  return { start_date: options.startDate, end_date: options.endDate, page: options.page };
}

export function createMovieMetadataMethods(http: TmdbHttpClient): MovieMetadataMethods {
  return {
    async alternativeTitles(id, options = {}) {
      const validId = positiveId(id);
      const country = options.country;
      if (country !== undefined && (typeof country !== 'string' || !country.trim())) {
        throw new TypeError('country must be a nonempty string');
      }
      return validateIdShape<MovieAlternativeTitlesResponse>(
        await http.get(`movie/${validId}/alternative_titles`, { country: country?.trim() }, { includeLanguage: false }),
        validId, { titles: metadataChecks.titles },
      );
    },
    async changes(id, options = {}) {
      const validId = positiveId(id);
      return validateMovieChanges<MovieChangesResponse>(
        await http.get(`movie/${validId}/changes`, changeParameters(options), { includeLanguage: false }),
      );
    },
    async credits(id, options: LanguageOptions = {}) {
      const validId = positiveId(id);
      return validateIdShape<MovieCreditsResponse>(
        await http.get(`movie/${validId}/credits`, { language: options.language }),
        validId, { cast: metadataChecks.credits, crew: metadataChecks.credits },
      );
    },
    async externalIds(id) {
      const validId = positiveId(id);
      return validateIdShape<MovieExternalIdsResponse>(
        await http.get(`movie/${validId}/external_ids`, {}, { includeLanguage: false }),
        validId, {
          imdb_id: metadataChecks.externalId,
          wikidata_id: metadataChecks.externalId,
          facebook_id: metadataChecks.externalId,
          instagram_id: metadataChecks.externalId,
          twitter_id: metadataChecks.externalId,
        },
      );
    },
    async images(id, options = {}) {
      const validId = positiveId(id);
      return validateIdShape<MovieImagesResponse>(
        await http.get(`movie/${validId}/images`, imageParameters(options)),
        validId, {
          backdrops: metadataChecks.images,
          logos: metadataChecks.images,
          posters: metadataChecks.images,
        },
      );
    },
    async keywords(id) {
      const validId = positiveId(id);
      return validateIdShape<MovieKeywordsResponse>(
        await http.get(`movie/${validId}/keywords`, {}, { includeLanguage: false }),
        validId, { keywords: metadataChecks.keywords },
      );
    },
    async latest() {
      return validateLatestMovie<MovieDetails>(await http.get('movie/latest', {}, { includeLanguage: false }));
    },
    async releaseDates(id) {
      const validId = positiveId(id);
      return validateIdShape<MovieReleaseDatesResponse>(
        await http.get(`movie/${validId}/release_dates`, {}, { includeLanguage: false }),
        validId, { results: metadataChecks.releaseDates },
      );
    },
    async translations(id) {
      const validId = positiveId(id);
      return validateIdShape<TranslationsResponse>(
        await http.get(`movie/${validId}/translations`, {}, { includeLanguage: false }),
        validId, { translations: metadataChecks.translations },
      );
    },
    async videos(id, options: LanguageOptions = {}) {
      const validId = positiveId(id);
      return validateIdShape<MovieVideosResponse>(
        await http.get(`movie/${validId}/videos`, { language: options.language }),
        validId, { results: metadataChecks.videos },
      );
    },
    async watchProviders(id) {
      const validId = positiveId(id);
      return validateIdShape<MovieWatchProvidersResponse>(
        await http.get(`movie/${validId}/watch/providers`, {}, { includeLanguage: false }),
        validId, { results: metadataChecks.watchProviders },
      );
    },
  };
}

export function createCollectionMethods(http: TmdbHttpClient): CollectionMethods {
  return {
    async get(id, options = {}) {
      const validId = positiveId(id);
      return validateIdShape<CollectionDetails>(
        await http.get(`collection/${validId}`, { language: options.language }),
        validId, { name: (value) => typeof value === 'string', parts: metadataChecks.identities },
      );
    },
    async images(id, options = {}) {
      const validId = positiveId(id);
      return validateIdShape<CollectionImagesResponse>(
        await http.get(`collection/${validId}/images`, imageParameters(options)),
        validId, { backdrops: metadataChecks.images, posters: metadataChecks.images },
      );
    },
    async translations(id) {
      const validId = positiveId(id);
      return validateIdShape<TranslationsResponse>(
        await http.get(`collection/${validId}/translations`, {}, { includeLanguage: false }),
        validId, { translations: metadataChecks.translations },
      );
    },
  };
}

export function createCompanyMethods(http: TmdbHttpClient): CompanyMethods {
  return {
    async get(id) {
      const validId = positiveId(id);
      return validateIdShape<CompanyDetails>(
        await http.get(`company/${validId}`, {}, { includeLanguage: false }),
        validId, { name: (value) => typeof value === 'string' },
      );
    },
    async alternativeNames(id) {
      const validId = positiveId(id);
      return validateIdShape<CompanyAlternativeNamesResponse>(
        await http.get(`company/${validId}/alternative_names`, {}, { includeLanguage: false }),
        validId, { results: metadataChecks.names },
      );
    },
    async images(id) {
      const validId = positiveId(id);
      return validateIdShape<CompanyImagesResponse>(
        await http.get(`company/${validId}/images`, {}, { includeLanguage: false }),
        validId, { logos: metadataChecks.images },
      );
    },
  };
}
