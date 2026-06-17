import { NextRequest, NextResponse } from 'next/server';
import { themesApi } from '../api/api';
import { getIconPath } from '@/src/utils/themes/icon-path';

export async function GET(request: NextRequest) {
  const themesConfig = await themesApi.getThemesConfiguration();

  const faviconUrl = themesConfig
    ? getIconPath(themesConfig?.images['admin-favicon'] || themesConfig?.images.favicon)
    : '/images/favicon.svg';

  // Workaround: https://github.com/vercel/next.js/issues/37536
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? new URL(request.url).host;

  return NextResponse.redirect(new URL(faviconUrl, `${proto}://${host}`));
}
