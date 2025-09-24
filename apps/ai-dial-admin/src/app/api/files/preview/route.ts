import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

import { assetsApi } from '@/src/app/api/api';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });

  const reqUrl = req.url;
  const { searchParams } = new URL(reqUrl);
  const path = searchParams.get('path') as string;
  return await assetsApi.previewFile(token, decodeURIComponent(path));
}
