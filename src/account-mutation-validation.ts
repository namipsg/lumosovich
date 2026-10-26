import type { AccountMutationResponse } from './account-mutation-types.js';
import { invalidResponse, isRecord } from './validation.js';

export function validateAccountMutation(value: unknown): AccountMutationResponse {
  if (!isRecord(value) || typeof value.status_code !== 'number' ||
    !Number.isSafeInteger(value.status_code) || value.status_code < 1 ||
    typeof value.status_message !== 'string' ||
    (value.success !== undefined && typeof value.success !== 'boolean')) {
    invalidResponse();
  }
  return value as unknown as AccountMutationResponse;
}
