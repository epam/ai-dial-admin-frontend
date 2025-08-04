import { CookiesOptions } from 'next-auth';

// https://github.com/nextauthjs/next-auth/blob/a8dfc8ebb11ccb96fd694db888e52f0d20395e64/packages/core/src/lib/cookie.ts#L53
function defaultCookies(
  useSecureCookies: boolean,
  sameSite = 'lax',
  cookiePrefix: string,
  csrfPrefix: string,
): CookiesOptions {
  return {
    // default cookie options
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      // Default to __Host- for CSRF token for additional protection if using useSecureCookies
      // NB: The `__Host-` prefix is stricter than the `__Secure-` prefix.
      name: `${csrfPrefix}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes in seconds
      },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes in seconds
      },
    },
    nonce: {
      name: `${cookiePrefix}next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
      },
    },
  };
}

const isSecure = !!process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith('https:');

const getCustomCookiePrefix = (firstPrefix?: string | boolean, secondPrefix?: string): string => {
  const prefix = [firstPrefix, secondPrefix].filter(Boolean).join('-');
  return prefix ? `${prefix}-` : '';
};
const cookiePrefix = process.env.NEXTAUTH_COOKIE_PREFIX;
const customCookiePrefix = getCustomCookiePrefix(isSecure && '__Secure', cookiePrefix);
const csrfPrefix = getCustomCookiePrefix(isSecure && '__Host', cookiePrefix);

export const cookies = defaultCookies(isSecure, isSecure ? 'none' : 'lax', customCookiePrefix, csrfPrefix);
