import { NextRequest, NextResponse } from 'next/server';

import { importPrompts } from '@/src/app/[lang]/prompts/actions';
import { ImportFileType } from '@/src/types/import';
import { ImportRequestTooLargeError, readImportFormData } from '@/src/server/assets/read-import-form-data';

export async function POST(req: NextRequest) {
  const fileType = req.nextUrl.searchParams.get('fileType') as ImportFileType | null;
  if (!fileType) {
    return NextResponse.json(
      { success: false, errorHeader: 'Bad Request', errorMessage: 'fileType query param is required' },
      { status: 400 },
    );
  }
  let body: FormData;
  try {
    body = await readImportFormData(req);
  } catch (error) {
    if (error instanceof ImportRequestTooLargeError) {
      return NextResponse.json(
        { success: false, errorHeader: 'Bad Request', errorMessage: 'Import request exceeds 66 MB' },
        { status: 413 },
      );
    }
    return NextResponse.json(
      { success: false, errorHeader: 'Bad Request', errorMessage: 'Invalid import form data' },
      { status: 400 },
    );
  }
  const result = await importPrompts(body, fileType);
  return NextResponse.json(result);
}
