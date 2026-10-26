import assert from 'node:assert/strict';
import { Lumosovich, TmdbError } from '../dist/index.js';

const apiKey = process.env.TMDB_API_KEY?.trim();
const accessToken = process.env.TMDB_ACCESS_TOKEN?.trim();
if (!apiKey && !accessToken) {
  console.error('Set TMDB_API_KEY or TMDB_ACCESS_TOKEN for the opt-in live smoke test.');
  process.exitCode = 2;
} else {
  let step = 'find movie';
  try {
    const tmdb = new Lumosovich({ apiKey, accessToken });
    const movieMatches = await tmdb.find.byExternalId('tt1375666', 'imdb_id');
    assert.equal(movieMatches.movie_results.length, 1);
    const movieId = movieMatches.movie_results[0].id;
    step = 'search movie';
    const search = await tmdb.search.movies('Inception', { year: 2010 });
    assert.ok(search.results.some((result) => result.id === movieId));
    step = 'movie details';
    const movie = await tmdb.movies.get(movieId, { append: ['external_ids'] });
    assert.equal(movie.external_ids?.imdb_id, 'tt1375666');

    const metadataMovieId = 550;
    for (const [method, options] of [
      ['alternativeTitles', { country: 'US' }],
      ['credits', { language: 'en-US' }],
      ['externalIds'],
      ['images', { imageLanguages: ['en', 'null'] }],
      ['keywords'],
      ['releaseDates'],
      ['translations'],
      ['videos'],
      ['watchProviders'],
    ]) {
      step = `movie ${method}`;
      assert.equal((await tmdb.movies[method](metadataMovieId, options)).id, metadataMovieId);
    }
    step = 'movie changes';
    assert.ok(Array.isArray((await tmdb.movies.changes(metadataMovieId)).changes));
    step = 'latest movie';
    assert.ok((await tmdb.movies.latest()).id > 0);

    step = 'movie change list';
    assert.ok(Array.isArray((await tmdb.movies.changeList({ page: 1 })).results));
    for (const method of ['nowPlaying', 'popular', 'topRated', 'upcoming']) {
      step = `movie catalog ${method}`;
      assert.ok(Array.isArray((await tmdb.movies[method]({ page: 1 })).results));
    }
    for (const method of ['lists', 'recommendations', 'similar']) {
      step = `movie ${method}`;
      assert.ok(Array.isArray((await tmdb.movies[method](metadataMovieId)).results));
    }
    step = 'movie reviews';
    const movieReviews = await tmdb.movies.reviews(metadataMovieId);
    assert.ok(Array.isArray(movieReviews.results));
    if (movieReviews.results.length > 0) {
      step = 'review details';
      assert.equal((await tmdb.reviews.get(movieReviews.results[0].id)).id, movieReviews.results[0].id);
    } else {
      throw new Error('Expected a public review for the G3 smoke test');
    }
    for (const method of ['movies', 'tv']) {
      step = `discover ${method}`;
      assert.ok(Array.isArray((await tmdb.discover[method]({ page: 1 })).results));
    }
    for (const method of ['all', 'movies', 'people', 'tv']) {
      step = `trending ${method}`;
      assert.ok(Array.isArray((await tmdb.trending[method]('week')).results));
    }
    step = 'keyword details';
    assert.equal((await tmdb.keywords.get(1701)).id, 1701);
    step = 'keyword movies';
    assert.equal((await tmdb.keywords.movies(1701)).id, 1701);
    for (const method of ['get', 'alternativeNames', 'images']) {
      step = `network ${method}`;
      assert.equal((await tmdb.networks[method](49)).id, 49);
    }

    const collectionId = 10;
    for (const method of ['get', 'images', 'translations']) {
      step = `collection ${method}`;
      assert.equal((await tmdb.collections[method](collectionId)).id, collectionId);
    }
    const companyId = 1;
    for (const method of ['get', 'alternativeNames', 'images']) {
      step = `company ${method}`;
      assert.equal((await tmdb.companies[method](companyId)).id, companyId);
    }

    step = 'find TV';
    const tvMatches = await tmdb.find.byExternalId('tt0944947', 'imdb_id');
    assert.equal(tvMatches.tv_results.length, 1);
    const seriesId = tvMatches.tv_results[0].id;
    step = 'TV details';
    const series = await tmdb.tv.get(seriesId, { append: ['external_ids'] });
    assert.equal(series.external_ids?.imdb_id, 'tt0944947');
    for (const method of ['airingToday', 'onTheAir', 'popular', 'topRated']) {
      step = `TV catalog ${method}`;
      assert.ok(Array.isArray((await tmdb.tv[method]({ page: 1 })).results));
    }
    for (const [method, options] of [
      ['aggregateCredits', { language: 'en-US' }],
      ['alternativeTitles'],
      ['contentRatings'],
      ['credits', { language: 'en-US' }],
      ['externalIds'],
      ['images', { imageLanguages: ['en', 'null'] }],
      ['keywords'],
      ['screenedTheatrically'],
      ['translations'],
      ['videos', { videoLanguages: ['en', 'null'] }],
      ['watchProviders'],
    ]) {
      step = `TV ${method}`;
      assert.equal((await tmdb.tv[method](seriesId, options)).id, seriesId);
    }
    step = 'latest TV series';
    assert.ok((await tmdb.tv.latest()).id > 0);
    for (const method of ['lists', 'recommendations', 'reviews', 'similar']) {
      step = `TV ${method}`;
      assert.ok(Array.isArray((await tmdb.tv[method](seriesId)).results));
    }
    step = 'TV change list';
    assert.ok(Array.isArray((await tmdb.tv.changeList({ page: 1 })).results));
    step = 'TV series changes';
    assert.ok(Array.isArray((await tmdb.tv.changes(seriesId)).changes));
    step = 'TV episode groups';
    const episodeGroups = await tmdb.tv.episodeGroups.list(seriesId);
    assert.ok(episodeGroups.results.length > 0);
    step = 'TV episode group details';
    assert.equal((await tmdb.tv.episodeGroups.get(episodeGroups.results[0].id)).id,
      episodeGroups.results[0].id);
    step = 'season details';
    const season = await tmdb.tv.seasons.get(seriesId, 1);
    assert.ok(season.episodes.some((episode) => episode.episode_number === 1));
    for (const [method, options] of [
      ['aggregateCredits', { language: 'en-US' }],
      ['credits', { language: 'en-US' }],
      ['externalIds'],
      ['images', { imageLanguages: ['en', 'null'] }],
      ['translations'],
      ['videos', { videoLanguages: ['en', 'null'] }],
      ['watchProviders'],
    ]) {
      step = `TV season ${method}`;
      assert.equal((await tmdb.tv.seasons[method](seriesId, 1, options)).id, season.id);
    }
    step = 'TV season changes';
    assert.ok(Array.isArray((await tmdb.tv.seasons.changes(season.id)).changes));
    step = 'episode details';
    const episode = await tmdb.tv.episodes.get(seriesId, 1, 1, {
      append: ['external_ids'],
    });
    assert.equal(episode.external_ids?.imdb_id, 'tt1480055');
    for (const [method, options] of [
      ['credits', { language: 'en-US' }],
      ['externalIds'],
      ['images', { imageLanguages: ['en', 'null'] }],
      ['translations'],
      ['videos', { videoLanguages: ['en', 'null'] }],
    ]) {
      step = `TV episode ${method}`;
      assert.equal((await tmdb.tv.episodes[method](seriesId, 1, 1, options)).id, episode.id);
    }
    step = 'TV episode changes';
    assert.ok(Array.isArray((await tmdb.tv.episodes.changes(episode.id)).changes));

    step = 'find person';
    const personMatches = await tmdb.find.byExternalId('nm0000138', 'imdb_id');
    assert.equal(personMatches.person_results.length, 1);
    step = 'person details';
    const person = await tmdb.people.get(personMatches.person_results[0].id, {
      append: ['external_ids'],
    });
    assert.equal(person.external_ids?.imdb_id, 'nm0000138');

    const personId = 31;
    step = 'person change list';
    assert.ok(Array.isArray((await tmdb.people.changeList({ page: 1 })).results));
    step = 'person changes';
    assert.ok(Array.isArray((await tmdb.people.changes(personId)).changes));
    step = 'popular people';
    assert.ok(Array.isArray((await tmdb.people.popular({ page: 1 })).results));
    for (const method of ['combinedCredits', 'movieCredits', 'tvCredits']) {
      step = `person ${method}`;
      const credits = await tmdb.people[method](personId);
      assert.equal(credits.id, personId);
      assert.ok(Array.isArray(credits.cast));
      assert.ok(Array.isArray(credits.crew));
    }
    for (const method of ['externalIds', 'images', 'translations']) {
      step = `person ${method}`;
      assert.equal((await tmdb.people[method](personId)).id, personId);
    }
    step = 'latest person';
    assert.ok((await tmdb.people.latest()).id > 0);
    step = 'person tagged images';
    assert.equal((await tmdb.people.taggedImages(personId)).id, personId);
    step = 'credit details';
    const movieCredits = await tmdb.people.movieCredits(personId);
    const creditId = movieCredits.cast.find((item) => typeof item.credit_id === 'string')?.credit_id;
    assert.ok(creditId);
    assert.equal((await tmdb.credits.get(creditId)).id, creditId);

    step = 'public list details';
    assert.equal(Number((await tmdb.lists.get(1)).id), 1);
    step = 'public list item status';
    assert.equal(Number((await tmdb.lists.itemStatus(1, 550)).id), 1);
    for (const method of ['regions', 'movies', 'tv']) {
      step = `watch provider ${method}`;
      assert.ok(Array.isArray((await tmdb.watchProviders[method]()).results));
    }
    step = 'temporary guest session';
    const guestUrl = new URL('https://api.themoviedb.org/3/authentication/guest_session/new');
    if (apiKey) guestUrl.searchParams.set('api_key', apiKey);
    const guestResponse = await fetch(guestUrl, {
      headers: accessToken ? { authorization: `Bearer ${accessToken}` } : {},
    });
    assert.equal(guestResponse.ok, true);
    const guestSession = await guestResponse.json();
    assert.equal(guestSession.success, true);
    assert.ok(guestSession.guest_session_id);
    for (const method of ['ratedMovies', 'ratedTv', 'ratedTvEpisodes']) {
      step = `guest session ${method}`;
      try {
        assert.ok(Array.isArray((await tmdb.guestSessions[method](guestSession.guest_session_id)).results));
      } catch (error) {
        // An unrated guest session currently receives HTTP 404 from TMDB.
        assert.ok(error instanceof TmdbError && error.code === 'HTTP_ERROR' && error.status === 404);
      }
    }

    for (const [method, query] of [
      ['tv', 'Game of Thrones'], ['multi', 'Inception'],
      ['people', 'Leonardo DiCaprio'], ['collections', 'Star Wars'],
      ['companies', 'Lucasfilm'], ['keywords', 'space'],
    ]) {
      step = `search ${method}`;
      const page = await tmdb.search[method](query);
      assert.ok(page.results.length > 0);
    }

    step = 'configuration details';
    const configuration = await tmdb.configuration.get();
    assert.ok(configuration.images.poster_sizes.includes('original'));
    for (const method of ['countries', 'jobs', 'languages', 'primaryTranslations', 'timezones']) {
      step = `configuration ${method}`;
      assert.ok((await tmdb.configuration[method]()).length > 0);
    }
    for (const method of ['movies', 'tv']) {
      step = `${method} certifications`;
      assert.ok((await tmdb.certifications[method]()).certifications.US.length > 0);
      step = `${method} genres`;
      assert.ok((await tmdb.genres[method]()).genres.length > 0);
    }
    console.log('TMDB live smoke passed: all 119 public read routes exercised.');
  } catch (error) {
    if (error instanceof TmdbError) {
      console.error(`TMDB live smoke failed at ${step}: ${error.code} (${error.status ?? 'no status'}).`);
    } else {
      console.error(`TMDB live smoke failed at ${step}: ${error.name || 'Error'}.`);
    }
    process.exitCode = 1;
  }
}
