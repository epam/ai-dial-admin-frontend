import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import withAuth from 'next-auth/middleware';
import { createI18nMiddleware } from 'next-international/middleware';
import { NextRequest } from 'next/server';

const I18nMiddleware = createI18nMiddleware({
  defaultLocale: 'en',
  locales: ['en'],
});

export const config = {
  matcher: ['/((?!api|static|.*\\..*|_next/static|_next/image|images|favicon.svg|robots.txt).*)'],
};

async function middlewareFn(req: NextRequest) {
  return I18nMiddleware(req);
}

const middleware = !getIsEnableAuthToggle() ? middlewareFn : withAuth(middlewareFn);

export default middleware;
