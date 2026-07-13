import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { filesCoreApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getFolderNameAndPath } from '@/src/utils/files/path';

export async function GET(req: NextRequest) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const reqUrl = req.url;
  const { searchParams } = new URL(reqUrl);
  const path = decodeURIComponent(searchParams.get('path') as string);
  const fileName = getFolderNameAndPath(path).name;
  return await filesCoreApi.downloadFile(token, path, fileName);
}
