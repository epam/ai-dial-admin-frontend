import { importApps } from '@/src/app/[lang]/assets-applications/actions';
import { importToolsets } from '@/src/app/[lang]/assets-toolsets/actions';
import { MenuI18nKey } from '@/src/constants/i18n';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { DialRule } from '@/src/models/dial/rule';
import { ImportData, ParsedAssets } from '@/src/models/import-asset';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { importFiles } from '@/src/utils/files/import-files';
import { importPrompts } from '@/src/utils/prompts/import-prompts';
import { getJsonFileName } from '@/src/utils/import/get-json-name';

export const getFormDataForUpload = (files: File[]): { body: FormData; fileSize: number } => {
  const body = new FormData();
  let fileSize = 0;

  files.forEach((f) => {
    body.append('file', f);
    fileSize += f.size;
  });

  return {
    body,
    fileSize,
  };
};

export const getAssetIdByNameAndVersion = (id: string, name?: string, version?: string) => {
  const parts = id.split('/');
  const last = parts[parts.length - 1];
  const [oldName, oldVersion] = last.split('__');

  parts[parts.length - 1] = `${name || oldName}__${version || oldVersion}`;
  return parts.join('/');
};

export const getFormDataForImport = (
  path: string,
  file: ImportData,
  fileType: ImportFileType,
  resolutionStrategy: string,
  rules?: DialRule[],
  flatImport?: boolean,
  route?: ApplicationRoute,
): { body: FormData; fileSize: number } => {
  if (resolutionStrategy === ConflictResolutionPolicy.MANUAL) {
    switch (route) {
      case ApplicationRoute.Prompts: {
        (file as ParsedAssets).prompts?.forEach((prompt) => {
          prompt.id = prompt.id && getAssetIdByNameAndVersion(prompt.id, prompt.name, prompt.version);
        });
        break;
      }
      case ApplicationRoute.AssetsApplications: {
        (file as ParsedAssets).applications?.forEach((application) => {
          application.id =
            application.id && getAssetIdByNameAndVersion(application.id, application.name, application.version);
        });
        break;
      }
      case ApplicationRoute.AssetsToolsets: {
        (file as ParsedAssets).toolSets?.forEach((toolSet) => {
          toolSet.id = toolSet.id && getAssetIdByNameAndVersion(toolSet.id, toolSet.name, toolSet.version);
        });
      }
    }
  }
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
    body.append('file', fileBlob, `${getJsonFileName(route)}.json`);
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

export const getImportTitle = (view?: ApplicationRoute) => {
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
