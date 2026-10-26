import type { FindEpisodeHit, MovieSearchHit, SearchPage, TvSearchHit } from './types.js';

export interface GuestSessionRatedOptions {
  language?: string;
  page?: number;
  sortBy?: 'created_at.asc' | 'created_at.desc';
}

export interface GuestRatedMovie extends MovieSearchHit {
  title: string;
  rating: number;
}

export interface GuestRatedTv extends TvSearchHit {
  name: string;
  rating: number;
}

export interface GuestRatedEpisode extends FindEpisodeHit {
  name: string;
  show_id: number;
  season_number: number;
  episode_number: number;
  rating: number;
}

export interface GuestSessionMethods {
  ratedMovies(guestSessionId: string, options?: GuestSessionRatedOptions): Promise<SearchPage<GuestRatedMovie>>;
  ratedTv(guestSessionId: string, options?: GuestSessionRatedOptions): Promise<SearchPage<GuestRatedTv>>;
  ratedTvEpisodes(guestSessionId: string, options?: GuestSessionRatedOptions): Promise<SearchPage<GuestRatedEpisode>>;
}
