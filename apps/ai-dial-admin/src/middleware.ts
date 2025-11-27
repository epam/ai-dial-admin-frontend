import withAuth from 'next-auth/middleware';
import { createI18nMiddleware } from 'next-international/middleware';
import { NextRequest } from 'next/server';

import { getTraceId } from '@/src/telemetry/get-trace-id';
import { cookies } from '@/src/utils/auth/auth-cookies';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

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
  const traceId = getTraceId();

  const i18nResponse = await I18nMiddleware(req);

  i18nResponse.headers.set('traceparent', traceId);

  return i18nResponse;
}

const authMiddleware = withAuth(middlewareFn, { cookies });

const middleware = !getIsEnableAuthToggle() ? middlewareFn : authMiddleware;

export default middleware;
