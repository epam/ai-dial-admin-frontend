import { themesApi } from '@/src/app/api/api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_: NextRequest, params: { params: Promise<{ name: string }> }) {
  const icon = (await params.params).name;

  const response = await themesApi.getThemeIconUrl(icon);

  if (!response) {
    return new NextResponse('Icon not found', { status: 404 });
  }

  const contentType = response.headers.get('content-type') || 'image/svg+xml';
  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
