import assert from 'node:assert/strict';
import { Lumosovich, TmdbError } from '../dist/index.js';

const apiKey = process.env.TMDB_API_KEY?.trim();
if (!apiKey) {
  console.error('Set TMDB_API_KEY for the opt-in live smoke test.');
  process.exitCode = 2;
} else {
  let step = 'find movie';
  try {
    const tmdb = new Lumosovich({ apiKey });
    const movieMatches = await tmdb.find.byExternalId('tt1375666', 'imdb_id');
    assert.equal(movieMatches.movie_results.length, 1);
    const movieId = movieMatches.movie_results[0].id;
    step = 'search movie';
    const search = await tmdb.search.movies('Inception', { year: 2010 });
    assert.ok(search.results.some((result) => result.id === movieId));
    step = 'movie details';
    const movie = await tmdb.movies.get(movieId, { append: ['external_ids'] });
    assert.equal(movie.external_ids?.imdb_id, 'tt1375666');

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
    console.log('TMDB live smoke passed: find, search, movie, TV, person, season, episode.');
  } catch (error) {
    if (error instanceof TmdbError) {
      console.error(`TMDB live smoke failed at ${step}: ${error.code} (${error.status ?? 'no status'}).`);
    } else {
      console.error(`TMDB live smoke failed at ${step}: ${error.name || 'Error'}.`);
    }
    process.exitCode = 1;
  }
}
