import {
  Lumosovich,
  type CertificationsResponse,
  type CollectionSearchHit,
  type CompanySearchHit,
  type CollectionDetails,
  type CompanyDetails,
  type ConfigurationResponse,
  type Country,
  type CountryTimezones,
  type DepartmentJobs,
  type ExternalIdSource,
  type GenresResponse,
  type KeywordSearchHit,
  type Language,
  type MovieAlternativeTitlesResponse,
  type MovieChangesResponse,
  type MovieWatchProvidersResponse,
  type PersonSearchHit,
  type SearchPage,
} from 'lumosovich';

const tmdb = new Lumosovich({ apiKey: 'type-check' });
const sources: ExternalIdSource[] = [
  'imdb_id', 'facebook_id', 'instagram_id', 'tvdb_id',
  'tiktok_id', 'twitter_id', 'wikidata_id', 'youtube_id',
];
for (const source of sources) tmdb.find.byExternalId('external-id', source);

const collections: Promise<SearchPage<CollectionSearchHit>> = tmdb.search.collections('Star Wars', {
  region: 'US', language: 'en-US', includeAdult: false, page: 2,
});
const companies: Promise<SearchPage<CompanySearchHit>> = tmdb.search.companies('Lucasfilm', { page: 2 });
const keywords: Promise<SearchPage<KeywordSearchHit>> = tmdb.search.keywords('space', { page: 2 });
const people: Promise<SearchPage<PersonSearchHit>> = tmdb.search.people('Leonardo DiCaprio', { includeAdult: false });
const config: Promise<ConfigurationResponse> = tmdb.configuration.get();
const countries: Promise<Country[]> = tmdb.configuration.countries({ language: 'fa-IR' });
const jobs: Promise<DepartmentJobs[]> = tmdb.configuration.jobs();
const languages: Promise<Language[]> = tmdb.configuration.languages();
const translations: Promise<string[]> = tmdb.configuration.primaryTranslations();
const zones: Promise<CountryTimezones[]> = tmdb.configuration.timezones();
const movieCertifications: Promise<CertificationsResponse> = tmdb.certifications.movies();
const tvCertifications: Promise<CertificationsResponse> = tmdb.certifications.tv();
const movieGenres: Promise<GenresResponse> = tmdb.genres.movies({ language: 'fa-IR' });
const tvGenres: Promise<GenresResponse> = tmdb.genres.tv();
const collectionDetail: Promise<CollectionDetails> = tmdb.collections.get(10, { language: 'fa-IR' });
const collectionImages = tmdb.collections.images(10, { imageLanguages: ['en', 'null'] });
const collectionTranslations = tmdb.collections.translations(10);
const companyDetail: Promise<CompanyDetails> = tmdb.companies.get(1);
const companyNames = tmdb.companies.alternativeNames(1);
const companyImages = tmdb.companies.images(1);
const movieTitles: Promise<MovieAlternativeTitlesResponse> = tmdb.movies.alternativeTitles(550, { country: 'US' });
const movieChanges: Promise<MovieChangesResponse> = tmdb.movies.changes(550, { startDate: '2024-01-01', page: 2 });
const movieWatch: Promise<MovieWatchProvidersResponse> = tmdb.movies.watchProviders(550);
const movieCredits = tmdb.movies.credits(550, { language: 'fa-IR' });
const movieExternalIds = tmdb.movies.externalIds(550);
const movieImages = tmdb.movies.images(550, { imageLanguages: ['en', 'null'] });
const movieKeywords = tmdb.movies.keywords(550);
const movieLatest = tmdb.movies.latest();
const movieReleaseDates = tmdb.movies.releaseDates(550);
const movieTranslations = tmdb.movies.translations(550);
const movieVideos = tmdb.movies.videos(550, { language: 'fa-IR' });

people.then((page) => {
  const mediaType: 'movie' | 'tv' | undefined = page.results[0]?.known_for?.[0]?.media_type;
  return mediaType;
});

// @ts-expect-error Company search does not support language.
tmdb.search.companies('Lucasfilm', { language: 'en-US' });
// @ts-expect-error Keyword search does not support adult filtering.
tmdb.search.keywords('space', { includeAdult: true });
// @ts-expect-error Configuration languages has no per-call language parameter.
tmdb.configuration.languages({ language: 'en-US' });
// @ts-expect-error Unknown external-ID source.
tmdb.find.byExternalId('id', 'unknown');
// @ts-expect-error Numeric pagination is required.
tmdb.search.people('query', { page: '2' });
// @ts-expect-error Collection search has no year filter.
tmdb.search.collections('query', { year: 2010 });
// @ts-expect-error Company details do not accept a language option.
tmdb.companies.get(1, { language: 'en-US' });
// @ts-expect-error Movie alternative titles accept a country, not language.
tmdb.movies.alternativeTitles(550, { language: 'en-US' });
// @ts-expect-error Per-movie changes use ISO dates, not a language option.
tmdb.movies.changes(550, { language: 'en-US' });

void [collections, companies, keywords, config, countries, jobs, languages,
  translations, zones, movieCertifications, tvCertifications, movieGenres, tvGenres,
  collectionDetail, collectionImages, collectionTranslations, companyDetail,
  companyNames, companyImages, movieTitles, movieChanges, movieWatch, movieCredits,
  movieExternalIds, movieImages, movieKeywords, movieLatest, movieReleaseDates,
  movieTranslations, movieVideos];
