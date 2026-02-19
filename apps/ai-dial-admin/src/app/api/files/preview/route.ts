import { NextRequest } from 'next/server';

import { assetsApi } from '@/src/app/api/api';
import { getFullToken } from '@/src/utils/auth/token';

export async function GET(req: NextRequest) {
  const token = await getFullToken({ req });

  const reqUrl = req.url;
  const { searchParams } = new URL(reqUrl);
  const path = searchParams.get('path') as string;
  return await assetsApi.previewFile(token, decodeURIComponent(path));
}
