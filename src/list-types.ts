import type { LanguageOptions } from './reference-types.js';
import type { PageOptions, TmdbId } from './types.js';

/** Lists require a user session; guest sessions cannot manage lists. */
export interface ListSessionOptions {
  sessionId: string;
}

export interface CreateListInput extends ListSessionOptions {
  name: string;
  description?: string;
  /** Language stored on the list, separate from the client's response language. */
  language?: string;
}

export interface ListDetailsOptions extends PageOptions, LanguageOptions {}

export interface ClearListOptions extends ListSessionOptions {
  /** TMDB requires an explicit confirmation query parameter. */
  confirm: boolean;
}

export interface ListMovie {
  id: TmdbId;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  adult: boolean;
  video: boolean;
  genre_ids: number[];
  popularity: number;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  media_type?: 'movie';
  [key: string]: unknown;
}

export interface ListDetails {
  /** TMDB's v3 list details example returns the identifier as a string. */
  id: string | TmdbId;
  created_by: string;
  description: string;
  favorite_count: number;
  items: ListMovie[];
  item_count: number;
  iso_639_1: string;
  name: string;
  poster_path: string | null;
  [key: string]: unknown;
}

export interface ListItemStatus {
  /** TMDB may serialize this list identifier as a string. */
  id: string | TmdbId;
  item_present: boolean;
  [key: string]: unknown;
}

export interface ListMutationResponse {
  status_code: number;
  status_message: string;
  success?: boolean;
  [key: string]: unknown;
}

export interface CreateListResponse extends ListMutationResponse {
  success: boolean;
  list_id: TmdbId;
}

export interface ListMethods {
  create(input: CreateListInput): Promise<CreateListResponse>;
  get(listId: TmdbId, options?: ListDetailsOptions): Promise<ListDetails>;
  itemStatus(listId: TmdbId, movieId: TmdbId, options?: LanguageOptions): Promise<ListItemStatus>;
  addMovie(listId: TmdbId, movieId: TmdbId, options: ListSessionOptions): Promise<ListMutationResponse>;
  removeMovie(listId: TmdbId, movieId: TmdbId, options: ListSessionOptions): Promise<ListMutationResponse>;
  clear(listId: TmdbId, options: ClearListOptions): Promise<ListMutationResponse>;
  delete(listId: TmdbId, options: ListSessionOptions): Promise<ListMutationResponse>;
}
