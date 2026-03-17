import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { assetsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ImportFileType } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';

export async function POST(req: NextRequest) {
  const fileType = req.nextUrl.searchParams.get('fileType') as ImportFileType | null;
  if (!fileType) {
    return NextResponse.json(
      { success: false, errorHeader: 'Bad Request', errorMessage: 'fileType query param is required' },
      { status: 400 },
    );
  }
  const body = await req.formData();
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const result = await assetsApi.importAssets(token, body, fileType, ResourceType.FILE);
  return NextResponse.json(result);
}
