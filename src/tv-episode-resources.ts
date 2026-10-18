import { TmdbHttpClient } from './http.js';
import { positiveId } from './ids.js';
import { ratingValue, sessionParameters } from './movie-catalog.js';
import { imageParameters } from './metadata.js';
import { metadataChecks, validateMovieChanges, validatePositiveIdShape } from './metadata-validation.js';
import { validateAccountStateShape, validateRatingResponse } from './catalog-validation.js';
import { videoParameters } from './tv-metadata.js';
import { episodePath } from './tv-resource-paths.js';
import type { TvTranslationsResponse, TvVideosResponse } from './tv-types.js';
import type {
  TvChangesResponse, TvEpisodeCreditsResponse, TvEpisodeExternalIdsResponse,
  TvEpisodeImagesResponse, TvEpisodeResourceMethods,
} from './tv-resource-types.js';

export function createTvEpisodeResourceMethods(http: TmdbHttpClient): TvEpisodeResourceMethods {
  return {
    async accountStates(seriesId, seasonNumber, episodeNumber, session) {
      const path = episodePath(seriesId, seasonNumber, episodeNumber);
      return validateAccountStateShape(await http.get(
        `${path}/account_states`, sessionParameters(session), { includeLanguage: false },
      ));
    },
    async changes(episodeId): Promise<TvChangesResponse> {
      const validId = positiveId(episodeId);
      return validateMovieChanges(await http.get(
        `tv/episode/${validId}/changes`, {}, { includeLanguage: false },
      ));
    },
    async credits(seriesId, seasonNumber, episodeNumber, options = {}) {
      const path = episodePath(seriesId, seasonNumber, episodeNumber);
      return validatePositiveIdShape<TvEpisodeCreditsResponse>(await http.get(
        `${path}/credits`, { language: options.language },
      ), {
        cast: metadataChecks.credits,
        crew: metadataChecks.credits,
        guest_stars: metadataChecks.credits,
      });
    },
    async externalIds(seriesId, seasonNumber, episodeNumber) {
      const path = episodePath(seriesId, seasonNumber, episodeNumber);
      return validatePositiveIdShape<TvEpisodeExternalIdsResponse>(await http.get(
        `${path}/external_ids`, {}, { includeLanguage: false },
      ), {
        imdb_id: metadataChecks.externalId,
        tvdb_id: (value) => value === undefined || value === null ||
          (Number.isSafeInteger(value) && Number(value) > 0),
        wikidata_id: metadataChecks.externalId,
      });
    },
    async images(seriesId, seasonNumber, episodeNumber, options = {}) {
      const path = episodePath(seriesId, seasonNumber, episodeNumber);
      return validatePositiveIdShape<TvEpisodeImagesResponse>(await http.get(
        `${path}/images`, imageParameters(options),
      ), { stills: metadataChecks.images });
    },
    async translations(seriesId, seasonNumber, episodeNumber) {
      const path = episodePath(seriesId, seasonNumber, episodeNumber);
      return validatePositiveIdShape<TvTranslationsResponse>(await http.get(
        `${path}/translations`, {}, { includeLanguage: false },
      ), { translations: metadataChecks.translations });
    },
    async videos(seriesId, seasonNumber, episodeNumber, options = {}) {
      const path = episodePath(seriesId, seasonNumber, episodeNumber);
      return validatePositiveIdShape<TvVideosResponse>(await http.get(
        `${path}/videos`, videoParameters(options),
      ), { results: metadataChecks.videos });
    },
    async rate(seriesId, seasonNumber, episodeNumber, value, session) {
      const path = episodePath(seriesId, seasonNumber, episodeNumber);
      return validateRatingResponse(await http.post(
        `${path}/rating`, sessionParameters(session), { value: ratingValue(value) },
      ));
    },
    async deleteRating(seriesId, seasonNumber, episodeNumber, session) {
      const path = episodePath(seriesId, seasonNumber, episodeNumber);
      return validateRatingResponse(await http.delete(`${path}/rating`, sessionParameters(session)));
    },
  };
}
