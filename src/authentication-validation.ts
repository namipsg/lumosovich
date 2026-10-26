import type {
  AuthenticationGuestSessionResponse, AuthenticationKeyResponse,
  AuthenticationRequestTokenResponse, AuthenticationSessionResponse, AuthenticationSuccessResponse,
} from './authentication-types.js';
import { invalidResponse, isRecord } from './validation.js';

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function authenticationString(value: unknown, field: string): string {
  if (!nonempty(value)) throw new TypeError(`${field} must not be empty`);
  return value;
}

export function validateAuthenticationSuccess(value: unknown): AuthenticationSuccessResponse {
  if (!isRecord(value) || typeof value.success !== 'boolean' ||
    (value.status_code !== undefined &&
      !(typeof value.status_code === 'number' && Number.isSafeInteger(value.status_code) && value.status_code > 0)) ||
    (value.status_message !== undefined && typeof value.status_message !== 'string')) {
    invalidResponse();
  }
  return value as AuthenticationSuccessResponse;
}

export function validateAuthenticationKey(value: unknown): AuthenticationKeyResponse {
  return validateAuthenticationSuccess(value) as AuthenticationKeyResponse;
}

export function validateAuthenticationGuestSession(value: unknown): AuthenticationGuestSessionResponse {
  const response = validateAuthenticationSuccess(value);
  if (!nonempty(response.guest_session_id) || !nonempty(response.expires_at)) invalidResponse();
  return response as AuthenticationGuestSessionResponse;
}

export function validateAuthenticationRequestToken(value: unknown): AuthenticationRequestTokenResponse {
  const response = validateAuthenticationSuccess(value);
  if (!nonempty(response.request_token) || !nonempty(response.expires_at)) invalidResponse();
  return response as AuthenticationRequestTokenResponse;
}

export function validateAuthenticationSession(value: unknown): AuthenticationSessionResponse {
  const response = validateAuthenticationSuccess(value);
  if (!nonempty(response.session_id)) invalidResponse();
  return response as AuthenticationSessionResponse;
}
