import { TmdbHttpClient } from './http.js';
import { positiveId } from './ids.js';
import { page, pagedLanguage, ratingValue, sessionParameters } from './movie-catalog.js';
import {
  validateAccountStates, validateIdPage, validateRatingResponse, validateReviewPage,
} from './catalog-validation.js';
import { validateSearchPage } from './validation.js';
import type { MovieListHit } from './catalog-types.js';
import type { TvCatalogMethods, TvCatalogOptions, TvCatalogPage, TvListPage } from './tv-types.js';

function airingParameters(options: TvCatalogOptions): { language?: string; page?: number; timezone?: string } {
  if (options.timezone !== undefined &&
    (typeof options.timezone !== 'string' || !options.timezone.trim())) {
    throw new TypeError('timezone must be a nonempty string');
  }
  return {
    language: options.language,
    page: page(options.page),
    timezone: options.timezone?.trim(),
  };
}

export function createTvCatalogMethods(http: TmdbHttpClient): TvCatalogMethods {
  return {
    async airingToday(options = {}): Promise<TvCatalogPage> {
      return validateSearchPage(await http.get('tv/airing_today', airingParameters(options)));
    },
    async onTheAir(options = {}): Promise<TvCatalogPage> {
      return validateSearchPage(await http.get('tv/on_the_air', airingParameters(options)));
    },
    async popular(options = {}): Promise<TvCatalogPage> {
      return validateSearchPage(await http.get('tv/popular', pagedLanguage(options)));
    },
    async topRated(options = {}): Promise<TvCatalogPage> {
      return validateSearchPage(await http.get('tv/top_rated', pagedLanguage(options)));
    },
    async accountStates(id, session) {
      const validId = positiveId(id);
      return validateAccountStates(await http.get(
        `tv/${validId}/account_states`, sessionParameters(session), { includeLanguage: false },
      ), validId);
    },
    async lists(id, options = {}): Promise<TvListPage> {
      const validId = positiveId(id);
      return validateIdPage<MovieListHit>(await http.get(
        `tv/${validId}/lists`, pagedLanguage(options),
      ), validId, true) as TvListPage;
    },
    async recommendations(id, options = {}): Promise<TvCatalogPage> {
      const validId = positiveId(id);
      return validateSearchPage(await http.get(`tv/${validId}/recommendations`, pagedLanguage(options)));
    },
    async reviews(id, options = {}) {
      const validId = positiveId(id);
      return validateReviewPage(await http.get(`tv/${validId}/reviews`, pagedLanguage(options)), validId);
    },
    async similar(id, options = {}): Promise<TvCatalogPage> {
      const validId = positiveId(id);
      return validateSearchPage(await http.get(`tv/${validId}/similar`, pagedLanguage(options)));
    },
    async rate(id, value, session) {
      const validId = positiveId(id);
      return validateRatingResponse(await http.post(`tv/${validId}/rating`, sessionParameters(session), {
        value: ratingValue(value),
      }));
    },
    async deleteRating(id, session) {
      const validId = positiveId(id);
      return validateRatingResponse(await http.delete(`tv/${validId}/rating`, sessionParameters(session)));
    },
  };
}
