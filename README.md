# Lumosovich ✨

[![npm version](https://img.shields.io/npm/v/lumosovich.svg)](https://www.npmjs.com/package/lumosovich)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/namipsg/lumosovich/blob/main/LICENSE)
[![CI](https://github.com/namipsg/lumosovich/actions/workflows/ci.yml/badge.svg)](https://github.com/namipsg/lumosovich/actions/workflows/ci.yml)

A small, typed Node.js wrapper for the TMDB API.

**Lumosovich** is being built incrementally toward full TMDB v3 API coverage. It currently supports external-ID lookup, search, discovery, trending, movie catalogs and metadata, reviews, keywords, networks, collections, companies, configuration, and movie, TV, and person details.

The name comes from **Lumos** — a spell for bringing light — with a little Russian-style `-ovich` treatment.

Light up the movie database.

## Current status

Lumosovich is available on [npm](https://www.npmjs.com/package/lumosovich), with source and issues on [GitHub](https://github.com/namipsg/lumosovich). Version `0.5.1` covers **64 of 152 TMDB v3 operations**, measured against the official specification pinned on September 27, 2026. This is an early `0.x` library; full API coverage is still in progress. See the [coverage baseline](https://github.com/namipsg/lumosovich/blob/main/spec/README.md) for how coverage is checked.

Version `0.5.1` updates development and GitHub Actions dependencies without changing the public API. Version `0.5.0` added 24 TMDB operations for movie catalogs and changes, Discover, Trending, reviews, keywords, networks, and movie ratings. The read-only live smoke test exercises 61 operations. Account-state and rating methods require a TMDB session and are verified by offline request contracts.

The release passes 125 offline tests and TypeScript declaration checks. See the [changelog](https://github.com/namipsg/lumosovich/blob/main/CHANGELOG.md) for earlier releases.

## Installation

```bash
npm install lumosovich
```

Requires Node.js 22+ and a TMDB v3 API key or API Read Access Token. Keep your credential in an environment variable; do not commit it to your project.

## Quick Start

Set `TMDB_API_KEY` in your environment before running this example:

```js
import { Lumosovich } from 'lumosovich';

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

CommonJS projects can use `const { Lumosovich } = require('lumosovich');` instead.

For an API Read Access Token, initialize the client with
`accessToken: process.env.TMDB_ACCESS_TOKEN` in place of `apiKey`. Supply exactly
one credential.

## Why Lumosovich?

Working directly with an HTTP API shouldn't mean repeating URLs, query parameters, authentication, and TypeScript definitions throughout your application.

Lumosovich puts a small, predictable API between your application and TMDB. It keeps TMDB's numeric IDs and `snake_case` response fields intact. IMDb IDs such as `tt1375666` and `nm0000138` are external IDs, not interchangeable with TMDB IDs.

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
```

Use `guestSessionId` instead of `sessionId` for a guest session; supply exactly one. Ratings range from 0.5 to 10 in half-point steps. `deleteRating()` removes the rating associated with that session. Session creation is planned for a later group, so obtain a session through TMDB's authentication flow before using these methods. The live smoke test does not mutate an account.
TMDB may remove a newly rated movie from the account's watchlist by default; see [TMDB's rating behavior](https://developer.themoviedb.org/reference/movie-add-rating).

## Seasons and episodes

```js
const season = await tmdb.tv.seasons.get(1399, 1);
const firstEpisode = season.episodes.find((episode) => episode.episode_number === 1);

if (firstEpisode) {
  const detail = await tmdb.tv.episodes.get(1399, 1, 1, {
    append: ['external_ids', 'images'],
    imageLanguages: ['en', 'null'],
  });
  console.log(detail.id, detail.external_ids?.imdb_id);
}
```

Season and episode coordinates are numeric TMDB identifiers and slots. Season `0` is supported for specials. The wrapper checks returned series and episode identity before passing details to callers; missing IMDb IDs remain missing rather than being fabricated.

## Image URLs

TMDB detail responses contain image paths. Build a safe public image URL with:

```js
const posterUrl = tmdb.images.url('/poster.jpg', 'w500');
```

The size defaults to `original`. Missing paths return `undefined`; invalid paths or unsupported sizes throw a `TypeError`.

## TypeScript

The package ships ESM and CommonJS entry points plus TypeScript declarations. Responses retain upstream `snake_case` fields.

```ts
import { Lumosovich, type FindResponse } from 'lumosovich';

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
all 61 public read operations. Account-state and rating methods require a TMDB
session and are covered by offline contracts; the live test makes read-only requests.

## Roadmap

Broader TV resources, people, lists, watch providers, and authentication will
expand coverage in future releases. The [coverage ledger](https://github.com/namipsg/lumosovich/blob/main/spec/coverage.json) tracks implemented and remaining operations.

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
