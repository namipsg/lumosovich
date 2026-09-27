import {
  Lumosovich,
  type CertificationsResponse,
  type CollectionSearchHit,
  type CompanySearchHit,
  type ConfigurationResponse,
  type Country,
  type CountryTimezones,
  type DepartmentJobs,
  type ExternalIdSource,
  type GenresResponse,
  type KeywordSearchHit,
  type Language,
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

void [collections, companies, keywords, config, countries, jobs, languages,
  translations, zones, movieCertifications, tvCertifications, movieGenres, tvGenres];
