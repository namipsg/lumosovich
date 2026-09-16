# Lumosovich ✨

A modern Node.js wrapper for the TMDB API.

**Lumosovich** gives you a clean, developer-friendly interface for working with movies, TV shows, people, search, and other data available through The Movie Database API.

The name comes from **Lumos** — a spell for bringing light — with a little Russian-style `-ovich` treatment.

Light up the movie database.

## Installation

```bash
npm install lumosovich
```

## Quick Start

```js
import { Lumosovich } from 'lumosovich';

const tmdb = new Lumosovich({
  apiKey: process.env.TMDB_API_KEY,
});

const movie = await tmdb.movies.get(550);

console.log(movie.title);
// Fight Club
```

## Why Lumosovich?

Working directly with an HTTP API shouldn't mean repeating URLs, query parameters, authentication, response handling, and TypeScript definitions throughout your application.

Lumosovich puts a small, predictable API between your application and TMDB.

```js
const results = await tmdb.search.movies('Interstellar');
```

Instead of:

```js
const response = await fetch(
  `https://api.themoviedb.org/3/search/movie?query=Interstellar`,
  {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
  }
);

const results = await response.json();
```

## Features

* 🎬 Movies
* 📺 TV shows
* 👤 People
* 🔎 Search
* 🎭 Genres
* 📈 Trending content
* 🖼️ Images and metadata
* 📄 Pagination
* 🌍 Languages and regions
* 🔐 TMDB authentication
* 🟦 TypeScript support
* ⚡ Promise-based API
* 🪶 Lightweight Node.js interface

> The exact API surface is still being designed. Lumosovich aims to stay close to TMDB while making common operations pleasant to use.

## Usage

### Movies

```js
const movie = await tmdb.movies.get(550);

console.log(movie.title);
console.log(movie.releaseDate);
console.log(movie.overview);
```

### Search

```js
const movies = await tmdb.search.movies('Blade Runner');

for (const movie of movies.results) {
  console.log(movie.title);
}
```

### TV Shows

```js
const show = await tmdb.tv.get(1399);

console.log(show.name);
```

### People

```js
const person = await tmdb.people.get(287);

console.log(person.name);
```

### Trending

```js
const trending = await tmdb.trending.movies('week');

console.log(trending.results);
```

## TypeScript

Lumosovich is designed with TypeScript in mind.

```ts
import { Lumosovich, Movie } from 'lumosovich';

const tmdb = new Lumosovich({
  apiKey: process.env.TMDB_API_KEY!,
});

const movie: Movie = await tmdb.movies.get(550);
```

API responses and parameters can be fully typed, making TMDB easier to explore directly from your editor.

## Configuration

```js
const tmdb = new Lumosovich({
  apiKey: process.env.TMDB_API_KEY,
  language: 'en-US',
});
```

Additional configuration options will be documented as the library evolves.

## Error Handling

```js
try {
  const movie = await tmdb.movies.get(550);
} catch (error) {
  console.error(error);
}
```

Lumosovich will expose API and request errors in a consistent format so applications don't have to deal with transport-level details everywhere.

## Requirements

* Node.js 18+
* A TMDB API key or access token

## Development

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd lumosovich
npm install
```

Run the test suite:

```bash
npm test
```

Build the package:

```bash
npm run build
```

## Roadmap

Lumosovich is under active development.

The goal is to cover the TMDB API while keeping the library:

* simple
* strongly typed
* predictable
* well documented
* pleasant to use

## Contributing

Issues, bug reports, feature requests, and pull requests are welcome.

If you're proposing a new API, try to keep it consistent with the rest of Lumosovich and reasonably close to the concepts used by TMDB itself.

## Disclaimer

Lumosovich is an independent project and is not affiliated with or endorsed by TMDB.

This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

MIT

---

**Lumosovich** — shed some light on TMDB. ✨
