import { TmdbHttpClient } from './http.js';
import { positiveId } from './ids.js';
import { imageParameters } from './metadata.js';
import { metadataChecks, validateIdShape, validateLatestDetail } from './metadata-validation.js';
import { isRecord } from './validation.js';
import type { LanguageOptions } from './reference-types.js';
import type { TvDetails } from './detail-types.js';
import type {
  TvAlternativeTitlesResponse, TvCreditsResponse, TvExternalIdsResponse,
  TvImagesResponse, TvKeywordsResponse, TvMetadataMethods,
  TvScreenedTheatricallyResponse, TvTranslationsResponse, TvVideosResponse,
  TvVideoOptions, TvWatchProvidersResponse,
} from './tv-types.js';

function videoParameters(options: TvVideoOptions): { language?: string; include_video_language?: string } {
  const languages = options.videoLanguages;
  if (languages !== undefined && (!Array.isArray(languages) || languages.length === 0 ||
    languages.some((language) => typeof language !== 'string' ||
      !language.trim() || language.includes(',')))) {
    throw new TypeError('videoLanguages must be a nonempty array of language values');
  }
  return {
    language: options.language,
    include_video_language: languages
      ? [...new Set(languages.map((language) => language.trim()))].join(',')
      : undefined,
  };
}

const contentRatings = (value: unknown): boolean => Array.isArray(value) && value.every((item) =>
  isRecord(item) && typeof item.iso_3166_1 === 'string' && typeof item.rating === 'string' &&
  (item.descriptors === undefined || (Array.isArray(item.descriptors) &&
    item.descriptors.every((descriptor: unknown) => typeof descriptor === 'string'))));

const screenedEpisodes = (value: unknown): boolean => Array.isArray(value) && value.every((item) =>
  isRecord(item) && Number.isSafeInteger(item.id) && Number(item.id) > 0 &&
  Number.isSafeInteger(item.season_number) && Number(item.season_number) >= 0 &&
  Number.isSafeInteger(item.episode_number) && Number(item.episode_number) >= 0);

export function createTvMetadataMethods(http: TmdbHttpClient): TvMetadataMethods {
  return {
    async aggregateCredits(id, options: LanguageOptions = {}) {
      const validId = positiveId(id);
      return validateIdShape<TvCreditsResponse>(
        await http.get(`tv/${validId}/aggregate_credits`, { language: options.language }),
        validId, { cast: metadataChecks.credits, crew: metadataChecks.credits },
      );
    },
    async alternativeTitles(id) {
      const validId = positiveId(id);
      return validateIdShape<TvAlternativeTitlesResponse>(
        await http.get(`tv/${validId}/alternative_titles`, {}, { includeLanguage: false }),
        validId, { results: metadataChecks.titles },
      );
    },
    async contentRatings(id) {
      const validId = positiveId(id);
      return validateIdShape(
        await http.get(`tv/${validId}/content_ratings`, {}, { includeLanguage: false }),
        validId, { results: contentRatings },
      );
    },
    async credits(id, options: LanguageOptions = {}) {
      const validId = positiveId(id);
      return validateIdShape<TvCreditsResponse>(
        await http.get(`tv/${validId}/credits`, { language: options.language }),
        validId, { cast: metadataChecks.credits, crew: metadataChecks.credits },
      );
    },
    async externalIds(id) {
      const validId = positiveId(id);
      return validateIdShape<TvExternalIdsResponse>(
        await http.get(`tv/${validId}/external_ids`, {}, { includeLanguage: false }),
        validId, {
          imdb_id: metadataChecks.externalId,
          wikidata_id: metadataChecks.externalId,
          tvdb_id: (value) => value === undefined || value === null ||
            (Number.isSafeInteger(value) && Number(value) > 0),
        },
      );
    },
    async images(id, options = {}) {
      const validId = positiveId(id);
      return validateIdShape<TvImagesResponse>(
        await http.get(`tv/${validId}/images`, imageParameters(options)),
        validId, {
          backdrops: metadataChecks.images,
          logos: metadataChecks.images,
          posters: metadataChecks.images,
        },
      );
    },
    async keywords(id) {
      const validId = positiveId(id);
      return validateIdShape<TvKeywordsResponse>(
        await http.get(`tv/${validId}/keywords`, {}, { includeLanguage: false }),
        validId, { results: metadataChecks.keywords },
      );
    },
    async latest() {
      return validateLatestDetail<TvDetails>(await http.get('tv/latest', {}, { includeLanguage: false }), 'name');
    },
    async screenedTheatrically(id) {
      const validId = positiveId(id);
      return validateIdShape<TvScreenedTheatricallyResponse>(
        await http.get(`tv/${validId}/screened_theatrically`, {}, { includeLanguage: false }),
        validId, { results: screenedEpisodes },
      );
    },
    async translations(id) {
      const validId = positiveId(id);
      return validateIdShape<TvTranslationsResponse>(
        await http.get(`tv/${validId}/translations`, {}, { includeLanguage: false }),
        validId, { translations: metadataChecks.translations },
      );
    },
    async videos(id, options: TvVideoOptions = {}) {
      const validId = positiveId(id);
      return validateIdShape<TvVideosResponse>(
        await http.get(`tv/${validId}/videos`, videoParameters(options)),
        validId, { results: metadataChecks.videos },
      );
    },
    async watchProviders(id) {
      const validId = positiveId(id);
      return validateIdShape<TvWatchProvidersResponse>(
        await http.get(`tv/${validId}/watch/providers`, {}, { includeLanguage: false }),
        validId, { results: metadataChecks.watchProviders },
      );
    },
  };
}
