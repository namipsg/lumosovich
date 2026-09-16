import { TmdbError } from './errors.js';
import type { LumosovichOptions } from './types.js';

type QueryValue = string | number | boolean | undefined;
export type QueryParameters = Record<string, QueryValue>;

const API_BASE_URL = 'https://api.themoviedb.org/3/';
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 2_147_483_647;

export class TmdbHttpClient {
  private readonly apiKey?: string;
  private readonly accessToken?: string;
  private readonly language: string;
  private readonly timeoutMs: number;
  private readonly fetchRequest: typeof fetch;

  constructor(options: LumosovichOptions) {
    this.apiKey = options.apiKey?.trim();
    this.accessToken = options.accessToken?.trim();
    if (Boolean(this.apiKey) === Boolean(this.accessToken)) {
      throw new TypeError('Supply exactly one of apiKey or accessToken');
    }

    this.language = options.language ?? 'en-US';
    if (!this.language.trim()) {
      throw new TypeError('language must not be empty');
    }

    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (
      !Number.isInteger(this.timeoutMs) ||
      this.timeoutMs < 1 ||
      this.timeoutMs > MAX_TIMEOUT_MS
    ) {
      throw new TypeError('timeoutMs must be a positive integer');
    }

    this.fetchRequest = options.fetch === undefined ? globalThis.fetch : options.fetch;
    if (typeof this.fetchRequest !== 'function') {
      throw new TypeError('fetch must be a function');
    }
  }

  async get(path: string, parameters: QueryParameters = {}): Promise<unknown> {
    const url = new URL(path, API_BASE_URL);
    const language = parameters.language ?? this.language;
    if (typeof language !== 'string' || !language.trim()) {
      throw new TypeError('language must not be empty');
    }
    url.searchParams.set('language', language);
    for (const [key, value] of Object.entries(parameters)) {
      if (key !== 'language' && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
    if (this.apiKey) url.searchParams.set('api_key', this.apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      let response: Response;
      try {
        response = await this.fetchRequest(url, {
          headers: {
            accept: 'application/json',
            ...(this.accessToken
              ? { authorization: `Bearer ${this.accessToken}` }
              : {}),
          },
          signal: controller.signal,
        });
      } catch {
        throw controller.signal.aborted
          ? new TmdbError('TIMEOUT', 'TMDB request timed out')
          : new TmdbError('NETWORK_ERROR', 'TMDB network request failed');
      }

      if (controller.signal.aborted) {
        throw new TmdbError('TIMEOUT', 'TMDB request timed out');
      }
      if (!response.ok) {
        throw response.status === 429
          ? new TmdbError('RATE_LIMITED', 'TMDB rate limit exceeded', 429)
          : new TmdbError(
              'HTTP_ERROR',
              `TMDB request failed with HTTP ${response.status}`,
              response.status,
            );
      }

      try {
        const payload: unknown = await response.json();
        if (controller.signal.aborted) {
          throw new TmdbError('TIMEOUT', 'TMDB request timed out');
        }
        return payload;
      } catch (error) {
        if (error instanceof TmdbError) throw error;
        throw controller.signal.aborted
          ? new TmdbError('TIMEOUT', 'TMDB request timed out')
          : new TmdbError('INVALID_RESPONSE', 'TMDB returned invalid JSON');
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
