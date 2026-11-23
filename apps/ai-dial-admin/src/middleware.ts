import withAuth from 'next-auth/middleware';
import { createI18nMiddleware } from 'next-international/middleware';
import { NextRequest, NextResponse } from 'next/server';

import { cookies } from '@/src/utils/auth/auth-cookies';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { buildContentSecurityPolicy, resolveCspMode } from '@/src/utils/security/csp';

const LOCALE_HEADER = 'X-Next-Locale';

const I18nMiddleware = createI18nMiddleware({
  defaultLocale: 'en',
  locales: ['en'],
});

export const config = {
  matcher: [
    '/((?!api|static|_next/static|_next/image|images|favicon\\.svg|robots\\.txt|.*\\.(?:js|css|png|jpg|jpeg|svg|webp|ico|woff2?)$).*)',
  ],
};

async function middlewareFn(req: NextRequest) {
  console.info(`Middleware invoked for ${req.nextUrl.pathname}`);

  const i18nResponse = I18nMiddleware(req);

  if (i18nResponse.headers.has('location')) {
    return i18nResponse;
  }

  const { headerName, value } = buildContentSecurityPolicy({
    nonce: btoa(crypto.randomUUID()),
    mode: resolveCspMode(process.env.CSP_MODE),
    isDevelopment: process.env.NODE_ENV === 'development',
  });

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(headerName, value);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const locale = i18nResponse.headers.get(LOCALE_HEADER);

  if (locale) {
    response.headers.set(LOCALE_HEADER, locale);
  }

  i18nResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  response.headers.set(headerName, value);

  return response;
}

const authMiddleware = withAuth(middlewareFn, { cookies });

const middleware = !getIsEnableAuthToggle() ? middlewareFn : authMiddleware;

export default middleware;
