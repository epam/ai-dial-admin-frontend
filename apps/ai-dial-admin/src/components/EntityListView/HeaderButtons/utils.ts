import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { DialRule } from '@/src/models/dial/rule';
import { ParsedPrompts } from '@/src/models/prompts';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';

export const getFormDataForImport = (
  path: string,
  file: File | File[] | ParsedPrompts,
  fileType: ImportFileType,
  resolutionStrategy: string,
  rules?: DialRule[],
): FormData => {
  const config: { path: string; conflictResolutionStrategy: string; rules?: DialRule[] } = {
    path,
    conflictResolutionStrategy:
      resolutionStrategy === ConflictResolutionPolicy.MANUAL ? ConflictResolutionPolicy.SKIP : resolutionStrategy,
  };
  if (rules) {
    config.rules = rules;
  }
  const configBlob = new Blob([JSON.stringify(config)], {
    type: APPLICATION_JSON_TYPE,
  });
  const body = new FormData();
  body.append('config', configBlob, 'config.json');

  if (fileType === ImportFileType.ARCHIVE) {
    body.append('file', file as File);
  } else if (fileType === ImportFileType.JSON) {
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
