import { invalidResponse, isRecord, validateSearchPage } from './validation.js';
import type { FindHit, SearchPage } from './types.js';
import type {
  MovieAccountStates, MovieCatalogPage, RatingResponse, ReviewDetails, ReviewPage,
} from './catalog-types.js';

function count(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

export function validateCatalogPage(value: unknown, withDates = false): MovieCatalogPage {
  const page = validateSearchPage(value) as MovieCatalogPage;
  if (withDates && (!isRecord(page.dates) ||
    typeof page.dates.minimum !== 'string' || typeof page.dates.maximum !== 'string')) {
    invalidResponse();
  }
  return page;
}

export function validateIdPage<T extends FindHit>(
  value: unknown, expectedId: number, requireName = false,
): SearchPage<T> & { id: number } {
  const page = validateSearchPage<T>(value);
  if (!isRecord(page) || page.id !== expectedId ||
    (requireName && !page.results.every((result) =>
      isRecord(result) && typeof result.name === 'string'))) invalidResponse();
  return page as unknown as SearchPage<T> & { id: number };
}

export function validateReviewPage(value: unknown, expectedId: number): ReviewPage {
  if (!isRecord(value) || value.id !== expectedId || !count(value.page) || value.page < 1 ||
    !count(value.total_pages) || !count(value.total_results) ||
    !Array.isArray(value.results) || !value.results.every((review: unknown) =>
      isRecord(review) && typeof review.id === 'string' && !!review.id &&
      typeof review.author === 'string' && typeof review.content === 'string')) {
    invalidResponse();
  }
  return value as unknown as ReviewPage;
}

export function validateReviewDetails(value: unknown, expectedId: string): ReviewDetails {
  if (!isRecord(value) || value.id !== expectedId ||
    typeof value.author !== 'string' || typeof value.content !== 'string') {
    invalidResponse();
  }
  return value as unknown as ReviewDetails;
}

export function validateAccountStates(value: unknown, expectedId: number): MovieAccountStates {
  if (!isRecord(value) || value.id !== expectedId ||
    typeof value.favorite !== 'boolean' || typeof value.watchlist !== 'boolean' ||
    !(value.rated === false || (isRecord(value.rated) &&
      typeof value.rated.value === 'number' && Number.isFinite(value.rated.value) &&
      value.rated.value >= 0.5 && value.rated.value <= 10 &&
      Number.isInteger(value.rated.value * 2)))) {
    invalidResponse();
  }
  return value as unknown as MovieAccountStates;
}

export function validateRatingResponse(value: unknown): RatingResponse {
  if (!isRecord(value) || !Number.isSafeInteger(value.status_code) ||
    Number(value.status_code) < 1 || typeof value.status_message !== 'string') {
    invalidResponse();
  }
  return value as unknown as RatingResponse;
}
