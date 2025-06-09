import { themesApi } from '@/src/app/api/api';
import { NextRequest } from 'next/server';

export async function GET(_: NextRequest, params: { params: Promise<{ name: string }> }) {
  const icon = (await params.params).name;

  return themesApi.getThemeIconUrl(icon);
}
