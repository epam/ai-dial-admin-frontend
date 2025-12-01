import withAuth from 'next-auth/middleware';
import { createI18nMiddleware } from 'next-international/middleware';
import { NextRequest } from 'next/server';

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
  console.info(`Middleware invoked for ${req.nextUrl.pathname}`);
  return I18nMiddleware(req);
}

const authMiddleware = withAuth(middlewareFn, { cookies });

const middleware = !getIsEnableAuthToggle() ? middlewareFn : authMiddleware;

export default middleware;
