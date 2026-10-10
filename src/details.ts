import { TmdbHttpClient } from './http.js';
import type { QueryParameters } from './http.js';
import { createMovieMetadataMethods } from './metadata.js';
import { createMovieCatalogMethods } from './movie-catalog.js';
import { createTvCatalogMethods } from './tv-catalog.js';
import { createTvMetadataMethods } from './tv-metadata.js';
import { positiveId } from './ids.js';
import type {
  DetailOptions,
  EpisodeAppend,
  EpisodeDetailOptions,
  MovieAppend,
  MovieDetails,
  MovieMethods,
  PersonAppend,
  PersonDetails,
  PersonMethods,
  SeasonAppend,
  SeasonDetailOptions,
  TvAppend,
  TvDetails,
  TvEpisodeDetails,
  TvMethods,
  TvSeasonDetails,
} from './detail-types.js';
import type { TmdbId } from './types.js';
import {
  validateDetailResponse,
  validateEpisodeResponse,
  validateSeasonResponse,
} from './validation.js';

const MOVIE_APPEND: readonly MovieAppend[] = [
  'credits',
  'images',
  'videos',
  'external_ids',
  'release_dates',
];
const TV_APPEND: readonly TvAppend[] = [
  'aggregate_credits',
  'credits',
  'images',
  'videos',
  'external_ids',
  'content_ratings',
];
const PERSON_APPEND: readonly PersonAppend[] = [
  'combined_credits',
  'external_ids',
  'images',
];
const SEASON_APPEND: readonly SeasonAppend[] = ['credits', 'images', 'videos'];
const EPISODE_APPEND: readonly EpisodeAppend[] = [
  'credits',
  'external_ids',
  'images',
  'videos',
];

function slotNumber(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a nonnegative integer`);
  }
  return value;
}

function detailParameters<TAppend extends string>(
  options: DetailOptions<TAppend>,
  allowed: readonly TAppend[],
): QueryParameters {
  if (options.append !== undefined && !Array.isArray(options.append)) {
    throw new TypeError('append must be an array');
  }
  const append = [...new Set(options.append ?? [])];
  if (append.some((name) => !allowed.includes(name))) {
    throw new TypeError('Unsupported append target');
  }

  if (
    options.imageLanguages !== undefined &&
    (!Array.isArray(options.imageLanguages) ||
      !append.includes('images' as TAppend) ||
      options.imageLanguages.length === 0 ||
      options.imageLanguages.some(
        (language) =>
          typeof language !== 'string' ||
          !language.trim() ||
          language.includes(','),
      ))
  ) {
    throw new TypeError('imageLanguages requires images and nonempty language values');
  }

  return {
    language: options.language,
    append_to_response: append.length ? append.join(',') : undefined,
    include_image_language: options.imageLanguages
      ? [...new Set(options.imageLanguages)].join(',')
      : undefined,
  };
}

export function createMovieMethods(http: TmdbHttpClient): MovieMethods {
  return {
    ...createMovieMetadataMethods(http),
    ...createMovieCatalogMethods(http),
    async get(id: TmdbId, options = {}): Promise<MovieDetails> {
      const validId = positiveId(id);
      const payload = await http.get(
        `movie/${validId}`,
        detailParameters(options, MOVIE_APPEND),
      );
      return validateDetailResponse<MovieDetails>(payload, validId, 'title');
    },
  };
}

export function createTvMethods(http: TmdbHttpClient): TvMethods {
  return {
    ...createTvMetadataMethods(http),
    ...createTvCatalogMethods(http),
    async get(id: TmdbId, options = {}): Promise<TvDetails> {
      const validId = positiveId(id);
      const payload = await http.get(
        `tv/${validId}`,
        detailParameters(options, TV_APPEND),
      );
      return validateDetailResponse<TvDetails>(payload, validId, 'name');
    },
    seasons: {
      async get(
        seriesId: TmdbId,
        seasonNumber: number,
        options: SeasonDetailOptions = {},
      ): Promise<TvSeasonDetails> {
        const validSeriesId = positiveId(seriesId);
        const validSeason = slotNumber(seasonNumber, 'seasonNumber');
        const payload = await http.get(
          `tv/${validSeriesId}/season/${validSeason}`,
          detailParameters(options, SEASON_APPEND),
        );
        return validateSeasonResponse(payload, validSeriesId, validSeason);
      },
    },
    episodes: {
      async get(
        seriesId: TmdbId,
        seasonNumber: number,
        episodeNumber: number,
        options: EpisodeDetailOptions = {},
      ): Promise<TvEpisodeDetails> {
        const validSeriesId = positiveId(seriesId);
        const validSeason = slotNumber(seasonNumber, 'seasonNumber');
        const validEpisode = slotNumber(episodeNumber, 'episodeNumber');
        const payload = await http.get(
          `tv/${validSeriesId}/season/${validSeason}/episode/${validEpisode}`,
          detailParameters(options, EPISODE_APPEND),
        );
        return validateEpisodeResponse(
          payload,
          validSeriesId,
          validSeason,
          validEpisode,
        );
      },
    },
  };
}

export function createPersonMethods(http: TmdbHttpClient): PersonMethods {
  return {
    async get(id: TmdbId, options = {}): Promise<PersonDetails> {
      const validId = positiveId(id);
      const payload = await http.get(
        `person/${validId}`,
        detailParameters(options, PERSON_APPEND),
      );
      return validateDetailResponse<PersonDetails>(payload, validId, 'name');
    },
  };
}
