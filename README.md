# Lumosovich ✨

[![npm version](https://img.shields.io/npm/v/tmdb-lumosovich.svg)](https://www.npmjs.com/package/tmdb-lumosovich)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/namipsg/lumosovich/blob/main/LICENSE)
[![CI](https://github.com/namipsg/lumosovich/actions/workflows/ci.yml/badge.svg)](https://github.com/namipsg/lumosovich/actions/workflows/ci.yml)

A small, typed Node.js wrapper for the TMDB API, including IMDb ID lookup through TMDB.

**Lumosovich** supports external-ID lookup, search, discovery, trending, movie and TV series catalogs and metadata, reviews, keywords, networks, collections, companies, configuration, people and credit resources, lists, guest-session ratings, watch-provider catalogs, account operations, authentication and session lifecycle, and TV seasons, episodes, and episode groups.

The name comes from **Lumos** — a spell for bringing light — with a little Russian-style `-ovich` treatment.

Light up the movie database.

## Current status

Install [tmdb-lumosovich on npm](https://www.npmjs.com/package/tmdb-lumosovich), with source and issues on [GitHub](https://github.com/namipsg/lumosovich). Version `0.11.0` covers **all 152 TMDB v3 operations** measured against the official specification pinned on September 27, 2026. This is an early `0.x` library; the final parity audit and stable release are planned for `1.0.0`. See the [coverage baseline](https://github.com/namipsg/lumosovich/blob/main/spec/README.md) for how coverage is checked.

The package moved from `lumosovich` to `tmdb-lumosovich` in version `0.7.1`; the public `Lumosovich` class kept its name. Previously published `lumosovich` versions remain installable, but new projects should use `tmdb-lumosovich`. The live smoke test exercises all 122 public and temporary-session GET routes without changing account data. A new, unrated guest session currently receives HTTP 404 from TMDB on its rated-content routes. Account operations, list mutations, account-state methods, ratings, and user-session lifecycle writes are verified by offline request contracts.

The release passes 324 offline tests and TypeScript declaration checks. See the [changelog](https://github.com/namipsg/lumosovich/blob/main/CHANGELOG.md) for earlier releases.

## Installation

```bash
npm install tmdb-lumosovich
```

If you already installed `lumosovich`, replace the dependency with `npm uninstall lumosovich && npm install tmdb-lumosovich` and update imports to `tmdb-lumosovich`. The exported `Lumosovich` class keeps its name.

Requires Node.js 22+ and a TMDB v3 API key or API Read Access Token. Keep your credential in an environment variable; do not commit it to your project.

## Quick Start

Set `TMDB_API_KEY` in your environment before running this example:

```js
import { Lumosovich } from 'tmdb-lumosovich';

const tmdb = new Lumosovich({
  apiKey: process.env.TMDB_API_KEY,
});

const matches = await tmdb.find.byExternalId('tt1375666', 'imdb_id');
const movieId = matches.movie_results[0]?.id;

console.log(movieId);
// A numeric TMDB ID, if TMDB has a match

if (movieId) {
  const movie = await tmdb.movies.get(movieId);
  console.log(movie.title);
}
```

CommonJS projects can use `const { Lumosovich } = require('tmdb-lumosovich');` instead.

For an API Read Access Token, initialize the client with
`accessToken: process.env.TMDB_ACCESS_TOKEN` in place of `apiKey`. Supply exactly
one credential.

## Why Lumosovich?

Working directly with an HTTP API shouldn't mean repeating URLs, query parameters, authentication, and TypeScript definitions throughout your application.

Lumosovich puts a small, predictable API between your application and TMDB. It keeps TMDB's numeric IDs and `snake_case` response fields intact. IMDb IDs such as `tt1375666` and `nm0000138` are external IDs, not interchangeable with TMDB IDs.

## Find TMDB records by IMDb ID

Use `find.byExternalId(id, 'imdb_id')` to match an IMDb ID to movie, TV, or person records in TMDB. It returns TMDB data, not IMDb ratings or an IMDb API response.

```js
const matches = await tmdb.find.byExternalId('nm0000138', 'imdb_id');
const personId = matches.person_results[0]?.id;
```

The full find response is returned. Empty arrays mean no match; if TMDB returns multiple hits, Lumosovich does not guess which one to use.

Find accepts `imdb_id`, `facebook_id`, `instagram_id`, `tvdb_id`, `tiktok_id`,
`twitter_id`, `wikidata_id`, and `youtube_id`. Source availability varies by
object type; see [TMDB's Find reference](https://developer.themoviedb.org/reference/find-by-id).

## Search

```js
const movies = await tmdb.search.movies('Inception', { year: 2010, page: 1 });
const shows = await tmdb.search.tv('Game of Thrones', {
  firstAirDateYear: 2011,
});
const mixed = await tmdb.search.multi('The Office');
const people = await tmdb.search.people('Leonardo DiCaprio');
const collections = await tmdb.search.collections('Star Wars', { region: 'US' });
const companies = await tmdb.search.companies('Lucasfilm', { page: 1 });
const keywords = await tmdb.search.keywords('space');
```

Search returns TMDB's paginated `page`, `results`, `total_pages`, and `total_results` fields. Multi-search can include people as well as movies and TV shows; callers that want only content should filter `results` by `media_type`. TMDB multi-search has no year parameter, so year filtering belongs in the caller. People results retain their `known_for` movie/TV records.

| Method | Supported options |
| --- | --- |
| `search.movies` | `page`, `language`, `includeAdult`, `year`, `primaryReleaseYear`, `region` |
| `search.tv` | `page`, `language`, `includeAdult`, `year`, `firstAirDateYear` |
| `search.multi` | `page`, `language`, `includeAdult` |
| `search.people` | `page`, `language`, `includeAdult` |
| `search.collections` | `page`, `language`, `includeAdult`, `region` |
| `search.companies` | `page` |
| `search.keywords` | `page` |

Queries must be non-empty strings and pages must be positive integers. Company
and keyword search have no language or adult-filter parameters.

## Configuration, certifications, and genres

```js
const config = await tmdb.configuration.get();
console.log(config.images.secure_base_url, config.images.poster_sizes);

const countries = await tmdb.configuration.countries({ language: 'fa-IR' });
const jobs = await tmdb.configuration.jobs();
const languages = await tmdb.configuration.languages();
const translations = await tmdb.configuration.primaryTranslations();
const timezones = await tmdb.configuration.timezones();

const movieCertifications = await tmdb.certifications.movies();
const tvCertifications = await tmdb.certifications.tv();
console.log(movieCertifications.certifications.US);

const movieGenres = await tmdb.genres.movies({ language: 'fa-IR' });
const tvGenres = await tmdb.genres.tv();
console.log(movieGenres.genres);
```

Configuration lists return raw arrays; certifications remain grouped by region
under `certifications`, and genre lists remain under `genres`. Countries and
genres accept a language override. Other reference methods take no options and
send no language parameter. Configuration is fetched explicitly without caching.

## Details and optional enrichment

Detail methods require numeric TMDB IDs. By default they fetch only the top-level record:

```js
const movie = await tmdb.movies.get(27205);
const show = await tmdb.tv.get(1399);
const person = await tmdb.people.get(6193);
```

Use `append` to request relevant same-namespace data in the same HTTP call:

```js
const enrichedMovie = await tmdb.movies.get(27205, {
  language: 'fa-IR',
  append: ['credits', 'images', 'videos', 'external_ids', 'release_dates'],
  imageLanguages: ['fa', 'en', 'null'],
});

const enrichedShow = await tmdb.tv.get(1399, {
  append: ['aggregate_credits', 'images', 'content_ratings'],
  imageLanguages: ['en', 'null'],
});

const enrichedPerson = await tmdb.people.get(6193, {
  append: ['combined_credits', 'external_ids'],
});
```

`imageLanguages` requires `images` in `append`; `'null'` includes language-neutral assets. For TV, `aggregate_credits` covers the whole series, whereas `credits` represents the latest season. Responses retain TMDB fields and image paths rather than inventing IMDb-shaped values: `vote_average` is a TMDB score, not an IMDb rating, and person details do not provide awards or height.

## Movie metadata, collections, and companies

Movie metadata is available as individual requests as well as through supported `append` targets on `movies.get`:

```js
const titles = await tmdb.movies.alternativeTitles(550, { country: 'US' });
const credits = await tmdb.movies.credits(550, { language: 'en-US' });
const externalIds = await tmdb.movies.externalIds(550);
const images = await tmdb.movies.images(550, {
  imageLanguages: ['en', 'null'],
});
const keywords = await tmdb.movies.keywords(550);
const releaseDates = await tmdb.movies.releaseDates(550);
const translations = await tmdb.movies.translations(550);
const videos = await tmdb.movies.videos(550);
const providers = await tmdb.movies.watchProviders(550);
const changes = await tmdb.movies.changes(550, {
  startDate: '2024-01-01',
  endDate: '2024-01-05',
  page: 1,
});
const latestMovie = await tmdb.movies.latest();
```

`watchProviders().results` is keyed by country code. `changes()` returns TMDB's `changes` array and accepts optional `YYYY-MM-DD` dates and a positive page. `latest()` returns the most recently created movie record, which may be incomplete while it is being edited on TMDB.

```js
const collection = await tmdb.collections.get(10, { language: 'en-US' });
const collectionImages = await tmdb.collections.images(10, {
  imageLanguages: ['en', 'null'],
});
const collectionTranslations = await tmdb.collections.translations(10);

const company = await tmdb.companies.get(1);
const alternativeNames = await tmdb.companies.alternativeNames(1);
const companyImages = await tmdb.companies.images(1);
```

`collections.get().parts` contains the collection's movie records. `movies.images()` and `collections.images()` accept a language override and `imageLanguages`; company methods and the nonlocalized movie/collection methods send no language parameter. All methods return TMDB's raw `snake_case` fields and require numeric TMDB IDs, except `movies.latest()`.

## Catalogs, discovery, and trending

```js
const playing = await tmdb.movies.nowPlaying({ region: 'US', page: 1 });
const popular = await tmdb.movies.popular();
const topRated = await tmdb.movies.topRated();
const upcoming = await tmdb.movies.upcoming({ region: 'US' });
const changedMovies = await tmdb.movies.changeList({
  startDate: '2024-01-01', endDate: '2024-01-07', page: 1,
});

const recommendations = await tmdb.movies.recommendations(550);
const similar = await tmdb.movies.similar(550);
const lists = await tmdb.movies.lists(550);
const movieReviews = await tmdb.movies.reviews(550);

const actionMovies = await tmdb.discover.movies({
  withGenres: '28', voteAverageGte: 7, sortBy: 'popularity.desc',
});
const dramaShows = await tmdb.discover.tv({
  withGenres: '18', firstAirDateYear: 2024,
});
const trendingMovies = await tmdb.trending.movies('week');
const trendingAcrossMedia = await tmdb.trending.all('day');
```

Catalog, discovery, and trending results retain TMDB's pagination fields. `nowPlaying()` and `upcoming()` also return TMDB's `dates` range. Trending supports `day` and `week` for `all`, `movies`, `people`, and `tv`. `changeList()` reports changed movie IDs; `movies.changes(id)` returns the changes for one movie.

## TV series catalogs and metadata

```js
const airing = await tmdb.tv.airingToday({ timezone: 'Asia/Tehran', page: 1 });
const upcoming = await tmdb.tv.onTheAir({ page: 1 });
const popularShows = await tmdb.tv.popular();
const topRatedShows = await tmdb.tv.topRated();

const seriesId = 1399;
const cast = await tmdb.tv.aggregateCredits(seriesId);
const seasonCredits = await tmdb.tv.credits(seriesId);
const titles = await tmdb.tv.alternativeTitles(seriesId);
const ratings = await tmdb.tv.contentRatings(seriesId);
const externalIds = await tmdb.tv.externalIds(seriesId);
const images = await tmdb.tv.images(seriesId, { imageLanguages: ['en', 'null'] });
const keywords = await tmdb.tv.keywords(seriesId);
const translations = await tmdb.tv.translations(seriesId);
const videos = await tmdb.tv.videos(seriesId, { videoLanguages: ['en', 'null'] });
const providers = await tmdb.tv.watchProviders(seriesId);
const screenedEpisodes = await tmdb.tv.screenedTheatrically(seriesId);
const latestSeries = await tmdb.tv.latest();

const lists = await tmdb.tv.lists(seriesId);
const recommendations = await tmdb.tv.recommendations(seriesId);
const reviews = await tmdb.tv.reviews(seriesId);
const similar = await tmdb.tv.similar(seriesId);
```

Catalog and recommendation methods return TMDB's paginated results. `airingToday()` and `onTheAir()` accept a `timezone`; `popular()` and `topRated()` accept only `page` and `language`. `aggregateCredits()` covers the whole series, while `credits()` reports the latest season's cast and crew. `images()` accepts `imageLanguages`; `videos()` uses `videoLanguages` for the separate `include_video_language` query. `latest()` may return an incomplete, newly created record. All methods retain TMDB's raw `snake_case` fields.

Discover accepts all query parameters in the pinned TMDB v3 specification through camel-case options. Common filters include `includeAdult`, `sortBy`, `voteAverageGte/Lte`, `voteCountGte/Lte`, `watchRegion`, `withGenres`, `withKeywords`, `withCompanies`, `withWatchProviders`, and their `without*` counterparts. Movie-only options include `certification*`, `primaryReleaseDateGte/Lte`, `releaseDateGte/Lte`, `region`, `withCast`, `withCrew`, `withPeople`, `withReleaseType`, and `year`. TV-only options include `airDateGte/Lte`, `firstAirDateGte/Lte`, `firstAirDateYear`, `withNetworks`, `withStatus`, and `withType`. The exported `MovieDiscoverOptions` and `TvDiscoverOptions` types list every supported filter; dates use `YYYY-MM-DD` and pages start at 1.

## Reviews, keywords, networks, and ratings

```js
const review = await tmdb.reviews.get(movieReviews.results[0].id);
const keyword = await tmdb.keywords.get(1701);
const keywordMovies = await tmdb.keywords.movies(1701, { includeAdult: false });
const network = await tmdb.networks.get(49);
const networkNames = await tmdb.networks.alternativeNames(49);
const networkImages = await tmdb.networks.images(49);
```

Review IDs are strings; movie, keyword, and network IDs are positive TMDB numbers. The review example assumes `movieReviews.results` is nonempty.

Account states and ratings need an existing TMDB session, in addition to the API key or Read Access Token used to construct the client:

```js
const sessionId = process.env.TMDB_SESSION_ID;
if (!sessionId) throw new Error('Set TMDB_SESSION_ID first');
const session = { sessionId };
const state = await tmdb.movies.accountStates(550, session);
await tmdb.movies.rate(550, 8.5, session);
await tmdb.movies.deleteRating(550, session);

const showState = await tmdb.tv.accountStates(1399, session);
await tmdb.tv.rate(1399, 8.5, session);
await tmdb.tv.deleteRating(1399, session);

const seasonState = await tmdb.tv.seasons.accountStates(1399, 1, session);
const episodeState = await tmdb.tv.episodes.accountStates(1399, 1, 1, session);
await tmdb.tv.episodes.rate(1399, 1, 1, 8.5, session);
await tmdb.tv.episodes.deleteRating(1399, 1, 1, session);
```

Use `guestSessionId` instead of `sessionId` for a guest session; supply exactly one. Movie, series, and episode ratings range from 0.5 to 10 in half-point steps. `deleteRating()` removes the rating associated with that session. Create a guest session or request a user session with `tmdb.authentication` as shown below. The live smoke test does not mutate an account.
TMDB may remove a newly rated movie from the account's watchlist by default; see [TMDB's rating behavior](https://developer.themoviedb.org/reference/movie-add-rating).

## Seasons and episodes

```js
const season = await tmdb.tv.seasons.get(1399, 1);
const firstEpisode = season.episodes.find((episode) => episode.episode_number === 1);

const seasonCast = await tmdb.tv.seasons.aggregateCredits(1399, 1);
const seasonCredits = await tmdb.tv.seasons.credits(1399, 1);
const seasonIds = await tmdb.tv.seasons.externalIds(1399, 1);
const seasonImages = await tmdb.tv.seasons.images(1399, 1);
const seasonTranslations = await tmdb.tv.seasons.translations(1399, 1);
const seasonVideos = await tmdb.tv.seasons.videos(1399, 1);
const seasonProviders = await tmdb.tv.seasons.watchProviders(1399, 1);
const seasonChanges = await tmdb.tv.seasons.changes(season.id);

if (firstEpisode) {
  const detail = await tmdb.tv.episodes.get(1399, 1, 1, {
    append: ['external_ids', 'images'],
    imageLanguages: ['en', 'null'],
  });
  console.log(detail.id, detail.external_ids?.imdb_id);

  const credits = await tmdb.tv.episodes.credits(1399, 1, 1);
  const ids = await tmdb.tv.episodes.externalIds(1399, 1, 1);
  const images = await tmdb.tv.episodes.images(1399, 1, 1);
  const translations = await tmdb.tv.episodes.translations(1399, 1, 1);
  const videos = await tmdb.tv.episodes.videos(1399, 1, 1);
  const changes = await tmdb.tv.episodes.changes(detail.id);
}
```

Season and episode coordinates use a numeric series ID and season/episode slots. Season `0` is supported for specials. `seasons.changes()` and `episodes.changes()` use the IDs returned by season and episode details, respectively; they do not take slot numbers. The wrapper checks returned series and episode identity for detail requests; missing IMDb IDs remain missing rather than being fabricated.

TV change feeds and episode groups are also available:

```js
const changedSeries = await tmdb.tv.changeList({ startDate: '2024-01-01' });
const seriesChanges = await tmdb.tv.changes(1399);
const groups = await tmdb.tv.episodeGroups.list(1399);
const group = groups.results[0]
  ? await tmdb.tv.episodeGroups.get(groups.results[0].id)
  : undefined;
```

`changeList()` reports changed series IDs. Episode-group IDs are strings supplied by TMDB. The methods return TMDB's original response fields and preserve empty collections.

## People and credits

Use numeric TMDB person IDs for people resources. Credit details use the string `credit_id` returned in a person's cast or crew record.

```js
const personId = 31;
const popularPeople = await tmdb.people.popular({ page: 1 });
const movieCredits = await tmdb.people.movieCredits(personId);
const tvCredits = await tmdb.people.tvCredits(personId);
const combinedCredits = await tmdb.people.combinedCredits(personId);
const creditId = movieCredits.cast[0]?.credit_id;
const credit = creditId ? await tmdb.credits.get(creditId) : undefined;

const externalIds = await tmdb.people.externalIds(personId);
const portraits = await tmdb.people.images(personId);
const tagged = await tmdb.people.taggedImages(personId, { page: 1 });
const translations = await tmdb.people.translations(personId);
const latestPerson = await tmdb.people.latest();
const changedPeople = await tmdb.people.changeList({ page: 1 });
const changes = await tmdb.people.changes(personId);
```

The three credit collections return `cast` and `crew` arrays with TMDB's original fields; `combinedCredits()` includes both movie and TV roles. `taggedImages()` has paginated image records, including episode stills, while `images()` has portrait profiles. TMDB can report `page: 0` for tagged images even when page 1 is requested. `changeList()` and `changes()` accept optional `startDate`, `endDate`, and `page`; dates use `YYYY-MM-DD`. `popular()` and `taggedImages()` accept a positive page. Credit details, popular people, and the three credit collections support a `language` override. `latest()` can be incomplete while a new person record is being edited on TMDB.

## Lists, guest sessions, and watch providers

Public lists use numeric TMDB list IDs. Reading list details and checking whether a movie is present require no user session:

```js
const list = await tmdb.lists.get(1, { page: 1 });
const status = await tmdb.lists.itemStatus(1, 550);
console.log(list.name, status.item_present);
```

Creating or changing a list requires an existing TMDB **user** session. Supply `sessionId` explicitly for each write; a guest session cannot manage lists.

```js
const sessionId = process.env.TMDB_SESSION_ID;
if (!sessionId) throw new Error('Set TMDB_SESSION_ID first');
const created = await tmdb.lists.create({
  name: 'Movies to watch', description: 'My picks', language: 'en', sessionId,
});
await tmdb.lists.addMovie(created.list_id, 550, { sessionId });
await tmdb.lists.removeMovie(created.list_id, 550, { sessionId });
await tmdb.lists.clear(created.list_id, { sessionId, confirm: true });
await tmdb.lists.delete(created.list_id, { sessionId });
```

`clear()` requires an explicit boolean `confirm`; deleting a list and removing an item are separate operations. TMDB can return list IDs as strings in read responses, so inspect the returned `id` rather than assuming its runtime type. List writes are contract-tested offline; the live smoke test does not alter an account.

```js
const guestId = process.env.TMDB_GUEST_SESSION_ID;
if (guestId) {
  const ratedMovies = await tmdb.guestSessions.ratedMovies(guestId);
  const ratedShows = await tmdb.guestSessions.ratedTv(guestId);
  const ratedEpisodes = await tmdb.guestSessions.ratedTvEpisodes(guestId);
}

const regions = await tmdb.watchProviders.regions();
const movieProviders = await tmdb.watchProviders.movies({ watchRegion: 'US' });
const tvProviders = await tmdb.watchProviders.tv({ watchRegion: 'US' });
```

Guest rating lists accept `language`, positive `page`, and `sortBy: 'created_at.asc' | 'created_at.desc'`. A new unrated guest session may receive HTTP 404. Provider catalogs return a `results` array; movie and TV catalogs accept `watchRegion`, while the regions catalog accepts only `language`. Create a guest session with `tmdb.authentication.createGuestSession()`.

## Authentication and sessions

Use the same API key or Read Access Token supplied to the client to validate access and create temporary tokens. TMDB currently returns only `success` for key validation; `status_code` and `status_message` are optional:

```js
const keyStatus = await tmdb.authentication.validateKey();
const guest = await tmdb.authentication.createGuestSession();
const request = await tmdb.authentication.createRequestToken();
const approvalUrl = `https://www.themoviedb.org/authenticate/${encodeURIComponent(request.request_token)}`;
console.log(approvalUrl); // Open this URL and approve access in your browser.

// After the user approves the request token:
const userSession = await tmdb.authentication.createSession(request.request_token);
```

The guest session ID works with guest ratings; a user `session_id` is required for account and list operations. Request tokens expire, and user approval is required before `createSession()` succeeds. Keep both kinds of session ID private. To end a user session, call `tmdb.authentication.deleteSession(userSession.session_id)`. See [TMDB's v3 session guide](https://developer.themoviedb.org/reference/authentication-how-do-i-generate-a-session-id) for the approval flow.

For an existing TMDB v4 access token, `createSessionFromV4Token(accessToken)` converts it to a v3 user session. `validateRequestTokenWithLogin({ username, password, requestToken })` is also available for the v3 username/password flow; supply credentials from private runtime settings and never log them. These user-session writes have offline request and response tests. The live smoke test only validates the key and creates temporary guest/request tokens.

## Account

Account methods require a TMDB **user** session. Pass your account ID and `sessionId` explicitly; a guest session cannot read or change a user's account.

```js
const accountId = Number(process.env.TMDB_ACCOUNT_ID);
const sessionId = process.env.TMDB_SESSION_ID;
if (!Number.isSafeInteger(accountId) || accountId < 1 || !sessionId) {
  throw new Error('Set TMDB_ACCOUNT_ID and TMDB_SESSION_ID first');
}

const session = { sessionId };
const account = await tmdb.accounts.get(accountId, session);
const favorites = await tmdb.accounts.favoriteMovies(accountId, { ...session, page: 1 });
const favoriteShows = await tmdb.accounts.favoriteTv(accountId, session);
const lists = await tmdb.accounts.lists(accountId, session);
const ratedMovies = await tmdb.accounts.ratedMovies(accountId, session);
const ratedShows = await tmdb.accounts.ratedTv(accountId, session);
const ratedEpisodes = await tmdb.accounts.ratedTvEpisodes(accountId, session);
const movieWatchlist = await tmdb.accounts.watchlistMovies(accountId, session);
const tvWatchlist = await tmdb.accounts.watchlistTv(accountId, session);

await tmdb.accounts.setFavorite(accountId, 'movie', 550, true, session);
await tmdb.accounts.setWatchlist(accountId, 'tv', 1399, true, session);
```

`setFavorite()` and `setWatchlist()` accept `movie` or `tv`, a positive media ID, and a boolean. Pass `false` to remove an item. Media pages accept `language`, a positive `page`, and `sortBy: 'created_at.asc' | 'created_at.desc'`; account lists accept only `page`. These account routes are contract-tested offline because no disposable user session is available for live reads or writes. The opt-in live test does not change account data.

## Image URLs

TMDB detail responses contain image paths. Build a safe public image URL with:

```js
const posterUrl = tmdb.images.url('/poster.jpg', 'w500');
```

The size defaults to `original`. Missing paths return `undefined`; invalid paths or unsupported sizes throw a `TypeError`.

## TypeScript

The package ships ESM and CommonJS entry points plus TypeScript declarations. Responses retain upstream `snake_case` fields.

```ts
import { Lumosovich, type FindResponse } from 'tmdb-lumosovich';

const tmdb = new Lumosovich({
  apiKey: process.env.TMDB_API_KEY!,
});

const matches: FindResponse = await tmdb.find.byExternalId(
  'tt1375666',
  'imdb_id',
);
```

## Client options

```js
const tmdb = new Lumosovich({
  apiKey: process.env.TMDB_API_KEY,
  language: 'en-US',
  timeoutMs: 10_000,
});
```

Supply exactly one credential: a v3 `apiKey` or an API Read Access `accessToken`. `language` defaults to `en-US` on localized endpoints and can be overridden per call. Requests time out after 10 seconds by default; set `timeoutMs` to change this. An injectable `fetch` is available for testing.

## Error Handling

```js
try {
  const matches = await tmdb.find.byExternalId('tt1375666', 'imdb_id');
} catch (error) {
  console.error(error);
}
```

Failures throw `TmdbError` with `code` and, for HTTP failures, `status`. Codes are `HTTP_ERROR`, `RATE_LIMITED`, `TIMEOUT`, `NETWORK_ERROR`, and `INVALID_RESPONSE`. Errors do not echo request URLs, credentials, or upstream response bodies. A `429` is surfaced without automatic retry so callers can decide when to try again.

## Requirements

* Node.js 22+
* A TMDB API key or API Read Access Token

## Development

Clone the [GitHub repository](https://github.com/namipsg/lumosovich), install dependencies, and run the offline test suite:

```bash
git clone https://github.com/namipsg/lumosovich.git
cd lumosovich
npm ci
npm test
```

The suite checks the pinned OpenAPI coverage ledger, generated response fixtures,
request contracts, ESM/CommonJS entry points, and exported TypeScript declarations.
Print the operation coverage count with `npm run check:coverage`; regenerate
response fixtures after a reviewed baseline change with `npm run fixtures:generate`.
See [CONTRIBUTING.md](https://github.com/namipsg/lumosovich/blob/main/CONTRIBUTING.md) for the endpoint implementation and pull request workflow.

Build the package:

```bash
npm run build
```

With a local TMDB v3 key or Read Access Token, run the opt-in live smoke test:

```bash
TMDB_API_KEY=... npm run test:live
# Or: TMDB_ACCESS_TOKEN=... npm run test:live
```

The credential is read from the environment, never from a tracked file. This checks
all 122 public and temporary-session GET routes. The test creates a temporary guest session for the
three rated-content routes and accepts TMDB's HTTP 404 for an unrated session.
List and account mutations and user-session lifecycle writes are covered by offline
contracts; the live test does not change account data.

## Roadmap

All operations in the pinned TMDB v3 specification now have public typed methods. The final parity audit and stable `1.0.0` release remain. The [coverage ledger](https://github.com/namipsg/lumosovich/blob/main/spec/coverage.json) tracks every operation.

The goal is to cover the TMDB API while keeping the library:

* simple
* strongly typed
* predictable
* well documented
* pleasant to use

## Contributing

Issues, bug reports, feature requests, and pull requests are welcome on
[GitHub](https://github.com/namipsg/lumosovich/issues).

If you're proposing a new API, try to keep it consistent with the rest of Lumosovich and reasonably close to the concepts used by TMDB itself.

## Disclaimer

Lumosovich is an independent project and is not affiliated with or endorsed by TMDB.

This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

MIT; see [LICENSE](https://github.com/namipsg/lumosovich/blob/main/LICENSE).

Starting with `0.2.0`, Lumosovich is distributed under the MIT license. Previously
published `0.1.x` packages retain their original GPL-3.0-only license.

---

**Lumosovich** — shed some light on TMDB. ✨
