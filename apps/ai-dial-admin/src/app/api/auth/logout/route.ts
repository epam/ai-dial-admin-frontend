import { NextRequest, NextResponse } from 'next/server';

export const GET = (req: NextRequest) => {
  const provider = req.nextUrl.searchParams.get('provider');

  if (provider === 'auth0') {
    const auth0Host = process.env.AUTH_AUTH0_HOST;
    const auth0ClientId = process.env.AUTH_AUTH0_CLIENT_ID;
    const returnTo = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;

    if (auth0Host && auth0ClientId) {
      const auth0LogoutUrl = `${auth0Host}/v2/logout?client_id=${auth0ClientId}&returnTo=${encodeURIComponent(returnTo)}`;
      return NextResponse.redirect(auth0LogoutUrl);
    }
  }

  return NextResponse.redirect(new URL('/', req.url));
};
