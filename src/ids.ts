import type { TmdbId } from './types.js';

export function positiveId(id: TmdbId): TmdbId {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new TypeError('TMDB ID must be a positive integer');
  }
  return id;
}

export function slotNumber(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a nonnegative integer`);
  }
  return value;
}

export function pathId(value: string, label: string): string {
  if (typeof value !== 'string' || !value.trim() || ['.', '..'].includes(value.trim())) {
    throw new TypeError(`${label} must be a nonempty path identifier`);
  }
  return value.trim();
}
