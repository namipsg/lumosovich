import { TmdbHttpClient } from './http.js';
import { pathId, positiveId } from './ids.js';
import { changeParameters } from './metadata.js';
import { validateMovieChanges } from './metadata-validation.js';
import { validateSearchPage } from './validation.js';
import { validateEpisodeGroupDetails, validateEpisodeGroups } from './tv-resource-validation.js';
import type {
  TvChangeListPage, TvChangesResponse, TvEpisodeGroupMethods,
  TvSeriesResourceMethods,
} from './tv-resource-types.js';

export function createTvSeriesResourceMethods(http: TmdbHttpClient): TvSeriesResourceMethods {
  return {
    async changeList(options = {}): Promise<TvChangeListPage> {
      return validateSearchPage(await http.get(
        'tv/changes', changeParameters(options), { includeLanguage: false },
      ));
    },
    async changes(id, options = {}): Promise<TvChangesResponse> {
      const validId = positiveId(id);
      return validateMovieChanges(await http.get(
        `tv/${validId}/changes`, changeParameters(options), { includeLanguage: false },
      ));
    },
  };
}

export function createTvEpisodeGroupMethods(http: TmdbHttpClient): TvEpisodeGroupMethods {
  return {
    async list(seriesId) {
      const validId = positiveId(seriesId);
      return validateEpisodeGroups(await http.get(
        `tv/${validId}/episode_groups`, {}, { includeLanguage: false },
      ), validId);
    },
    async get(groupId) {
      const validId = pathId(groupId, 'episode group ID');
      return validateEpisodeGroupDetails(await http.get(
        `tv/episode_group/${encodeURIComponent(validId)}`, {}, { includeLanguage: false },
      ), validId);
    },
  };
}
