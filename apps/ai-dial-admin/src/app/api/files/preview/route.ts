import { NextRequest } from 'next/server';

import { filesCoreApi } from '@/src/app/api/api';
import { getFullToken } from '@/src/utils/auth/token';
import { getFolderNameAndPath } from '@/src/utils/files/path';

export async function GET(req: NextRequest) {
  const token = await getFullToken({ req });

  const reqUrl = req.url;
  const { searchParams } = new URL(reqUrl);
  const path = decodeURIComponent(searchParams.get('path') as string);
  const fileName = getFolderNameAndPath(path).name;
  return await filesCoreApi.previewFile(token, path, fileName);
}
