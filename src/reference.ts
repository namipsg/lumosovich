import { TmdbHttpClient } from './http.js';
import type {
  CertificationMethods,
  ConfigurationMethods,
  GenreMethods,
  LanguageOptions,
} from './reference-types.js';
import {
  validateCertifications,
  validateConfiguration,
  validateCountries,
  validateGenres,
  validateJobs,
  validateLanguages,
  validateTimezones,
  validateTranslations,
} from './reference-validation.js';

export function createConfigurationMethods(http: TmdbHttpClient): ConfigurationMethods {
  return {
    async get() {
      return validateConfiguration(await http.get('configuration', {}, { includeLanguage: false }));
    },
    async countries(options: LanguageOptions = {}) {
      return validateCountries(await http.get('configuration/countries', { language: options.language }));
    },
    async jobs() {
      return validateJobs(await http.get('configuration/jobs', {}, { includeLanguage: false }));
    },
    async languages() {
      return validateLanguages(await http.get('configuration/languages', {}, { includeLanguage: false }));
    },
    async primaryTranslations() {
      return validateTranslations(await http.get('configuration/primary_translations', {}, { includeLanguage: false }));
    },
    async timezones() {
      return validateTimezones(await http.get('configuration/timezones', {}, { includeLanguage: false }));
    },
  };
}

export function createCertificationMethods(http: TmdbHttpClient): CertificationMethods {
  return {
    async movies() {
      return validateCertifications(await http.get('certification/movie/list', {}, { includeLanguage: false }));
    },
    async tv() {
      return validateCertifications(await http.get('certification/tv/list', {}, { includeLanguage: false }));
    },
  };
}

export function createGenreMethods(http: TmdbHttpClient): GenreMethods {
  return {
    async movies(options: LanguageOptions = {}) {
      return validateGenres(await http.get('genre/movie/list', { language: options.language }));
    },
    async tv(options: LanguageOptions = {}) {
      return validateGenres(await http.get('genre/tv/list', { language: options.language }));
    },
  };
}
