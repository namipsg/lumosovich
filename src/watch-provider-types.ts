import type { WatchProvider } from './metadata-types.js';
import type { Country, LanguageOptions } from './reference-types.js';

export interface WatchProviderOptions extends LanguageOptions {
  watchRegion?: string;
}

export interface WatchProviderEntry extends WatchProvider {
  display_priority: number;
  display_priorities: Record<string, number>;
}

export interface WatchProviderRegionsResponse {
  results: Country[];
  [key: string]: unknown;
}

export interface WatchProviderListResponse {
  results: WatchProviderEntry[];
  [key: string]: unknown;
}

export interface WatchProviderMethods {
  regions(options?: LanguageOptions): Promise<WatchProviderRegionsResponse>;
  movies(options?: WatchProviderOptions): Promise<WatchProviderListResponse>;
  tv(options?: WatchProviderOptions): Promise<WatchProviderListResponse>;
}
