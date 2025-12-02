import { importFiles } from '@/src/app/[lang]/files/actions';
import { importPrompts } from '@/src/app/[lang]/prompts/actions';
import { importApps } from '@/src/app/[lang]/assets-applications/actions';
import { importToolsets } from '@/src/app/[lang]/assets-toolsets/actions';
import { MenuI18nKey } from '@/src/constants/i18n';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { DialRule } from '@/src/models/dial/rule';
import { ParsedAssets } from '@/src/models/prompts';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';

export const getFormDataForImport = (
  path: string,
  file: File | File[] | ParsedAssets,
  fileType: ImportFileType,
  resolutionStrategy: string,
  rules?: DialRule[],
  flatImport?: boolean,
): { body: FormData; fileSize: number } => {
  const config: { path: string; conflictResolutionStrategy: string; rules?: DialRule[]; flatImport?: boolean } = {
    flatImport,
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
  let fileSize = 0;
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
      fileSize += f.size;
    });
  }
  return {
    body,
    fileSize,
  };
};
export const getImportFunction = (view: ApplicationRoute) => {
  switch (view) {
    case ApplicationRoute.Prompts:
      return importPrompts;

    case ApplicationRoute.Files:
      return importFiles;

    case ApplicationRoute.AssetsApplications:
      return importApps;

    case ApplicationRoute.AssetsToolsets:
      return importToolsets;
    default:
      return null;
  }
};

export const getImportTitle = (view: ApplicationRoute) => {
  switch (view) {
    case ApplicationRoute.Prompts:
      return MenuI18nKey.Prompts;

    case ApplicationRoute.Files:
      return MenuI18nKey.Files;

    case ApplicationRoute.AssetsApplications:
      return MenuI18nKey.Applications;

    case ApplicationRoute.AssetsToolsets:
      return MenuI18nKey.Toolsets;
    default:
      return '';
  }
};
