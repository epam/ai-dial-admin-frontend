import { NextRequest, NextResponse } from 'next/server';

import { errorObjLog } from '@/src/server/logger';
import { NextClient } from '@/src/utils/auth/nextauth-client';
import { parseInlinePicture } from '@/src/utils/auth/picture';
import { getFullToken } from '@/src/utils/auth/token';

const AZURE_PROVIDER_ID = 'azure-ad';
const GRAPH_PHOTO_URL = 'https://graph.microsoft.com/v1.0/me/photos/96x96/$value';
const CACHE_CONTROL = 'private, max-age=3600';

const toImageResponse = (contentType: string, data: Buffer) =>
  new NextResponse(new Uint8Array(data), {
    headers: { 'Content-Type': contentType, 'Cache-Control': CACHE_CONTROL, 'X-Content-Type-Options': 'nosniff' },
  });

const getAzurePicture = async (accessToken: string) => {
  const response = await fetch(GRAPH_PHOTO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    return undefined;
  }
  // Re-validated against the inline-picture rules so only a raster image of a bounded size is served.
  const base64 = Buffer.from(await response.arrayBuffer()).toString('base64');
  return parseInlinePicture(`data:${response.headers.get('Content-Type') ?? ''};base64,${base64}`);
};

const getUserInfoPicture = async (providerId: string, accessToken: string, sub?: string) => {
  const client = await NextClient.getOrCreateClient(providerId);
  const userInfo = await client?.userinfo(accessToken);
  return userInfo && userInfo.sub === sub ? parseInlinePicture(userInfo.picture) : undefined;
};

/** Serves the signed-in user's inline profile picture, which is deliberately kept out of the session cookie. */
export async function GET(req: NextRequest) {
  const token = await getFullToken({ req });
  if (!token?.access_token || !token.providerId) {
    return new NextResponse(null, { status: 401 });
  }
  if (!token.hasInlinePicture) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const accessToken = token.access_token as string;
    const picture =
      token.providerId === AZURE_PROVIDER_ID
        ? await getAzurePicture(accessToken)
        : await getUserInfoPicture(token.providerId, accessToken, token.sub);

    return picture ? toImageResponse(picture.contentType, picture.data) : new NextResponse(null, { status: 404 });
  } catch (err) {
    errorObjLog(err, 'Profile picture lookup failed');
    return new NextResponse(null, { status: 502 });
  }
}
