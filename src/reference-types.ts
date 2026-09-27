import type { Genre } from './detail-types.js';

export interface LanguageOptions {
  language?: string;
}

export interface ImageConfiguration {
  base_url: string;
  secure_base_url: string;
  backdrop_sizes: string[];
  logo_sizes: string[];
  poster_sizes: string[];
  profile_sizes: string[];
  still_sizes: string[];
  [key: string]: unknown;
}

export interface ConfigurationResponse {
  images: ImageConfiguration;
  change_keys: string[];
  [key: string]: unknown;
}

export interface Country {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
  [key: string]: unknown;
}

export interface DepartmentJobs {
  department: string;
  jobs: string[];
  [key: string]: unknown;
}

export interface Language {
  iso_639_1: string;
  english_name: string;
  name: string;
  [key: string]: unknown;
}

export interface CountryTimezones {
  iso_3166_1: string;
  zones: string[];
  [key: string]: unknown;
}

export interface Certification {
  certification: string;
  meaning: string;
  order: number;
  [key: string]: unknown;
}

export interface CertificationsResponse {
  certifications: Record<string, Certification[]>;
  [key: string]: unknown;
}

export interface GenresResponse {
  genres: Genre[];
  [key: string]: unknown;
}

export interface ConfigurationMethods {
  get(): Promise<ConfigurationResponse>;
  countries(options?: LanguageOptions): Promise<Country[]>;
  jobs(): Promise<DepartmentJobs[]>;
  languages(): Promise<Language[]>;
  primaryTranslations(): Promise<string[]>;
  timezones(): Promise<CountryTimezones[]>;
}

export interface CertificationMethods {
  movies(): Promise<CertificationsResponse>;
  tv(): Promise<CertificationsResponse>;
}

export interface GenreMethods {
  movies(options?: LanguageOptions): Promise<GenresResponse>;
  tv(options?: LanguageOptions): Promise<GenresResponse>;
}
