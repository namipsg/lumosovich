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
    step = 'season details';
    const season = await tmdb.tv.seasons.get(seriesId, 1);
    assert.ok(season.episodes.some((episode) => episode.episode_number === 1));
    step = 'episode details';
    const episode = await tmdb.tv.episodes.get(seriesId, 1, 1, {
      append: ['external_ids'],
    });
    assert.equal(episode.external_ids?.imdb_id, 'tt1480055');

    step = 'find person';
    const personMatches = await tmdb.find.byExternalId('nm0000138', 'imdb_id');
    assert.equal(personMatches.person_results.length, 1);
    step = 'person details';
    const person = await tmdb.people.get(personMatches.person_results[0].id, {
      append: ['external_ids'],
    });
    assert.equal(person.external_ids?.imdb_id, 'nm0000138');

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
    console.log('TMDB live smoke passed: all 40 implemented operations.');
  } catch (error) {
    if (error instanceof TmdbError) {
      console.error(`TMDB live smoke failed at ${step}: ${error.code} (${error.status ?? 'no status'}).`);
    } else {
      console.error(`TMDB live smoke failed at ${step}: ${error.name || 'Error'}.`);
    }
    process.exitCode = 1;
  }
}
