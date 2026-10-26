import type { AuthenticationLoginOptions, AuthenticationMethods } from './authentication-types.js';
import {
  authenticationString, validateAuthenticationGuestSession, validateAuthenticationKey,
  validateAuthenticationRequestToken, validateAuthenticationSession, validateAuthenticationSuccess,
} from './authentication-validation.js';
import { TmdbHttpClient } from './http.js';
import { isRecord } from './validation.js';

export function createAuthenticationMethods(http: TmdbHttpClient): AuthenticationMethods {
  return {
    async validateKey() {
      return validateAuthenticationKey(await http.get('authentication', {}, { includeLanguage: false }));
    },
    async createGuestSession() {
      return validateAuthenticationGuestSession(
        await http.get('authentication/guest_session/new', {}, { includeLanguage: false }));
    },
    async createRequestToken() {
      return validateAuthenticationRequestToken(
        await http.get('authentication/token/new', {}, { includeLanguage: false }));
    },
    async createSession(requestToken: string) {
      return validateAuthenticationSession(await http.post('authentication/session/new', {}, {
        request_token: authenticationString(requestToken, 'requestToken'),
      }));
    },
    async createSessionFromV4Token(accessToken: string) {
      return validateAuthenticationSession(await http.post('authentication/session/convert/4', {}, {
        access_token: authenticationString(accessToken, 'accessToken'),
      }));
    },
    async validateRequestTokenWithLogin(options: AuthenticationLoginOptions) {
      if (!isRecord(options)) throw new TypeError('login options must be an object');
      return validateAuthenticationRequestToken(await http.post('authentication/token/validate_with_login', {}, {
        username: authenticationString(options.username, 'username'),
        password: authenticationString(options.password, 'password'),
        request_token: authenticationString(options.requestToken, 'requestToken'),
      }));
    },
    async deleteSession(sessionId: string) {
      return validateAuthenticationSuccess(await http.delete('authentication/session', {}, {
        session_id: authenticationString(sessionId, 'sessionId'),
      }));
    },
  };
}
