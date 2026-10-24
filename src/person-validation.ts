import { invalidResponse, isRecord, validateSearchPage } from './validation.js';
import { metadataChecks, validateIdShape } from './metadata-validation.js';
import type { CreditDetails, PersonTaggedImagesPage } from './person-types.js';

const positiveId = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0;
const count = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) >= 0;

export function validatePersonCredits<T>(value: unknown, id: number): T {
  return validateIdShape<T>(value, id, {
    cast: metadataChecks.identities,
    crew: metadataChecks.identities,
  });
}

export function validatePopularPeople<T>(value: unknown): T {
  const page = validateSearchPage(value);
  if (!page.results.every((person) => isRecord(person) && typeof person.name === 'string')) {
    invalidResponse();
  }
  return page as T;
}

export function validateTaggedImages(value: unknown, id: number): PersonTaggedImagesPage {
  if (!isRecord(value) || value.id !== id || !count(value.page) ||
    !count(value.total_pages) || !count(value.total_results) ||
    !Array.isArray(value.results) || !value.results.every((image: unknown) =>
      isRecord(image) && typeof image.id === 'string' && !!image.id &&
      typeof image.file_path === 'string' &&
      typeof image.media_type === 'string' && !!image.media_type &&
      typeof image.image_type === 'string' && isRecord(image.media) &&
      positiveId(image.media.id))) {
    invalidResponse();
  }
  return value as unknown as PersonTaggedImagesPage;
}

export function validateCreditDetails(value: unknown, id: string): CreditDetails {
  if (!isRecord(value) || value.id !== id ||
    typeof value.credit_type !== 'string' ||
    !['movie', 'tv'].includes(String(value.media_type)) ||
    !isRecord(value.person) || !positiveId(value.person.id) ||
    typeof value.person.name !== 'string' ||
    !isRecord(value.media) || !positiveId(value.media.id)) {
    invalidResponse();
  }
  return value as unknown as CreditDetails;
}
