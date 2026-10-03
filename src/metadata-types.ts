import type { CreditPerson, ImageAsset, MovieDetails, MovieReleaseDatesResponse } from './detail-types.js';
import type { LanguageOptions } from './reference-types.js';
import type { MovieSearchHit, TmdbId } from './types.js';

export interface ImageOptions extends LanguageOptions {
  /** Include language-neutral images with 'null'. */
  imageLanguages?: readonly string[];
}

export interface MovieAlternativeTitlesOptions {
  country?: string;
}

export interface MovieChangesOptions {
  startDate?: string;
  endDate?: string;
  page?: number;
}

export interface MovieAlternativeTitlesResponse {
  id: TmdbId;
  titles: Array<{ iso_3166_1: string; title: string; type?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface MovieCreditsResponse {
  id: TmdbId;
  cast: CreditPerson[];
  crew: CreditPerson[];
  [key: string]: unknown;
}

export interface MovieExternalIdsResponse {
  id: TmdbId;
  imdb_id?: string | null;
  wikidata_id?: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  [key: string]: unknown;
}

export interface MovieImagesResponse {
  id: TmdbId;
  backdrops: ImageAsset[];
  logos: ImageAsset[];
  posters: ImageAsset[];
  [key: string]: unknown;
}

export interface MovieKeywordsResponse {
  id: TmdbId;
  keywords: Array<{ id: TmdbId; name: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface Translation {
  iso_3166_1: string;
  iso_639_1: string;
  name: string;
  english_name: string;
  data: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TranslationsResponse {
  id: TmdbId;
  translations: Translation[];
  [key: string]: unknown;
}

export interface MovieVideosResponse {
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

export interface WatchProvider {
  provider_id: TmdbId;
  provider_name: string;
  logo_path: string;
  display_priority?: number;
  [key: string]: unknown;
}

export interface MovieWatchProvidersResponse {
  id: TmdbId;
  results: Record<string, {
    link?: string;
    flatrate?: WatchProvider[];
    rent?: WatchProvider[];
    buy?: WatchProvider[];
    free?: WatchProvider[];
    ads?: WatchProvider[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface MovieChange {
  key: string;
  items: Array<{ id?: string; action?: string; time?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface MovieChangesResponse {
  changes: MovieChange[];
  [key: string]: unknown;
}

export interface MovieMetadataMethods {
  alternativeTitles(id: TmdbId, options?: MovieAlternativeTitlesOptions): Promise<MovieAlternativeTitlesResponse>;
  changes(id: TmdbId, options?: MovieChangesOptions): Promise<MovieChangesResponse>;
  credits(id: TmdbId, options?: LanguageOptions): Promise<MovieCreditsResponse>;
  externalIds(id: TmdbId): Promise<MovieExternalIdsResponse>;
  images(id: TmdbId, options?: ImageOptions): Promise<MovieImagesResponse>;
  keywords(id: TmdbId): Promise<MovieKeywordsResponse>;
  latest(): Promise<MovieDetails>;
  releaseDates(id: TmdbId): Promise<MovieReleaseDatesResponse>;
  translations(id: TmdbId): Promise<TranslationsResponse>;
  videos(id: TmdbId, options?: LanguageOptions): Promise<MovieVideosResponse>;
  watchProviders(id: TmdbId): Promise<MovieWatchProvidersResponse>;
}

export interface CollectionDetails {
  id: TmdbId;
  name: string;
  original_language?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  parts: MovieSearchHit[];
  [key: string]: unknown;
}

export interface CollectionImagesResponse {
  id: TmdbId;
  backdrops: ImageAsset[];
  posters: ImageAsset[];
  [key: string]: unknown;
}

export interface CollectionMethods {
  get(id: TmdbId, options?: LanguageOptions): Promise<CollectionDetails>;
  images(id: TmdbId, options?: ImageOptions): Promise<CollectionImagesResponse>;
  translations(id: TmdbId): Promise<TranslationsResponse>;
}

export interface CompanyDetails {
  id: TmdbId;
  name: string;
  description?: string;
  headquarters?: string;
  homepage?: string;
  logo_path?: string | null;
  origin_country?: string;
  parent_company?: { id: TmdbId; name: string; [key: string]: unknown } | null;
  [key: string]: unknown;
}

export interface CompanyAlternativeNamesResponse {
  id: TmdbId;
  results: Array<{ name: string; type?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface CompanyImagesResponse {
  id: TmdbId;
  logos: ImageAsset[];
  [key: string]: unknown;
}

export interface CompanyMethods {
  get(id: TmdbId): Promise<CompanyDetails>;
  alternativeNames(id: TmdbId): Promise<CompanyAlternativeNamesResponse>;
  images(id: TmdbId): Promise<CompanyImagesResponse>;
}
