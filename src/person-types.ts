import type { ImageAsset, PersonCredit, PersonDetails } from './detail-types.js';
import type { MovieChangeListOptions } from './catalog-types.js';
import type { MovieChangesOptions, MovieChangesResponse, TranslationsResponse } from './metadata-types.js';
import type { LanguageOptions } from './reference-types.js';
import type { PageOptions, SearchPage, TmdbId } from './types.js';

export type PersonChangeListOptions = MovieChangeListOptions;
export type PersonChangesOptions = MovieChangesOptions;
export type PersonChangesResponse = MovieChangesResponse;
export type PersonTranslationsResponse = TranslationsResponse;
export type PersonChangeListPage = SearchPage<{ id: TmdbId; adult?: boolean; [key: string]: unknown }>;

export interface PersonPopularHit {
  id: TmdbId;
  name: string;
  known_for?: Array<Record<string, unknown>>;
  profile_path?: string | null;
  [key: string]: unknown;
}

export type PersonPopularPage = SearchPage<PersonPopularHit>;

export interface PersonCreditsResponse {
  id: TmdbId;
  cast: PersonCredit[];
  crew: PersonCredit[];
  [key: string]: unknown;
}

export interface PersonExternalIdsResponse {
  id: TmdbId;
  imdb_id?: string | null;
  wikidata_id?: string | null;
  [key: string]: unknown;
}

export interface PersonImagesResponse {
  id: TmdbId;
  profiles: ImageAsset[];
  [key: string]: unknown;
}

export interface PersonTaggedImage extends ImageAsset {
  id: string;
  image_type: string;
  media_type: string;
  media: Record<string, unknown>;
}

export interface PersonTaggedImagesPage {
  id: TmdbId;
  page: number;
  results: PersonTaggedImage[];
  total_pages: number;
  total_results: number;
  [key: string]: unknown;
}

export interface CreditDetails {
  id: string;
  credit_type: string;
  media_type: 'movie' | 'tv';
  person: { id: TmdbId; name: string; [key: string]: unknown };
  media: { id: TmdbId; [key: string]: unknown };
  department?: string;
  job?: string;
  [key: string]: unknown;
}

export interface CreditMethods {
  get(creditId: string, options?: LanguageOptions): Promise<CreditDetails>;
}

export interface PersonResourceMethods {
  changeList(options?: PersonChangeListOptions): Promise<PersonChangeListPage>;
  changes(id: TmdbId, options?: PersonChangesOptions): Promise<PersonChangesResponse>;
  combinedCredits(id: TmdbId, options?: LanguageOptions): Promise<PersonCreditsResponse>;
  externalIds(id: TmdbId): Promise<PersonExternalIdsResponse>;
  images(id: TmdbId): Promise<PersonImagesResponse>;
  latest(): Promise<PersonDetails>;
  movieCredits(id: TmdbId, options?: LanguageOptions): Promise<PersonCreditsResponse>;
  popular(options?: PageOptions & LanguageOptions): Promise<PersonPopularPage>;
  taggedImages(id: TmdbId, options?: PageOptions): Promise<PersonTaggedImagesPage>;
  translations(id: TmdbId): Promise<PersonTranslationsResponse>;
  tvCredits(id: TmdbId, options?: LanguageOptions): Promise<PersonCreditsResponse>;
}
