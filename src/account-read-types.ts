import type { FindEpisodeHit, FindHit, MovieSearchHit, SearchPage, TvSearchHit } from './types.js';

/** Each account request uses the explicitly supplied TMDB user session. */
export interface AccountSessionOptions {
  sessionId: string;
}

export interface AccountListsOptions extends AccountSessionOptions {
  page?: number;
}

export interface AccountMediaOptions extends AccountListsOptions {
  language?: string;
  sortBy?: 'created_at.asc' | 'created_at.desc';
}

export interface AccountDetails extends FindHit {
  avatar: {
    gravatar: { hash: string; [key: string]: unknown };
    tmdb: { avatar_path: string | null; [key: string]: unknown };
    [key: string]: unknown;
  };
  iso_639_1: string;
  iso_3166_1: string;
  name: string;
  include_adult: boolean;
  username: string;
}

export interface AccountMovie extends MovieSearchHit {
  title: string;
  original_title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  adult: boolean;
  video: boolean;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
}

export interface AccountTv extends TvSearchHit {
  name: string;
  original_name: string;
  first_air_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  adult: boolean;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
}

export interface AccountRatedMovie extends AccountMovie { rating: number }
export interface AccountRatedTv extends AccountTv { rating: number }

export interface AccountRatedEpisode extends FindEpisodeHit {
  air_date: string | null;
  episode_number: number;
  name: string;
  overview: string;
  production_code: string;
  runtime: number | null;
  season_number: number;
  show_id: number;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  rating: number;
}

export interface AccountList extends FindHit {
  description: string;
  favorite_count: number;
  item_count: number;
  iso_639_1: string;
  list_type: string;
  name: string;
  poster_path: string | null;
}

export interface AccountReadMethods {
  get(accountId: number, options: AccountSessionOptions): Promise<AccountDetails>;
  favoriteMovies(accountId: number, options: AccountMediaOptions): Promise<SearchPage<AccountMovie>>;
  favoriteTv(accountId: number, options: AccountMediaOptions): Promise<SearchPage<AccountTv>>;
  lists(accountId: number, options: AccountListsOptions): Promise<SearchPage<AccountList>>;
  ratedMovies(accountId: number, options: AccountMediaOptions): Promise<SearchPage<AccountRatedMovie>>;
  ratedTv(accountId: number, options: AccountMediaOptions): Promise<SearchPage<AccountRatedTv>>;
  ratedTvEpisodes(accountId: number, options: AccountMediaOptions): Promise<SearchPage<AccountRatedEpisode>>;
  watchlistMovies(accountId: number, options: AccountMediaOptions): Promise<SearchPage<AccountMovie>>;
  watchlistTv(accountId: number, options: AccountMediaOptions): Promise<SearchPage<AccountTv>>;
}
