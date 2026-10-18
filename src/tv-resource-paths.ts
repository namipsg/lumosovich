import { positiveId, slotNumber } from './ids.js';
import type { TmdbId } from './types.js';

export function seasonPath(seriesId: TmdbId, seasonNumber: number): string {
  return `tv/${positiveId(seriesId)}/season/${slotNumber(seasonNumber, 'seasonNumber')}`;
}

export function episodePath(seriesId: TmdbId, seasonNumber: number, episodeNumber: number): string {
  return `${seasonPath(seriesId, seasonNumber)}/episode/${slotNumber(episodeNumber, 'episodeNumber')}`;
}
