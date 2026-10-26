export interface AuthenticationSuccessResponse {
  success: boolean;
  [key: string]: unknown;
}

export interface AuthenticationKeyResponse extends AuthenticationSuccessResponse {
  status_code?: number;
  status_message?: string;
}

export interface AuthenticationGuestSessionResponse extends AuthenticationSuccessResponse {
  guest_session_id: string;
  expires_at: string;
}

export interface AuthenticationRequestTokenResponse extends AuthenticationSuccessResponse {
  request_token: string;
  expires_at: string;
}

export interface AuthenticationSessionResponse extends AuthenticationSuccessResponse {
  session_id: string;
}

export interface AuthenticationLoginOptions {
  username: string;
  password: string;
  requestToken: string;
}

export interface AuthenticationMethods {
  validateKey(): Promise<AuthenticationKeyResponse>;
  createGuestSession(): Promise<AuthenticationGuestSessionResponse>;
  createRequestToken(): Promise<AuthenticationRequestTokenResponse>;
  createSession(requestToken: string): Promise<AuthenticationSessionResponse>;
  createSessionFromV4Token(accessToken: string): Promise<AuthenticationSessionResponse>;
  /** Validate a request token with a user's credentials; returns the validated token. */
  validateRequestTokenWithLogin(options: AuthenticationLoginOptions): Promise<AuthenticationRequestTokenResponse>;
  deleteSession(sessionId: string): Promise<AuthenticationSuccessResponse>;
}
