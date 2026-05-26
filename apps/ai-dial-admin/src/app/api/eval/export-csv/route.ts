import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { analyticsApi } from '@/src/app/api/api';
import { EvalSummaryExportRequestDto } from '@/src/models/evaluation/export';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function POST(req: NextRequest) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const dto = (await req.json()) as EvalSummaryExportRequestDto;

  const result = await analyticsApi.exportCsv(dto, token);

  if (!result) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }

  const { blob, fileName } = result;
  const buffer = Buffer.from(await blob.arrayBuffer());

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=UTF-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
