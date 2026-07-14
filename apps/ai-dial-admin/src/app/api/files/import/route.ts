import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { filesCoreApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ImportFileType, ConflictResolutionPolicy } from '@/src/types/import';
import { FILES_IMPORT_CIRCUIT_BREAKER_THRESHOLD } from '@/src/server/files/circuit-breaker';
import { importPlainFiles, importZipFile, InvalidImportZipError } from '@/src/server/files/import';

interface ImportConfig {
  path: string;
  conflictResolutionStrategy: string;
}

export async function POST(req: NextRequest) {
  const fileType = req.nextUrl.searchParams.get('fileType') as ImportFileType | null;
  if (!fileType) {
    return NextResponse.json(
      { success: false, errorHeader: 'Bad Request', errorMessage: 'fileType query param is required' },
      { status: 400 },
    );
  }

  const formData = await req.formData();
  const configBlob = formData.get('config') as Blob | null;
  if (!configBlob) {
    return NextResponse.json(
      { success: false, errorHeader: 'Bad Request', errorMessage: 'config part is required' },
      { status: 400 },
    );
  }
  const config = JSON.parse(await configBlob.text()) as ImportConfig;
  const overwrite = config.conflictResolutionStrategy === ConflictResolutionPolicy.OVERRIDE;

  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const upload = (targetPath: string, file: File) => filesCoreApi.uploadFile(token, targetPath, file, { overwrite });

  try {
    const outcome =
      fileType === ImportFileType.ARCHIVE
        ? await importZipFile(formData.get('file') as File, config.path, upload, FILES_IMPORT_CIRCUIT_BREAKER_THRESHOLD)
        : await importPlainFiles(
            formData.getAll('files') as File[],
            config.path,
            upload,
            FILES_IMPORT_CIRCUIT_BREAKER_THRESHOLD,
          );

    return NextResponse.json({ success: true, response: outcome });
  } catch (error) {
    if (error instanceof InvalidImportZipError) {
      return NextResponse.json(
        { success: false, errorHeader: 'Bad Request', errorMessage: error.message },
        { status: 400 },
      );
    }
    throw error;
  }
}
