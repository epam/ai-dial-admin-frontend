import { NextRequest, NextResponse } from 'next/server';

import { importPrompts } from '@/src/app/[lang]/prompts/actions';
import { ImportFileType } from '@/src/types/import';

export async function POST(req: NextRequest) {
  const fileType = req.nextUrl.searchParams.get('fileType') as ImportFileType | null;
  if (!fileType) {
    return NextResponse.json(
      { success: false, errorHeader: 'Bad Request', errorMessage: 'fileType query param is required' },
      { status: 400 },
    );
  }
  const body = await req.formData();
  const result = await importPrompts(body, fileType);
  return NextResponse.json(result);
}
