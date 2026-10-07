import type { TmdbId } from './types.js';
import type { MovieMetadataMethods } from './metadata-types.js';
import type { MovieCatalogMethods } from './catalog-types.js';

export interface Genre {
  id: TmdbId;
  name: string;
}

export interface ImageAsset {
  file_path: string;
  width?: number;
  height?: number;
  aspect_ratio?: number;
  iso_639_1?: string | null;
  [key: string]: unknown;
}

export interface ImagesResponse {
  id?: TmdbId;
  posters?: ImageAsset[];
  backdrops?: ImageAsset[];
  logos?: ImageAsset[];
  profiles?: ImageAsset[];
  [key: string]: unknown;
}

export interface CreditPerson {
  id: TmdbId;
  name?: string;
  profile_path?: string | null;
  character?: string;
  job?: string;
  department?: string;
  roles?: Array<{ character?: string; episode_count?: number }>;
  jobs?: Array<{ job?: string; episode_count?: number }>;
  [key: string]: unknown;
}

export interface CreditsResponse {
  cast: CreditPerson[];
  crew: CreditPerson[];
  [key: string]: unknown;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  [key: string]: unknown;
}

export interface VideosResponse {
  id?: TmdbId;
  results: Video[];
  [key: string]: unknown;
}

export interface ExternalIdsResponse {
  id?: TmdbId;
  imdb_id?: string | null;
  [key: string]: unknown;
}

export interface MovieReleaseDatesResponse {
  id: TmdbId;
  results: Array<{
    iso_3166_1: string;
    release_dates: Array<{ certification?: string; release_date?: string; type?: number }>;
  }>;
  [key: string]: unknown;
}

export interface TvContentRatingsResponse {
  id?: TmdbId;
  results: Array<{ iso_3166_1: string; rating: string }>;
  [key: string]: unknown;
}

export interface PersonCredit {
  id: TmdbId;
  media_type?: 'movie' | 'tv';
  title?: string;
  name?: string;
  character?: string;
  job?: string;
  [key: string]: unknown;
}

export interface PersonCombinedCreditsResponse {
  id?: TmdbId;
  cast: PersonCredit[];
  crew: PersonCredit[];
  [key: string]: unknown;
}

export type MovieAppend =
  | 'credits'
  | 'images'
  | 'videos'
  | 'external_ids'
  | 'release_dates';

export type TvAppend =
  | 'aggregate_credits'
  | 'credits'
  | 'images'
  | 'videos'
  | 'external_ids'
  | 'content_ratings';

export type PersonAppend = 'combined_credits' | 'external_ids' | 'images';
export type SeasonAppend = 'credits' | 'images' | 'videos';
export type EpisodeAppend = 'credits' | 'external_ids' | 'images' | 'videos';

export interface DetailOptions<TAppend extends string> {
  language?: string;
  /** Optional same-namespace TMDB endpoints fetched in one request. */
  append?: readonly TAppend[];
  /** Extra image languages, e.g. ['en', 'null']; requires images in append. */
  imageLanguages?: readonly string[];
}

export type MovieDetailOptions = DetailOptions<MovieAppend>;
export type TvDetailOptions = DetailOptions<TvAppend>;
export type PersonDetailOptions = DetailOptions<PersonAppend>;
export type SeasonDetailOptions = DetailOptions<SeasonAppend>;
export type EpisodeDetailOptions = DetailOptions<EpisodeAppend>;

/** Raw TMDB movie details; vote_average is TMDB's score, not an IMDb rating. */
export interface MovieDetails {
  id: TmdbId;
  title: string;
  original_title?: string;
  overview?: string;
  tagline?: string;
  release_date?: string;
  runtime?: number | null;
  genres?: Genre[];
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages?: Array<{ iso_639_1: string; english_name?: string; name?: string }>;
  vote_average?: number;
  imdb_id?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  credits?: CreditsResponse;
  images?: ImagesResponse;
  videos?: VideosResponse;
  external_ids?: ExternalIdsResponse;
  release_dates?: MovieReleaseDatesResponse;
  [key: string]: unknown;
}

export interface TvSeasonSummary {
  id: TmdbId;
  season_number: number;
  name?: string;
  episode_count?: number;
  poster_path?: string | null;
  [key: string]: unknown;
}

export interface TvEpisodeSummary {
  id: TmdbId;
  show_id?: TmdbId;
  season_number: number;
  episode_number: number;
  name: string;
  overview?: string;
  air_date?: string | null;
  runtime?: number | null;
  still_path?: string | null;
  vote_average?: number;
  [key: string]: unknown;
}

export interface TvSeasonDetails {
  id: TmdbId;
  season_number: number;
  name: string;
  episodes: TvEpisodeSummary[];
  overview?: string;
  air_date?: string | null;
  poster_path?: string | null;
  credits?: CreditsResponse;
  images?: ImagesResponse;
  videos?: VideosResponse;
  [key: string]: unknown;
}

export interface TvEpisodeDetails extends TvEpisodeSummary {
  /** TMDB may omit show_id on the individual episode endpoint. */
  show_id?: TmdbId;
  credits?: CreditsResponse;
  external_ids?: ExternalIdsResponse;
  images?: ImagesResponse;
  videos?: VideosResponse;
  crew?: CreditPerson[];
  guest_stars?: CreditPerson[];
}

/** Raw TMDB series details; use aggregate_credits for the whole-series cast. */
export interface TvDetails {
  id: TmdbId;
  name: string;
  original_name?: string;
  overview?: string;
  tagline?: string;
  first_air_date?: string;
  last_air_date?: string;
  number_of_seasons?: number;
  episode_run_time?: number[];
  seasons?: TvSeasonSummary[];
  genres?: Genre[];
  origin_country?: string[];
  spoken_languages?: Array<{ iso_639_1: string; english_name?: string; name?: string }>;
  vote_average?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
  aggregate_credits?: CreditsResponse;
  credits?: CreditsResponse;
  images?: ImagesResponse;
  videos?: VideosResponse;
  external_ids?: ExternalIdsResponse;
  content_ratings?: TvContentRatingsResponse;
  [key: string]: unknown;
}

/** Raw TMDB person details. TMDB does not supply IMDb-style awards or height here. */
export interface PersonDetails {
  id: TmdbId;
  name: string;
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  known_for_department?: string;
  place_of_birth?: string | null;
  profile_path?: string | null;
  also_known_as?: string[];
  imdb_id?: string | null;
  combined_credits?: PersonCombinedCreditsResponse;
  external_ids?: ExternalIdsResponse;
  images?: ImagesResponse;
  [key: string]: unknown;
}

export interface MovieMethods extends MovieMetadataMethods, MovieCatalogMethods {
  get(id: TmdbId, options?: MovieDetailOptions): Promise<MovieDetails>;
}

export interface TvMethods {
  get(id: TmdbId, options?: TvDetailOptions): Promise<TvDetails>;
  seasons: {
    get(
      seriesId: TmdbId,
      seasonNumber: number,
      options?: SeasonDetailOptions,
    ): Promise<TvSeasonDetails>;
  };
  episodes: {
    get(
      seriesId: TmdbId,
      seasonNumber: number,
      episodeNumber: number,
      options?: EpisodeDetailOptions,
    ): Promise<TvEpisodeDetails>;
  };
}

export interface PersonMethods {
  get(id: TmdbId, options?: PersonDetailOptions): Promise<PersonDetails>;
}
