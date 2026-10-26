import { TmdbHttpClient, type QueryParameters } from './http.js';
import { pathId } from './ids.js';
import type {
  GuestRatedEpisode, GuestRatedMovie, GuestRatedTv, GuestSessionMethods, GuestSessionRatedOptions,
} from './guest-session-types.js';
import type { FindHit, SearchPage } from './types.js';
import { invalidResponse, validateSearchPage } from './validation.js';

function parameters(options: GuestSessionRatedOptions): QueryParameters {
  if (options.page !== undefined && (!Number.isSafeInteger(options.page) || options.page < 1)) {
    throw new TypeError('page must be a positive integer');
  }
  if (options.sortBy !== undefined && !['created_at.asc', 'created_at.desc'].includes(options.sortBy)) {
    throw new TypeError('sortBy must be created_at.asc or created_at.desc');
  }
  return { language: options.language, page: options.page, sort_by: options.sortBy };
}

function validateRatedPage<T extends FindHit>(
  value: unknown, nameField: 'title' | 'name', episodes = false,
): SearchPage<T> {
  const page = validateSearchPage<T>(value);
  if (!page.results.every((item) => typeof item[nameField] === 'string' &&
    typeof item.rating === 'number' && Number.isFinite(item.rating) &&
    item.rating >= 0.5 && item.rating <= 10 && Number.isInteger(item.rating * 2) &&
    (!episodes || (Number.isSafeInteger(item.show_id) && Number(item.show_id) > 0 &&
      Number.isSafeInteger(item.season_number) && Number(item.season_number) >= 0 &&
      Number.isSafeInteger(item.episode_number) && Number(item.episode_number) >= 0)))) {
    invalidResponse();
  }
  return page;
}

export function createGuestSessionMethods(http: TmdbHttpClient): GuestSessionMethods {
  const path = (id: string) => `guest_session/${encodeURIComponent(pathId(id, 'guestSessionId'))}/rated`;
  return {
    async ratedMovies(guestSessionId: string, options: GuestSessionRatedOptions = {}) {
      return validateRatedPage<GuestRatedMovie>(
        await http.get(`${path(guestSessionId)}/movies`, parameters(options)), 'title');
    },
    async ratedTv(guestSessionId: string, options: GuestSessionRatedOptions = {}) {
      return validateRatedPage<GuestRatedTv>(
        await http.get(`${path(guestSessionId)}/tv`, parameters(options)), 'name');
    },
    async ratedTvEpisodes(guestSessionId: string, options: GuestSessionRatedOptions = {}) {
      return validateRatedPage<GuestRatedEpisode>(
        await http.get(`${path(guestSessionId)}/tv/episodes`, parameters(options)), 'name', true);
    },
  };
}
