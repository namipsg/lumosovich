import { TmdbHttpClient, type QueryParameters } from './http.js';
import { positiveId } from './ids.js';
import type {
  AccountList, AccountListsOptions, AccountMediaOptions, AccountMovie, AccountRatedEpisode,
  AccountRatedMovie, AccountRatedTv, AccountReadMethods, AccountSessionOptions, AccountTv,
} from './account-read-types.js';
import { validateAccountDetails, validateAccountPage } from './account-read-validation.js';
import { isRecord } from './validation.js';

function parameters(accountId: number, options: AccountSessionOptions, paged = false, media = false): QueryParameters {
  positiveId(accountId);
  if (!isRecord(options) || typeof options.sessionId !== 'string' || !options.sessionId.trim()) {
    throw new TypeError('sessionId must not be empty');
  }
  const query: QueryParameters = { session_id: options.sessionId };
  if (paged) {
    const { page } = options as AccountListsOptions;
    if (page !== undefined && (!Number.isSafeInteger(page) || page < 1)) throw new TypeError('page must be a positive integer');
    query.page = page;
  }
  if (media) {
    const { language, sortBy } = options as AccountMediaOptions;
    if (language !== undefined && (typeof language !== 'string' || !language.trim())) throw new TypeError('language must not be empty');
    if (sortBy !== undefined && !['created_at.asc', 'created_at.desc'].includes(sortBy)) {
      throw new TypeError('sortBy must be created_at.asc or created_at.desc');
    }
    query.language = language;
    query.sort_by = sortBy;
  }
  return query;
}

export function createAccountReadMethods(http: TmdbHttpClient): AccountReadMethods {
  return {
    async get(accountId, options) {
      return validateAccountDetails(await http.get(`account/${accountId}`, parameters(accountId, options), { includeLanguage: false }), accountId);
    },
    async favoriteMovies(accountId, options) {
      return validateAccountPage<AccountMovie>(await http.get(`account/${accountId}/favorite/movies`, parameters(accountId, options, true, true)), 'movie');
    },
    async favoriteTv(accountId, options) {
      return validateAccountPage<AccountTv>(await http.get(`account/${accountId}/favorite/tv`, parameters(accountId, options, true, true)), 'tv');
    },
    async lists(accountId, options) {
      return validateAccountPage<AccountList>(await http.get(`account/${accountId}/lists`, parameters(accountId, options, true), { includeLanguage: false }), 'list');
    },
    async ratedMovies(accountId, options) {
      return validateAccountPage<AccountRatedMovie>(await http.get(`account/${accountId}/rated/movies`, parameters(accountId, options, true, true)), 'movie', true);
    },
    async ratedTv(accountId, options) {
      return validateAccountPage<AccountRatedTv>(await http.get(`account/${accountId}/rated/tv`, parameters(accountId, options, true, true)), 'tv', true);
    },
    async ratedTvEpisodes(accountId, options) {
      return validateAccountPage<AccountRatedEpisode>(await http.get(`account/${accountId}/rated/tv/episodes`, parameters(accountId, options, true, true)), 'episode');
    },
    async watchlistMovies(accountId, options) {
      return validateAccountPage<AccountMovie>(await http.get(`account/${accountId}/watchlist/movies`, parameters(accountId, options, true, true)), 'movie');
    },
    async watchlistTv(accountId, options) {
      return validateAccountPage<AccountTv>(await http.get(`account/${accountId}/watchlist/tv`, parameters(accountId, options, true, true)), 'tv');
    },
  };
}
