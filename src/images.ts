export type ImageSize =
  | 'original'
  | 'w92'
  | 'w154'
  | 'w185'
  | 'w342'
  | 'w500'
  | 'w780'
  | 'w1280';

export interface ImageMethods {
  url(filePath: string | null | undefined, size?: ImageSize): string | undefined;
}

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const IMAGE_SIZES: readonly ImageSize[] = [
  'original',
  'w92',
  'w154',
  'w185',
  'w342',
  'w500',
  'w780',
  'w1280',
];

export function createImageMethods(): ImageMethods {
  return {
    url(filePath, size = 'original') {
      if (filePath == null || filePath === '') return undefined;
      if (
        typeof filePath !== 'string' ||
        !/^\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp|svg)$/i.test(filePath) ||
        filePath.includes('..')
      ) {
        throw new TypeError('Invalid TMDB image path');
      }
      if (!IMAGE_SIZES.includes(size)) {
        throw new TypeError('Unsupported TMDB image size');
      }
      return `${IMAGE_BASE_URL}${size}${filePath}`;
    },
  };
}
