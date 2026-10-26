import { TmdbHttpClient } from './http.js';
import { positiveId } from './ids.js';
import type { AccountMutationMethods, AccountMutationSessionOptions } from './account-mutation-types.js';
import { validateAccountMutation } from './account-mutation-validation.js';
import { isRecord } from './validation.js';

function session(options: AccountMutationSessionOptions): string {
  if (!isRecord(options) || typeof options.sessionId !== 'string' || !options.sessionId.trim()) {
    throw new TypeError('sessionId must not be empty');
  }
  return options.sessionId;
}

export function createAccountMutationMethods(http: TmdbHttpClient): AccountMutationMethods {
  async function set(accountId: number, mediaType: string, mediaId: number, state: boolean,
    options: AccountMutationSessionOptions, field: 'favorite' | 'watchlist') {
    positiveId(accountId);
    positiveId(mediaId);
    if (mediaType !== 'movie' && mediaType !== 'tv') throw new TypeError('mediaType must be movie or tv');
    if (typeof state !== 'boolean') throw new TypeError(`${field} must be a boolean`);
    const sessionId = session(options);
    return validateAccountMutation(await http.post(`account/${accountId}/${field}`, {
      session_id: sessionId,
    }, { media_type: mediaType, media_id: mediaId, [field]: state }));
  }

  return {
    setFavorite(accountId, mediaType, mediaId, favorite, options) {
      return set(accountId, mediaType, mediaId, favorite, options, 'favorite');
    },
    setWatchlist(accountId, mediaType, mediaId, watchlist, options) {
      return set(accountId, mediaType, mediaId, watchlist, options, 'watchlist');
    },
  };
}
