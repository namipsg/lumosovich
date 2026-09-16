/** TMDB-native numeric identifier. IMDb identifiers are separate external IDs. */
export type TmdbId = number;

/** The first supported external-ID source. More sources can be added later. */
export type ExternalIdSource = 'imdb_id';

/** A raw TMDB find hit. Additional upstream fields retain their snake_case names. */
export interface FindHit {
  id: TmdbId;
  [key: string]: unknown;
}

export interface FindEpisodeHit extends FindHit {
  show_id?: TmdbId;
  season_number?: number;
  episode_number?: number;
}

/** Raw response from TMDB's /find/{external_id} endpoint. No result is auto-selected. */
export interface FindResponse {
  movie_results: FindHit[];
  tv_results: FindHit[];
  tv_season_results: FindHit[];
  tv_episode_results: FindEpisodeHit[];
  person_results: FindHit[];
}

export interface FindOptions {
  language?: string;
}

export interface SearchOptions {
  language?: string;
  page?: number;
  includeAdult?: boolean;
}

export interface MovieSearchOptions extends SearchOptions {
  year?: number;
  primaryReleaseYear?: number;
  region?: string;
}

export interface TvSearchOptions extends SearchOptions {
  year?: number;
  firstAirDateYear?: number;
}

export interface SearchPage<T extends FindHit> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface MovieSearchHit extends FindHit {
  title?: string;
  original_title?: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
}

export interface TvSearchHit extends FindHit {
  name?: string;
  original_name?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
}

export interface PersonSearchHit extends FindHit {
  name?: string;
  profile_path?: string | null;
}

export type MultiSearchHit =
  | (MovieSearchHit & { media_type: 'movie' })
  | (TvSearchHit & { media_type: 'tv' })
  | (PersonSearchHit & { media_type: 'person' });

export interface SearchMethods {
  movies(query: string, options?: MovieSearchOptions): Promise<SearchPage<MovieSearchHit>>;
  tv(query: string, options?: TvSearchOptions): Promise<SearchPage<TvSearchHit>>;
  multi(query: string, options?: SearchOptions): Promise<SearchPage<MultiSearchHit>>;
}

export interface LumosovichOptions {
  /** TMDB v3 API key. Supply exactly one of apiKey or accessToken. */
  apiKey?: string;
  /** TMDB API Read Access Token. Supply exactly one of apiKey or accessToken. */
  accessToken?: string;
  /** Default language for requests. Defaults to en-US. */
  language?: string;
  /** Request timeout in milliseconds. Defaults to 10000. */
  timeoutMs?: number;
  /** Useful for tests and custom runtimes. Defaults to globalThis.fetch. */
  fetch?: typeof fetch;
}
