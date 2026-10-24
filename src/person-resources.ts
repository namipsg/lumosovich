import { TmdbHttpClient } from './http.js';
import { pathId, positiveId } from './ids.js';
import { changeParameters } from './metadata.js';
import { metadataChecks, validateIdShape, validateLatestDetail, validateMovieChanges } from './metadata-validation.js';
import { validateSearchPage } from './validation.js';
import { validateCreditDetails, validatePersonCredits, validatePopularPeople, validateTaggedImages } from './person-validation.js';
import type { PersonDetails } from './detail-types.js';
import type { PersonResourceMethods, CreditMethods } from './person-types.js';

export function createPersonResourceMethods(http: TmdbHttpClient): PersonResourceMethods {
  return {
    async changeList(options = {}) {
      return validateSearchPage(await http.get(
        'person/changes', changeParameters(options), { includeLanguage: false },
      ));
    },
    async changes(id, options = {}) {
      const validId = positiveId(id);
      return validateMovieChanges(await http.get(
        `person/${validId}/changes`, changeParameters(options), { includeLanguage: false },
      ));
    },
    async combinedCredits(id, options = {}) {
      const validId = positiveId(id);
      return validatePersonCredits(await http.get(`person/${validId}/combined_credits`, {
        language: options.language,
      }), validId);
    },
    async externalIds(id) {
      const validId = positiveId(id);
      return validateIdShape(await http.get(
        `person/${validId}/external_ids`, {}, { includeLanguage: false },
      ), validId, { imdb_id: metadataChecks.externalId, wikidata_id: metadataChecks.externalId });
    },
    async images(id) {
      const validId = positiveId(id);
      return validateIdShape(await http.get(
        `person/${validId}/images`, {}, { includeLanguage: false },
      ), validId, { profiles: metadataChecks.images });
    },
    async latest(): Promise<PersonDetails> {
      return validateLatestDetail(await http.get('person/latest', {}, { includeLanguage: false }), 'name');
    },
    async movieCredits(id, options = {}) {
      const validId = positiveId(id);
      return validatePersonCredits(await http.get(`person/${validId}/movie_credits`, {
        language: options.language,
      }), validId);
    },
    async popular(options = {}) {
      if (options.page !== undefined && (!Number.isSafeInteger(options.page) || options.page < 1)) {
        throw new TypeError('page must be a positive integer');
      }
      return validatePopularPeople(await http.get('person/popular', {
        language: options.language, page: options.page,
      }));
    },
    async taggedImages(id, options = {}) {
      const validId = positiveId(id);
      if (options.page !== undefined && (!Number.isSafeInteger(options.page) || options.page < 1)) {
        throw new TypeError('page must be a positive integer');
      }
      return validateTaggedImages(await http.get(
        `person/${validId}/tagged_images`, { page: options.page }, { includeLanguage: false },
      ), validId);
    },
    async translations(id) {
      const validId = positiveId(id);
      return validateIdShape(await http.get(
        `person/${validId}/translations`, {}, { includeLanguage: false },
      ), validId, { translations: metadataChecks.translations });
    },
    async tvCredits(id, options = {}) {
      const validId = positiveId(id);
      return validatePersonCredits(await http.get(`person/${validId}/tv_credits`, {
        language: options.language,
      }), validId);
    },
  };
}

export function createCreditMethods(http: TmdbHttpClient): CreditMethods {
  return {
    async get(creditId, options = {}) {
      const id = pathId(creditId, 'credit ID');
      return validateCreditDetails(await http.get(
        `credit/${encodeURIComponent(id)}`, { language: options.language },
      ), id);
    },
  };
}
