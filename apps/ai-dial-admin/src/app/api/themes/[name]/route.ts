import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { themesApi } from '@/src/app/api/api';
import { THEME_IMAGE_STALE_SECONDS, THEME_REVALIDATE_SECONDS } from '@/src/constants/theme';

// Theme image URLs are not versioned, so a browser keeps them only for the revalidation window and then
// serves the stale copy while it checks the ETag in the background.
const THEME_IMAGE_CACHE_CONTROL = `public, max-age=${THEME_REVALIDATE_SECONDS}, stale-while-revalidate=${THEME_IMAGE_STALE_SECONDS}`;

const isETagMatch = (ifNoneMatch: string | null, etag: string): boolean => {
  if (ifNoneMatch == null) {
    return false;
  }

  const normalize = (tag: string) => tag.trim().replace(/^W\//, '');
  return ifNoneMatch.split(',').some((tag) => tag.trim() === '*' || normalize(tag) === normalize(etag));
};

export async function GET(request: NextRequest, params: { params: Promise<{ name: string }> }) {
  const icon = (await params.params).name;

  const response = await themesApi.getThemeIconUrl(icon);

  if (!response) {
    return new NextResponse('Icon not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const contentType = response.headers.get('content-type') || 'image/svg+xml';
  const buffer = await response.arrayBuffer();
  const etag =
    response.headers.get('etag') ?? `"${createHash('sha1').update(Buffer.from(buffer)).digest('base64url')}"`;
  const cacheHeaders = { 'Cache-Control': THEME_IMAGE_CACHE_CONTROL, ETag: etag };

  if (isETagMatch(request.headers.get('if-none-match'), etag)) {
    return new NextResponse(null, { status: 304, headers: cacheHeaders });
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: { 'Content-Type': contentType, ...cacheHeaders },
  });
}
