import { NextRequest, NextResponse } from 'next/server';
import { themesApi } from '../api/api';
import { getIconPath } from '@/src/utils/themes/icon-path';

export async function GET(request: NextRequest) {
  const themesConfig = await themesApi.getThemesConfiguration();

  const faviconUrl = themesConfig
    ? getIconPath(themesConfig?.images['admin-favicon'] || themesConfig?.images.favicon)
    : '/images/favicon.svg';
  return NextResponse.redirect(new URL(faviconUrl, request.url));
}
