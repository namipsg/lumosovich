import type { CreditPerson, ImageAsset, TvContentRatingsResponse, TvDetails } from './detail-types.js';
import type {
  ImageOptions, MovieWatchProvidersResponse, Translation,
} from './metadata-types.js';
import type { LanguageOptions } from './reference-types.js';
import type {
  MovieAccountStates, MovieListPage, RatingResponse, RatingSession, ReviewPage,
} from './catalog-types.js';
import type { PageOptions, SearchPage, TmdbId, TvSearchHit } from './types.js';

export interface TvCatalogOptions extends PageOptions, LanguageOptions {
  /** IANA time zone used by the airing-today and on-the-air lists. */
  timezone?: string;
}

export type TvCatalogPage = SearchPage<TvSearchHit>;
export type TvAccountStates = MovieAccountStates;
export type TvListPage = MovieListPage;
export type TvWatchProvidersResponse = MovieWatchProvidersResponse;

export interface TvAggregateCredit extends CreditPerson {
  roles?: Array<{ character?: string; episode_count?: number; [key: string]: unknown }>;
  jobs?: Array<{ job?: string; episode_count?: number; [key: string]: unknown }>;
}

export interface TvCreditsResponse {
  id: TmdbId;
  cast: TvAggregateCredit[];
  crew: TvAggregateCredit[];
  [key: string]: unknown;
}

export interface TvAlternativeTitlesResponse {
  id: TmdbId;
  results: Array<{ iso_3166_1: string; title: string; type?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface TvExternalIdsResponse {
  id: TmdbId;
  imdb_id?: string | null;
  tvdb_id?: number | null;
  wikidata_id?: string | null;
  [key: string]: unknown;
}

export interface TvImagesResponse {
  id: TmdbId;
  backdrops: ImageAsset[];
  logos: ImageAsset[];
  posters: ImageAsset[];
  [key: string]: unknown;
}

export interface TvKeywordsResponse {
  id: TmdbId;
  results: Array<{ id: TmdbId; name: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface TvScreenedTheatricallyResponse {
  id: TmdbId;
  results: Array<{ id: TmdbId; season_number: number; episode_number: number; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface TvTranslationsResponse {
  id: TmdbId;
  translations: Translation[];
  [key: string]: unknown;
}

export interface TvVideoOptions extends LanguageOptions {
  /** Include multiple language codes, including 'null' for language-neutral videos. */
  videoLanguages?: readonly string[];
}

export interface TvVideosResponse {
  id: TmdbId;
  results: Array<{
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface TvMetadataMethods {
  aggregateCredits(id: TmdbId, options?: LanguageOptions): Promise<TvCreditsResponse>;
  alternativeTitles(id: TmdbId): Promise<TvAlternativeTitlesResponse>;
  contentRatings(id: TmdbId): Promise<TvContentRatingsResponse>;
  credits(id: TmdbId, options?: LanguageOptions): Promise<TvCreditsResponse>;
  externalIds(id: TmdbId): Promise<TvExternalIdsResponse>;
  images(id: TmdbId, options?: ImageOptions): Promise<TvImagesResponse>;
  keywords(id: TmdbId): Promise<TvKeywordsResponse>;
  latest(): Promise<TvDetails>;
  screenedTheatrically(id: TmdbId): Promise<TvScreenedTheatricallyResponse>;
  translations(id: TmdbId): Promise<TvTranslationsResponse>;
  videos(id: TmdbId, options?: TvVideoOptions): Promise<TvVideosResponse>;
  watchProviders(id: TmdbId): Promise<TvWatchProvidersResponse>;
}

export interface TvCatalogMethods {
  airingToday(options?: TvCatalogOptions): Promise<TvCatalogPage>;
  onTheAir(options?: TvCatalogOptions): Promise<TvCatalogPage>;
  popular(options?: PageOptions & LanguageOptions): Promise<TvCatalogPage>;
  topRated(options?: PageOptions & LanguageOptions): Promise<TvCatalogPage>;
  accountStates(id: TmdbId, session: RatingSession): Promise<TvAccountStates>;
  lists(id: TmdbId, options?: PageOptions & LanguageOptions): Promise<TvListPage>;
  recommendations(id: TmdbId, options?: PageOptions & LanguageOptions): Promise<TvCatalogPage>;
  reviews(id: TmdbId, options?: PageOptions & LanguageOptions): Promise<ReviewPage>;
  similar(id: TmdbId, options?: PageOptions & LanguageOptions): Promise<TvCatalogPage>;
  rate(id: TmdbId, value: number, session: RatingSession): Promise<RatingResponse>;
  deleteRating(id: TmdbId, session: RatingSession): Promise<RatingResponse>;
}
