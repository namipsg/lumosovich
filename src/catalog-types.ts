import type { ImageAsset } from './detail-types.js';
import type { LanguageOptions } from './reference-types.js';
import type {
  MovieSearchHit, MultiSearchHit, PageOptions, PersonSearchHit,
  SearchPage, TmdbId, TvSearchHit,
} from './types.js';

export interface MovieCatalogOptions extends PageOptions, LanguageOptions {
  region?: string;
}

export interface MovieCatalogPage extends SearchPage<MovieSearchHit> {
  dates?: { maximum: string; minimum: string; [key: string]: unknown };
  [key: string]: unknown;
}

export interface MovieChangeListOptions extends PageOptions {
  startDate?: string;
  endDate?: string;
}

export type MovieChangeListPage = SearchPage<{ id: TmdbId; adult?: boolean; [key: string]: unknown }>;

export interface MovieListHit {
  id: TmdbId;
  name: string;
  description?: string;
  item_count?: number;
  [key: string]: unknown;
}

export interface MovieListPage extends SearchPage<MovieListHit> {
  id: TmdbId;
  [key: string]: unknown;
}

export interface ReviewSummary {
  id: string;
  author: string;
  content: string;
  created_at?: string;
  url?: string;
  author_details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ReviewPage {
  id: TmdbId;
  page: number;
  results: ReviewSummary[];
  total_pages: number;
  total_results: number;
  [key: string]: unknown;
}

export interface ReviewDetails extends ReviewSummary {
  media_id?: TmdbId;
  media_title?: string;
  [key: string]: unknown;
}

export interface MovieAccountStates {
  id: TmdbId;
  favorite: boolean;
  rated: false | { value: number; [key: string]: unknown };
  watchlist: boolean;
  [key: string]: unknown;
}

/** Exactly one session identifier is required for user-scoped operations. */
export type RatingSession =
  | { sessionId: string; guestSessionId?: never }
  | { guestSessionId: string; sessionId?: never };

export interface RatingResponse {
  status_code: number;
  status_message: string;
  [key: string]: unknown;
}

export interface MovieCatalogMethods {
  changeList(options?: MovieChangeListOptions): Promise<MovieChangeListPage>;
  nowPlaying(options?: MovieCatalogOptions): Promise<MovieCatalogPage>;
  popular(options?: MovieCatalogOptions): Promise<MovieCatalogPage>;
  topRated(options?: MovieCatalogOptions): Promise<MovieCatalogPage>;
  upcoming(options?: MovieCatalogOptions): Promise<MovieCatalogPage>;
  accountStates(id: TmdbId, session: RatingSession): Promise<MovieAccountStates>;
  lists(id: TmdbId, options?: PageOptions & LanguageOptions): Promise<MovieListPage>;
  recommendations(id: TmdbId, options?: PageOptions & LanguageOptions): Promise<SearchPage<MovieSearchHit>>;
  reviews(id: TmdbId, options?: PageOptions & LanguageOptions): Promise<ReviewPage>;
  similar(id: TmdbId, options?: PageOptions & LanguageOptions): Promise<SearchPage<MovieSearchHit>>;
  rate(id: TmdbId, value: number, session: RatingSession): Promise<RatingResponse>;
  deleteRating(id: TmdbId, session: RatingSession): Promise<RatingResponse>;
}

export interface DiscoverCommonOptions extends PageOptions, LanguageOptions {
  includeAdult?: boolean;
  sortBy?: string;
  voteAverageGte?: number;
  voteAverageLte?: number;
  voteCountGte?: number;
  voteCountLte?: number;
  watchRegion?: string;
  withCompanies?: string;
  withGenres?: string;
  withKeywords?: string;
  withOriginCountry?: string;
  withOriginalLanguage?: string;
  withRuntimeGte?: number;
  withRuntimeLte?: number;
  withWatchMonetizationTypes?: string;
  withWatchProviders?: string;
  withoutCompanies?: string;
  withoutGenres?: string;
  withoutKeywords?: string;
  withoutWatchProviders?: string;
}

export interface MovieDiscoverOptions extends DiscoverCommonOptions {
  certification?: string;
  certificationGte?: string;
  certificationLte?: string;
  certificationCountry?: string;
  includeVideo?: boolean;
  primaryReleaseYear?: number;
  primaryReleaseDateGte?: string;
  primaryReleaseDateLte?: string;
  region?: string;
  releaseDateGte?: string;
  releaseDateLte?: string;
  withCast?: string;
  withCrew?: string;
  withPeople?: string;
  withReleaseType?: number;
  year?: number;
}

export interface TvDiscoverOptions extends DiscoverCommonOptions {
  airDateGte?: string;
  airDateLte?: string;
  firstAirDateYear?: number;
  firstAirDateGte?: string;
  firstAirDateLte?: string;
  includeNullFirstAirDates?: boolean;
  screenedTheatrically?: boolean;
  timezone?: string;
  withNetworks?: number;
  withStatus?: string;
  withType?: string;
}

export interface DiscoverMethods {
  movies(options?: MovieDiscoverOptions): Promise<SearchPage<MovieSearchHit>>;
  tv(options?: TvDiscoverOptions): Promise<SearchPage<TvSearchHit>>;
}

export type TrendingWindow = 'day' | 'week';

export interface TrendingMethods {
  all(window: TrendingWindow, options?: LanguageOptions): Promise<SearchPage<MultiSearchHit>>;
  movies(window: TrendingWindow, options?: LanguageOptions): Promise<SearchPage<MovieSearchHit>>;
  people(window: TrendingWindow, options?: LanguageOptions): Promise<SearchPage<PersonSearchHit>>;
  tv(window: TrendingWindow, options?: LanguageOptions): Promise<SearchPage<TvSearchHit>>;
}

export interface ReviewMethods {
  get(id: string): Promise<ReviewDetails>;
}

export interface KeywordDetails {
  id: TmdbId;
  name: string;
  [key: string]: unknown;
}

export interface KeywordMoviesPage extends SearchPage<MovieSearchHit> {
  id: TmdbId;
  [key: string]: unknown;
}

export interface KeywordMethods {
  get(id: TmdbId): Promise<KeywordDetails>;
  movies(id: TmdbId, options?: PageOptions & LanguageOptions & { includeAdult?: boolean }): Promise<KeywordMoviesPage>;
}

export interface NetworkDetails {
  id: TmdbId;
  name: string;
  headquarters?: string;
  homepage?: string;
  logo_path?: string | null;
  origin_country?: string;
  [key: string]: unknown;
}

export interface NetworkAlternativeNamesResponse {
  id: TmdbId;
  results: Array<{ name: string; type?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface NetworkImagesResponse {
  id: TmdbId;
  logos: ImageAsset[];
  [key: string]: unknown;
}

export interface NetworkMethods {
  get(id: TmdbId): Promise<NetworkDetails>;
  alternativeNames(id: TmdbId): Promise<NetworkAlternativeNamesResponse>;
  images(id: TmdbId): Promise<NetworkImagesResponse>;
}
