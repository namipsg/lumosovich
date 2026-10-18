import { TmdbHttpClient } from './http.js';
import { positiveId } from './ids.js';
import { sessionParameters } from './movie-catalog.js';
import { changeParameters, imageParameters } from './metadata.js';
import { metadataChecks, validateMovieChanges, validatePositiveIdShape } from './metadata-validation.js';
import { videoParameters } from './tv-metadata.js';
import { seasonPath } from './tv-resource-paths.js';
import { validateSeasonAccountStates } from './tv-resource-validation.js';
import type { TvCreditsResponse, TvTranslationsResponse, TvVideosResponse } from './tv-types.js';
import type {
  TvChangesResponse, TvSeasonExternalIdsResponse, TvSeasonImagesResponse,
  TvSeasonResourceMethods, TvSeasonWatchProvidersResponse,
} from './tv-resource-types.js';

export function createTvSeasonResourceMethods(http: TmdbHttpClient): TvSeasonResourceMethods {
  return {
    async accountStates(seriesId, seasonNumber, session) {
      const path = seasonPath(seriesId, seasonNumber);
      return validateSeasonAccountStates(await http.get(
        `${path}/account_states`, sessionParameters(session), { includeLanguage: false },
      ));
    },
    async aggregateCredits(seriesId, seasonNumber, options = {}) {
      const path = seasonPath(seriesId, seasonNumber);
      return validatePositiveIdShape<TvCreditsResponse>(await http.get(
        `${path}/aggregate_credits`, { language: options.language },
      ), { cast: metadataChecks.credits, crew: metadataChecks.credits });
    },
    async changes(seasonId, options = {}): Promise<TvChangesResponse> {
      const validId = positiveId(seasonId);
      return validateMovieChanges(await http.get(
        `tv/season/${validId}/changes`, changeParameters(options), { includeLanguage: false },
      ));
    },
    async credits(seriesId, seasonNumber, options = {}) {
      const path = seasonPath(seriesId, seasonNumber);
      return validatePositiveIdShape<TvCreditsResponse>(await http.get(
        `${path}/credits`, { language: options.language },
      ), { cast: metadataChecks.credits, crew: metadataChecks.credits });
    },
    async externalIds(seriesId, seasonNumber) {
      const path = seasonPath(seriesId, seasonNumber);
      return validatePositiveIdShape<TvSeasonExternalIdsResponse>(await http.get(
        `${path}/external_ids`, {}, { includeLanguage: false },
      ), {
        tvdb_id: (value) => value === undefined || value === null ||
          (Number.isSafeInteger(value) && Number(value) > 0),
        wikidata_id: metadataChecks.externalId,
      });
    },
    async images(seriesId, seasonNumber, options = {}) {
      const path = seasonPath(seriesId, seasonNumber);
      return validatePositiveIdShape<TvSeasonImagesResponse>(await http.get(
        `${path}/images`, imageParameters(options),
      ), { posters: metadataChecks.images });
    },
    async translations(seriesId, seasonNumber) {
      const path = seasonPath(seriesId, seasonNumber);
      return validatePositiveIdShape<TvTranslationsResponse>(await http.get(
        `${path}/translations`, {}, { includeLanguage: false },
      ), { translations: metadataChecks.translations });
    },
    async videos(seriesId, seasonNumber, options = {}) {
      const path = seasonPath(seriesId, seasonNumber);
      return validatePositiveIdShape<TvVideosResponse>(await http.get(
        `${path}/videos`, videoParameters(options),
      ), { results: metadataChecks.videos });
    },
    async watchProviders(seriesId, seasonNumber, options = {}) {
      const path = seasonPath(seriesId, seasonNumber);
      return validatePositiveIdShape<TvSeasonWatchProvidersResponse>(await http.get(
        `${path}/watch/providers`, { language: options.language },
      ), { results: metadataChecks.watchProviders });
    },
  };
}
