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
  type MovieCatalogPage,
  type MovieAccountStates,
  type MovieDiscoverOptions,
  type NetworkDetails,
  type RatingResponse,
  type ReviewDetails,
  type PersonSearchHit,
  type PersonCreditsResponse,
  type PersonTaggedImagesPage,
  type CreditDetails,
  type ListDetails,
  type CreateListResponse,
  type GuestRatedMovie,
  type WatchProviderListResponse,
  type SearchPage,
  type TvCatalogPage,
  type TvCreditsResponse,
  type TvImagesResponse,
  type TvScreenedTheatricallyResponse,
  type TvChangeListPage,
  type TvEpisodeCreditsResponse,
  type TvEpisodeGroupDetails,
  type TvEpisodeGroupsResponse,
  type TvSeasonAccountStates,
} from 'tmdb-lumosovich';

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
const nowPlaying: Promise<MovieCatalogPage> = tmdb.movies.nowPlaying({ region: 'US', page: 1 });
const accountState: Promise<MovieAccountStates> = tmdb.movies.accountStates(550, { sessionId: 'session' });
const discovery: MovieDiscoverOptions = { withGenres: '28,12', voteAverageGte: 7.5 };
const discovered = tmdb.discover.movies(discovery);
const trending = tmdb.trending.all('week');
const review: Promise<ReviewDetails> = tmdb.reviews.get('review-id');
const network: Promise<NetworkDetails> = tmdb.networks.get(49);
const rating: Promise<RatingResponse> = tmdb.movies.rate(550, 8.5, { guestSessionId: 'guest' });
const movieCredits = tmdb.movies.credits(550, { language: 'fa-IR' });
const movieExternalIds = tmdb.movies.externalIds(550);
const movieImages = tmdb.movies.images(550, { imageLanguages: ['en', 'null'] });
const movieKeywords = tmdb.movies.keywords(550);
const movieLatest = tmdb.movies.latest();
const movieReleaseDates = tmdb.movies.releaseDates(550);
const movieTranslations = tmdb.movies.translations(550);
const movieVideos = tmdb.movies.videos(550, { language: 'fa-IR' });
const tvAiring: Promise<TvCatalogPage> = tmdb.tv.airingToday({ timezone: 'Asia/Tehran', page: 2 });
const tvCredits: Promise<TvCreditsResponse> = tmdb.tv.aggregateCredits(1399);
const tvImages: Promise<TvImagesResponse> = tmdb.tv.images(1399, { imageLanguages: ['en', 'null'] });
const tvScreened: Promise<TvScreenedTheatricallyResponse> = tmdb.tv.screenedTheatrically(1399);
const tvVideos = tmdb.tv.videos(1399, { videoLanguages: ['en', 'null'] });
const tvRating: Promise<RatingResponse> = tmdb.tv.rate(1399, 8.5, { sessionId: 'session' });
const tvChanges: Promise<TvChangeListPage> = tmdb.tv.changeList({ startDate: '2024-01-01', page: 2 });
const tvGroups: Promise<TvEpisodeGroupsResponse> = tmdb.tv.episodeGroups.list(1399);
const tvGroup: Promise<TvEpisodeGroupDetails> = tmdb.tv.episodeGroups.get('group-id');
const seasonStates: Promise<TvSeasonAccountStates> = tmdb.tv.seasons.accountStates(1399, 1, { sessionId: 'session' });
const seasonChanges = tmdb.tv.seasons.changes(3624, { page: 2 });
const episodeCredits: Promise<TvEpisodeCreditsResponse> = tmdb.tv.episodes.credits(1399, 1, 1);
const episodeRating: Promise<RatingResponse> = tmdb.tv.episodes.rate(1399, 1, 1, 8.5, { guestSessionId: 'guest' });
const personCredits: Promise<PersonCreditsResponse> = tmdb.people.combinedCredits(31, { language: 'fa-IR' });
const taggedImages: Promise<PersonTaggedImagesPage> = tmdb.people.taggedImages(31, { page: 2 });
const credit: Promise<CreditDetails> = tmdb.credits.get('6024a814c0ae36003d59cc3c');
const listDetails: Promise<ListDetails> = tmdb.lists.get(1, { page: 2 });
const createdList: Promise<CreateListResponse> = tmdb.lists.create({ name: 'Example', sessionId: 'session' });
const guestMovies: Promise<SearchPage<GuestRatedMovie>> = tmdb.guestSessions.ratedMovies('guest', { sortBy: 'created_at.desc' });
const providers: Promise<WatchProviderListResponse> = tmdb.watchProviders.movies({ watchRegion: 'US' });

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
// @ts-expect-error Trending accepts only day or week.
tmdb.trending.movies('month');
// @ts-expect-error Ratings require an explicit session.
tmdb.movies.rate(550, 8.5);
// @ts-expect-error A mutation cannot use two session kinds.
tmdb.movies.deleteRating(550, { sessionId: 'a', guestSessionId: 'b' });
// @ts-expect-error Discover does not accept arbitrary query keys.
tmdb.discover.movies({ unrecognized: true });
// @ts-expect-error TV popularity does not accept a timezone filter.
tmdb.tv.popular({ timezone: 'Asia/Tehran' });
// @ts-expect-error TV ratings require an explicit session.
tmdb.tv.rate(1399, 8.5);
// @ts-expect-error Video language options are not image language options.
tmdb.tv.videos(1399, { imageLanguages: ['en'] });
// @ts-expect-error Episode group IDs are strings.
tmdb.tv.episodeGroups.get(123);
// @ts-expect-error Season account states require an explicit session.
tmdb.tv.seasons.accountStates(1399, 1);
// @ts-expect-error Episode change feeds take an episode ID, not date options.
tmdb.tv.episodes.changes(63056, { page: 2 });
// @ts-expect-error Episode ratings require an explicit session.
tmdb.tv.episodes.rate(1399, 1, 1, 8.5);
// @ts-expect-error Person IDs must be numeric.
tmdb.people.movieCredits('31');
// @ts-expect-error Credit IDs must be strings.
tmdb.credits.get(31);
// @ts-expect-error Tagged images do not accept a language option.
tmdb.people.taggedImages(31, { language: 'en-US' });
// @ts-expect-error List writes require a user session.
tmdb.lists.addMovie(1, 550);
// @ts-expect-error List clearing requires explicit confirmation.
tmdb.lists.clear(1, { sessionId: 'session' });
// @ts-expect-error Guest ratings have a fixed sort order.
tmdb.guestSessions.ratedMovies('guest', { sortBy: 'rating.desc' });
// @ts-expect-error Provider regions do not accept watch-region filtering.
tmdb.watchProviders.regions({ watchRegion: 'US' });

void [collections, companies, keywords, config, countries, jobs, languages,
  translations, zones, movieCertifications, tvCertifications, movieGenres, tvGenres,
  collectionDetail, collectionImages, collectionTranslations, companyDetail,
  companyNames, companyImages, movieTitles, movieChanges, movieWatch, movieCredits,
  movieExternalIds, movieImages, movieKeywords, movieLatest, movieReleaseDates,
  movieTranslations, movieVideos, nowPlaying, accountState, discovered,
  trending, review, network, rating, tvAiring, tvCredits, tvImages,
  tvScreened, tvVideos, tvRating, tvChanges, tvGroups, tvGroup,
  seasonStates, seasonChanges, episodeCredits, episodeRating,
  personCredits, taggedImages, credit, listDetails, createdList, guestMovies, providers];
