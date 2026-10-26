import type { TmdbId } from './types.js';

export type AccountMutationMediaType = 'movie' | 'tv';

/** Account changes require a user session; guest sessions cannot change accounts. */
export interface AccountMutationSessionOptions {
  sessionId: string;
}

export interface AccountMutationResponse {
  status_code: number;
  status_message: string;
  success?: boolean;
  [key: string]: unknown;
}

export interface AccountMutationMethods {
  setFavorite(accountId: TmdbId, mediaType: AccountMutationMediaType, mediaId: TmdbId, favorite: boolean, options: AccountMutationSessionOptions): Promise<AccountMutationResponse>;
  setWatchlist(accountId: TmdbId, mediaType: AccountMutationMediaType, mediaId: TmdbId, watchlist: boolean, options: AccountMutationSessionOptions): Promise<AccountMutationResponse>;
}
