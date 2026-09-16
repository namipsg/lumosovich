export type TmdbErrorCode =
  | 'HTTP_ERROR'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE';

/** Safe public error: never includes a request URL, credential, or upstream body. */
export class TmdbError extends Error {
  readonly code: TmdbErrorCode;
  readonly status?: number;

  constructor(code: TmdbErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'TmdbError';
    this.code = code;
    this.status = status;
  }
}
