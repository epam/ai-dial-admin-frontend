import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { ParsedPrompts } from '@/src/models/prompts';
import { ConflictResolutionPolicy, ImportFileTypes } from '@/src/types/import';

export const getFormDataForImport = (
  path: string,
  file: File | File[] | ParsedPrompts,
  fileType: ImportFileTypes,
  resolutionStrategy: string,
): FormData => {
  const configBlob = new Blob(
    [
      JSON.stringify({
        path,
        conflictResolutionStrategy:
          resolutionStrategy === ConflictResolutionPolicy.MANUAL ? ConflictResolutionPolicy.SKIP : resolutionStrategy,
      }),
    ],
    {
      type: APPLICATION_JSON_TYPE,
    },
  );
  const body = new FormData();
  body.append('config', configBlob, 'config.json');

  if (fileType === ImportFileTypes.ARCHIVE) {
    body.append('file', file as File);
  } else if (fileType === ImportFileTypes.JSON) {
    const fileBlob = new Blob([JSON.stringify(file)], {
      type: APPLICATION_JSON_TYPE,
    });
    body.append('file', fileBlob, 'prompts.json');
  } else {
    (file as File[]).forEach((f) => {
      body.append('files', f);
    });
  }
  return body;
};
