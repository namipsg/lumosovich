import type { QueryParameters } from './http.js';
import { TmdbHttpClient } from './http.js';
import { positiveId } from './ids.js';
import type {
  MovieCatalogMethods, MovieCatalogOptions, MovieChangeListOptions,
  MovieChangeListPage, MovieListHit, MovieListPage, RatingSession,
} from './catalog-types.js';
import type { MovieSearchHit, PageOptions, SearchPage } from './types.js';
import type { LanguageOptions } from './reference-types.js';
import { validateSearchPage } from './validation.js';
import {
  validateAccountStates, validateCatalogPage, validateIdPage,
  validateRatingResponse, validateReviewPage,
} from './catalog-validation.js';

export function page(value: number | undefined): number | undefined {
  if (value !== undefined && (!Number.isSafeInteger(value) || value < 1)) {
    throw new TypeError('page must be a positive integer');
  }
  return value;
}

function date(value: string | undefined, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new TypeError(`${label} must be a valid YYYY-MM-DD date`);
  }
  return value;
}

export function pagedLanguage(options: PageOptions & LanguageOptions): QueryParameters {
  return { language: options.language, page: page(options.page) };
}

function catalogOptions(options: MovieCatalogOptions): QueryParameters {
  if (options.region !== undefined &&
    (typeof options.region !== 'string' || !options.region.trim())) {
    throw new TypeError('region must be a nonempty string');
  }
  return { ...pagedLanguage(options), region: options.region?.trim() };
}

export function sessionParameters(session: RatingSession): QueryParameters {
  if (!session || typeof session !== 'object') {
    throw new TypeError('Supply a sessionId or guestSessionId');
  }
  const { sessionId, guestSessionId } = session;
  if (Boolean(sessionId) === Boolean(guestSessionId) ||
    (sessionId !== undefined && (typeof sessionId !== 'string' || !sessionId.trim())) ||
    (guestSessionId !== undefined && (typeof guestSessionId !== 'string' || !guestSessionId.trim()))) {
    throw new TypeError('Supply exactly one nonempty sessionId or guestSessionId');
  }
  return { session_id: sessionId?.trim(), guest_session_id: guestSessionId?.trim() };
}

export function ratingValue(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) ||
    value < 0.5 || value > 10 || !Number.isInteger(value * 2)) {
    throw new TypeError('rating must be from 0.5 to 10 in half-point increments');
  }
  return value;
}

export function createMovieCatalogMethods(http: TmdbHttpClient): MovieCatalogMethods {
  return {
    async changeList(options: MovieChangeListOptions = {}): Promise<MovieChangeListPage> {
      const startDate = date(options.startDate, 'startDate');
      const endDate = date(options.endDate, 'endDate');
      if (startDate && endDate && startDate > endDate) {
        throw new TypeError('startDate must be on or before endDate');
      }
      return validateSearchPage(await http.get('movie/changes', {
        start_date: startDate, end_date: endDate, page: page(options.page),
      }, { includeLanguage: false }));
    },
    async nowPlaying(options: MovieCatalogOptions = {}) {
      return validateCatalogPage(await http.get('movie/now_playing', catalogOptions(options)), true);
    },
    async popular(options: MovieCatalogOptions = {}) {
      return validateCatalogPage(await http.get('movie/popular', catalogOptions(options)));
    },
    async topRated(options: MovieCatalogOptions = {}) {
      return validateCatalogPage(await http.get('movie/top_rated', catalogOptions(options)));
    },
    async upcoming(options: MovieCatalogOptions = {}) {
      return validateCatalogPage(await http.get('movie/upcoming', catalogOptions(options)), true);
    },
    async accountStates(id, session) {
      const validId = positiveId(id);
      return validateAccountStates(await http.get(
        `movie/${validId}/account_states`, sessionParameters(session), { includeLanguage: false },
      ), validId);
    },
    async lists(id, options = {}) {
      const validId = positiveId(id);
      return validateIdPage<MovieListHit>(await http.get(
        `movie/${validId}/lists`, pagedLanguage(options),
      ), validId, true) as MovieListPage;
    },
    async recommendations(id, options = {}): Promise<SearchPage<MovieSearchHit>> {
      const validId = positiveId(id);
      return validateSearchPage(await http.get(
        `movie/${validId}/recommendations`, pagedLanguage(options),
      ));
    },
    async reviews(id, options = {}) {
      const validId = positiveId(id);
      return validateReviewPage(await http.get(`movie/${validId}/reviews`, pagedLanguage(options)), validId);
    },
    async similar(id, options = {}): Promise<SearchPage<MovieSearchHit>> {
      const validId = positiveId(id);
      return validateSearchPage(await http.get(`movie/${validId}/similar`, pagedLanguage(options)));
    },
    async rate(id, value, session) {
      const validId = positiveId(id);
      return validateRatingResponse(await http.post(`movie/${validId}/rating`, sessionParameters(session), { value: ratingValue(value) }));
    },
    async deleteRating(id, session) {
      const validId = positiveId(id);
      return validateRatingResponse(await http.delete(`movie/${validId}/rating`, sessionParameters(session)));
    },
  };
}
