import { createMovieMethods, createPersonMethods, createTvMethods } from './details.js';
import { TmdbHttpClient } from './http.js';
import { createImageMethods } from './images.js';
import { createCollectionMethods, createCompanyMethods } from './metadata.js';
import { createDiscoverMethods } from './discover.js';
import {
  createKeywordMethods, createNetworkMethods, createReviewMethods,
  createTrendingMethods,
} from './explore.js';
import { createSearchMethods } from './search.js';
import { createCertificationMethods, createConfigurationMethods, createGenreMethods } from './reference.js';
import type { CertificationMethods, ConfigurationMethods, GenreMethods } from './reference-types.js';
import type {
  ExternalIdSource,
  FindOptions,
  FindResponse,
  LumosovichOptions,
  SearchMethods,
} from './types.js';
import { validateFindResponse } from './validation.js';
import type { MovieMethods, PersonMethods, TvMethods } from './detail-types.js';
import type { ImageMethods } from './images.js';
import type { CollectionMethods, CompanyMethods } from './metadata-types.js';
import type { DiscoverMethods, KeywordMethods, NetworkMethods, ReviewMethods, TrendingMethods } from './catalog-types.js';

export { TmdbError } from './errors.js';
export type { TmdbErrorCode } from './errors.js';
export type { ImageMethods, ImageSize } from './images.js';
export type {
  DiscoverMethods, DiscoverCommonOptions, KeywordDetails, KeywordMethods,
  KeywordMoviesPage, MovieAccountStates, MovieCatalogMethods, MovieCatalogOptions,
  MovieCatalogPage, MovieChangeListOptions, MovieChangeListPage,
  MovieDiscoverOptions, MovieListHit, MovieListPage, NetworkAlternativeNamesResponse,
  NetworkDetails, NetworkImagesResponse, NetworkMethods, RatingResponse, RatingSession,
  ReviewDetails, ReviewMethods, ReviewPage, ReviewSummary, TrendingMethods,
  TrendingWindow, TvDiscoverOptions,
} from './catalog-types.js';
export type {
  Certification,
  CertificationMethods,
  CertificationsResponse,
  ConfigurationMethods,
  ConfigurationResponse,
  Country,
  CountryTimezones,
  DepartmentJobs,
  GenreMethods,
  GenresResponse,
  ImageConfiguration,
  Language,
  LanguageOptions,
} from './reference-types.js';
export type {
  CollectionDetails,
  CollectionImagesResponse,
  CollectionMethods,
  CompanyAlternativeNamesResponse,
  CompanyDetails,
  CompanyImagesResponse,
  CompanyMethods,
  ImageOptions,
  MovieAlternativeTitlesOptions,
  MovieAlternativeTitlesResponse,
  MovieChange,
  MovieChangesOptions,
  MovieChangesResponse,
  MovieCreditsResponse,
  MovieExternalIdsResponse,
  MovieImagesResponse,
  MovieKeywordsResponse,
  MovieMetadataMethods,
  MovieVideosResponse,
  MovieWatchProvidersResponse,
  Translation,
  TranslationsResponse,
  WatchProvider,
} from './metadata-types.js';
export type {
  CreditPerson,
  CreditsResponse,
  DetailOptions,
  EpisodeAppend,
  EpisodeDetailOptions,
  ExternalIdsResponse,
  Genre,
  ImageAsset,
  ImagesResponse,
  MovieAppend,
  MovieDetailOptions,
  MovieDetails,
  MovieMethods,
  MovieReleaseDatesResponse,
  PersonAppend,
  PersonCombinedCreditsResponse,
  PersonCredit,
  PersonDetailOptions,
  PersonDetails,
  PersonMethods,
  SeasonAppend,
  SeasonDetailOptions,
  TvAppend,
  TvContentRatingsResponse,
  TvDetailOptions,
  TvDetails,
  TvEpisodeDetails,
  TvEpisodeSummary,
  TvMethods,
  TvSeasonDetails,
  TvSeasonSummary,
  Video,
  VideosResponse,
} from './detail-types.js';
export type {
  CollectionSearchHit,
  CollectionSearchOptions,
  CompanySearchHit,
  ExternalIdSource,
  FindEpisodeHit,
  FindHit,
  FindOptions,
  FindResponse,
  LumosovichOptions,
  KeywordSearchHit,
  MovieSearchHit,
  MovieSearchOptions,
  MultiSearchHit,
  PageOptions,
  PersonSearchHit,
  SearchMethods,
  SearchOptions,
  SearchPage,
  TmdbId,
  TvSearchHit,
  TvSearchOptions,
} from './types.js';
export type {
  TvAccountStates, TvAggregateCredit, TvAlternativeTitlesResponse,
  TvCatalogMethods, TvCatalogOptions, TvCatalogPage, TvCreditsResponse,
  TvExternalIdsResponse, TvImagesResponse, TvKeywordsResponse, TvListPage,
  TvMetadataMethods, TvScreenedTheatricallyResponse, TvTranslationsResponse,
  TvVideoOptions, TvVideosResponse, TvWatchProvidersResponse,
} from './tv-types.js';

/** A small TMDB client with raw, typed responses. */
export class Lumosovich {
  readonly find: {
    byExternalId: (
      externalId: string,
      source: ExternalIdSource,
      options?: FindOptions,
    ) => Promise<FindResponse>;
  };
  readonly search: SearchMethods;
  readonly movies: MovieMethods;
  readonly collections: CollectionMethods;
  readonly companies: CompanyMethods;
  readonly discover: DiscoverMethods;
  readonly trending: TrendingMethods;
  readonly reviews: ReviewMethods;
  readonly keywords: KeywordMethods;
  readonly networks: NetworkMethods;
  readonly tv: TvMethods;
  readonly people: PersonMethods;
  readonly images: ImageMethods;
  readonly configuration: ConfigurationMethods;
  readonly certifications: CertificationMethods;
  readonly genres: GenreMethods;

  constructor(options: LumosovichOptions) {
    const http = new TmdbHttpClient(options);

    this.find = {
      byExternalId: async (externalId, source, findOptions = {}) => {
        if (
          typeof externalId !== 'string' || !externalId.trim() ||
          ['.', '..'].includes(externalId.trim())
        ) {
          throw new TypeError('externalId must be a non-empty path identifier');
        }
        if (![
          'imdb_id', 'facebook_id', 'instagram_id', 'tvdb_id',
          'tiktok_id', 'twitter_id', 'wikidata_id', 'youtube_id',
        ].includes(source)) {
          throw new TypeError('Unsupported external ID source');
        }
        const payload = await http.get(
          `find/${encodeURIComponent(externalId.trim())}`,
          { external_source: source, language: findOptions.language },
        );
        return validateFindResponse(payload);
      },
    };
    this.search = createSearchMethods(http);
    this.movies = createMovieMethods(http);
    this.collections = createCollectionMethods(http);
    this.companies = createCompanyMethods(http);
    this.discover = createDiscoverMethods(http);
    this.trending = createTrendingMethods(http);
    this.reviews = createReviewMethods(http);
    this.keywords = createKeywordMethods(http);
    this.networks = createNetworkMethods(http);
    this.tv = createTvMethods(http);
    this.people = createPersonMethods(http);
    this.images = createImageMethods();
    this.configuration = createConfigurationMethods(http);
    this.certifications = createCertificationMethods(http);
    this.genres = createGenreMethods(http);
  }
}
