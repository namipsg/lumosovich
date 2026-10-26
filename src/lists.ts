import { TmdbHttpClient } from './http.js';
import { positiveId } from './ids.js';
import type { ListMethods, ListSessionOptions } from './list-types.js';
import { validateCreateList, validateListDetails, validateListItemStatus, validateListMutation } from './list-validation.js';
import { isRecord } from './validation.js';

function nonempty(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${label} must not be empty`);
  return value;
}

function optionalLanguage(value: unknown): string | undefined {
  return value === undefined ? undefined : nonempty(value, 'language');
}

function session(options: ListSessionOptions): string {
  if (!isRecord(options)) throw new TypeError('sessionId is required');
  return nonempty(options.sessionId, 'sessionId');
}

export function createListMethods(http: TmdbHttpClient): ListMethods {
  return {
    async create(input) {
      const sessionId = session(input);
      const name = nonempty(input.name, 'name');
      if (input.description !== undefined && typeof input.description !== 'string') {
        throw new TypeError('description must be a string');
      }
      const language = optionalLanguage(input.language);
      return validateCreateList(await http.post('list', { session_id: sessionId }, {
        name,
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(language === undefined ? {} : { language }),
      }));
    },
    async get(listId, options = {}) {
      positiveId(listId);
      if (!isRecord(options)) throw new TypeError('options must be an object');
      if (options.page !== undefined && (typeof options.page !== 'number' || !Number.isSafeInteger(options.page) || options.page < 1)) {
        throw new TypeError('page must be a positive integer');
      }
      return validateListDetails(await http.get(`list/${listId}`, {
        language: optionalLanguage(options.language), page: options.page as number | undefined,
      }), listId);
    },
    async itemStatus(listId, movieId, options = {}) {
      positiveId(listId);
      positiveId(movieId);
      if (!isRecord(options)) throw new TypeError('options must be an object');
      return validateListItemStatus(await http.get(`list/${listId}/item_status`, {
        movie_id: movieId, language: optionalLanguage(options.language),
      }), listId);
    },
    async addMovie(listId, movieId, options) {
      positiveId(listId);
      positiveId(movieId);
      return validateListMutation(await http.post(`list/${listId}/add_item`, {
        session_id: session(options),
      }, { media_id: movieId }));
    },
    async removeMovie(listId, movieId, options) {
      positiveId(listId);
      positiveId(movieId);
      return validateListMutation(await http.post(`list/${listId}/remove_item`, {
        session_id: session(options),
      }, { media_id: movieId }));
    },
    async clear(listId, options) {
      positiveId(listId);
      const sessionId = session(options);
      if (typeof options.confirm !== 'boolean') throw new TypeError('confirm must be a boolean');
      return validateListMutation(await http.post(`list/${listId}/clear`, {
        session_id: sessionId, confirm: options.confirm,
      }));
    },
    async delete(listId, options) {
      positiveId(listId);
      return validateListMutation(await http.delete(`list/${listId}`, { session_id: session(options) }));
    },
  };
}
