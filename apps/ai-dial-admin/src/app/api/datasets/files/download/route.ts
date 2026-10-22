import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { datasetsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function GET(req: NextRequest) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') as string;
  const fileName = searchParams.get('fileName') as string;
  return datasetsApi.downloadDatasetFile(decodeURIComponent(id), decodeURIComponent(fileName), token);
}
