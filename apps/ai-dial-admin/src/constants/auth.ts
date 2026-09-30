import { ApiRoute } from '@/src/constants/api-routes';

export const SIGN_IN_LINK = ApiRoute.AuthSignin;

// Refresh this long before the IdP's expiry, so a token doesn't expire while a backend request is in flight.
export const ACCESS_TOKEN_EXPIRY_MARGIN_MS = 60 * 1000;

// Must stay below the IdP's access-token lifespan, so an open tab renews the session cookie before it expires.
export const SESSION_REFETCH_INTERVAL_SEC = 5 * 60;
