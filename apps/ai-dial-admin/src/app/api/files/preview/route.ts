import { filesApi } from '@/src/app/api/api';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });

  const reqUrl = req.url;
  const { searchParams } = new URL(reqUrl);
  const path = searchParams.get('path') as string;
  return await filesApi.previewFile(token, decodeURIComponent(path));
}
