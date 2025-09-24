import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { assetsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function GET(req: NextRequest) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const reqUrl = req.url;
  const { searchParams } = new URL(reqUrl);
  const path = searchParams.get('path') as string;
  return await assetsApi.downloadFile(token, decodeURIComponent(path));
}
