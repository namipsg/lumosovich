import { TmdbHttpClient, type QueryParameters } from './http.js';
import type { LanguageOptions } from './reference-types.js';
import { validateCountries } from './reference-validation.js';
import { invalidResponse, isRecord } from './validation.js';
import type {
  WatchProviderListResponse, WatchProviderMethods, WatchProviderOptions, WatchProviderRegionsResponse,
} from './watch-provider-types.js';

function parameters(options: WatchProviderOptions): QueryParameters {
  if (options.watchRegion !== undefined &&
    (typeof options.watchRegion !== 'string' || !options.watchRegion.trim())) {
    throw new TypeError('watchRegion must not be empty');
  }
  return { language: options.language, watch_region: options.watchRegion };
}

function count(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function validateProviders(value: unknown): WatchProviderListResponse {
  if (!isRecord(value) || !Array.isArray(value.results) || !value.results.every((item: unknown) =>
    isRecord(item) && count(item.provider_id) && item.provider_id > 0 &&
    typeof item.provider_name === 'string' && typeof item.logo_path === 'string' &&
    count(item.display_priority) && isRecord(item.display_priorities) &&
    Object.values(item.display_priorities).every(count))) invalidResponse();
  return value as unknown as WatchProviderListResponse;
}

export function createWatchProviderMethods(http: TmdbHttpClient): WatchProviderMethods {
  return {
    async regions(options: LanguageOptions = {}) {
      const value = await http.get('watch/providers/regions', { language: options.language });
      if (!isRecord(value)) invalidResponse();
      validateCountries(value.results);
      return value as unknown as WatchProviderRegionsResponse;
    },
    async movies(options: WatchProviderOptions = {}) {
      return validateProviders(await http.get('watch/providers/movie', parameters(options)));
    },
    async tv(options: WatchProviderOptions = {}) {
      return validateProviders(await http.get('watch/providers/tv', parameters(options)));
    },
  };
}
