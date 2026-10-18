import type { CreditPerson, ImageAsset, TvEpisodeSummary } from './detail-types.js';
import type {
  ImageOptions, MovieChangesOptions, MovieChangesResponse,
  MovieWatchProvidersResponse,
} from './metadata-types.js';
import type { LanguageOptions } from './reference-types.js';
import type { MovieAccountStates, MovieChangeListOptions, RatingResponse, RatingSession } from './catalog-types.js';
import type { SearchPage, TmdbId } from './types.js';
import type { TvCreditsResponse, TvTranslationsResponse, TvVideoOptions, TvVideosResponse } from './tv-types.js';

export type TvChangeListOptions = MovieChangeListOptions;
export type TvChangesOptions = MovieChangesOptions;
export type TvChangesResponse = MovieChangesResponse;
export type TvChangeListPage = SearchPage<{ id: TmdbId; adult?: boolean; [key: string]: unknown }>;

export interface TvEpisodeGroupSummary {
  id: string;
  name: string;
  episode_count?: number;
  group_count?: number;
  description?: string;
  type?: number;
  [key: string]: unknown;
}

export interface TvEpisodeGroupsResponse {
  id: TmdbId;
  results: TvEpisodeGroupSummary[];
  [key: string]: unknown;
}

export interface TvEpisodeGroupDetails extends TvEpisodeGroupSummary {
  groups: Array<{
    id: string;
    name: string;
    order: number;
    episodes: TvEpisodeSummary[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface TvSeasonAccountStates {
  id: TmdbId;
  results: Array<{
    id: TmdbId;
    episode_number: number;
    rated: false | { value: number; [key: string]: unknown };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export type TvEpisodeAccountStates = MovieAccountStates;

export interface TvSeasonExternalIdsResponse {
  id: TmdbId;
  tvdb_id?: number | null;
  wikidata_id?: string | null;
  [key: string]: unknown;
}

export interface TvEpisodeExternalIdsResponse extends TvSeasonExternalIdsResponse {
  imdb_id?: string | null;
}

export interface TvSeasonImagesResponse {
  id: TmdbId;
  posters: ImageAsset[];
  [key: string]: unknown;
}

export interface TvEpisodeImagesResponse {
  id: TmdbId;
  stills: ImageAsset[];
  [key: string]: unknown;
}

export interface TvEpisodeCreditsResponse {
  id: TmdbId;
  cast: CreditPerson[];
  crew: CreditPerson[];
  guest_stars: CreditPerson[];
  [key: string]: unknown;
}

export type TvSeasonWatchProvidersResponse = MovieWatchProvidersResponse;

export interface TvSeriesResourceMethods {
  changeList(options?: TvChangeListOptions): Promise<TvChangeListPage>;
  changes(id: TmdbId, options?: TvChangesOptions): Promise<TvChangesResponse>;
}

export interface TvSeasonResourceMethods {
  accountStates(seriesId: TmdbId, seasonNumber: number, session: RatingSession): Promise<TvSeasonAccountStates>;
  aggregateCredits(seriesId: TmdbId, seasonNumber: number, options?: LanguageOptions): Promise<TvCreditsResponse>;
  changes(seasonId: TmdbId, options?: TvChangesOptions): Promise<TvChangesResponse>;
  credits(seriesId: TmdbId, seasonNumber: number, options?: LanguageOptions): Promise<TvCreditsResponse>;
  externalIds(seriesId: TmdbId, seasonNumber: number): Promise<TvSeasonExternalIdsResponse>;
  images(seriesId: TmdbId, seasonNumber: number, options?: ImageOptions): Promise<TvSeasonImagesResponse>;
  translations(seriesId: TmdbId, seasonNumber: number): Promise<TvTranslationsResponse>;
  videos(seriesId: TmdbId, seasonNumber: number, options?: TvVideoOptions): Promise<TvVideosResponse>;
  watchProviders(seriesId: TmdbId, seasonNumber: number, options?: LanguageOptions): Promise<TvSeasonWatchProvidersResponse>;
}

export interface TvEpisodeResourceMethods {
  accountStates(seriesId: TmdbId, seasonNumber: number, episodeNumber: number, session: RatingSession): Promise<TvEpisodeAccountStates>;
  changes(episodeId: TmdbId): Promise<TvChangesResponse>;
  credits(seriesId: TmdbId, seasonNumber: number, episodeNumber: number, options?: LanguageOptions): Promise<TvEpisodeCreditsResponse>;
  externalIds(seriesId: TmdbId, seasonNumber: number, episodeNumber: number): Promise<TvEpisodeExternalIdsResponse>;
  images(seriesId: TmdbId, seasonNumber: number, episodeNumber: number, options?: ImageOptions): Promise<TvEpisodeImagesResponse>;
  translations(seriesId: TmdbId, seasonNumber: number, episodeNumber: number): Promise<TvTranslationsResponse>;
  videos(seriesId: TmdbId, seasonNumber: number, episodeNumber: number, options?: TvVideoOptions): Promise<TvVideosResponse>;
  rate(seriesId: TmdbId, seasonNumber: number, episodeNumber: number, value: number, session: RatingSession): Promise<RatingResponse>;
  deleteRating(seriesId: TmdbId, seasonNumber: number, episodeNumber: number, session: RatingSession): Promise<RatingResponse>;
}

export interface TvEpisodeGroupMethods {
  list(seriesId: TmdbId): Promise<TvEpisodeGroupsResponse>;
  get(groupId: string): Promise<TvEpisodeGroupDetails>;
}
