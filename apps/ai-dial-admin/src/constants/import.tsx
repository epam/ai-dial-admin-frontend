import { RadioButtonWithContent, Step } from '@epam/ai-dial-ui-kit';

import { ImportI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { ConflictResolutionPolicy, ImportFileType, ImportSteps } from '@/src/types/import';
import { DeploymentImportResolutionPolicy } from '@/src/types/deployments/import';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetWithVersion } from '@/src/utils/is-view';

export const ROW_IMPORT_META_KEY = '__import' as const;

export const IMPORT_RESOLUTIONS = (
  t: (stringToTranslate: string) => string,
  _importType?: string,
): RadioButtonWithContent[] => {
  return [
    { id: ConflictResolutionPolicy.OVERRIDE, name: t(ImportI18nKey.Override) },
    { id: ConflictResolutionPolicy.SKIP, name: t(ImportI18nKey.Skip) },
  ];
};

export const IMPORT_STEPS = (t: (stringToTranslate: string) => string): Step[] => [
  { id: ImportSteps.FILES, name: t(ImportI18nKey.Files) },
  { id: ImportSteps.PROPERTIES, name: t(TabsI18nKey.Properties) },
];

export const IMPORT_CONFIG_STEPS = (t: (stringToTranslate: string) => string): Step[] => [
  { id: ImportSteps.FILES, name: t(ImportI18nKey.Files) },
  { id: ImportSteps.CONFIGURATION, name: t(ImportI18nKey.Configuration) },
];

export const ARCHIVE_IMPORT_TYPE = (t: (stringToTranslate: string) => string) => ({
  id: ImportFileType.ARCHIVE,
  name: t(ImportI18nKey.DialArchive),
  content: <div className="dial-tiny-text ml-[33px]">{t(ImportI18nKey.DialArchiveDescription)}</div>,
});

export const DIAL_JSON_IMPORT_TYPE = (t: (stringToTranslate: string) => string) => ({
  id: ImportFileType.JSON,
  name: t(ImportI18nKey.DialCoreFiles),
  content: <div className="dial-tiny-text ml-[33px]">{t(ImportI18nKey.SeparateFilesDescription)}</div>,
});

export const SEPARATE_FILES_IMPORT_TYPE = (t: (stringToTranslate: string) => string) => ({
  id: ImportFileType.FILES,
  name: t(ImportI18nKey.SeparateFiles),
  content: <div className="dial-tiny-text ml-[33px]">{t(ImportI18nKey.SeparateFilesDescription)}</div>,
});

export const DEPLOYMENT_IMPORT_RESOLUTIONS = (t: (stringToTranslate: string) => string): RadioButtonWithContent[] => [
  { id: DeploymentImportResolutionPolicy.OVERWRITE, name: t(ImportI18nKey.Override) },
  { id: DeploymentImportResolutionPolicy.SKIP_IF_EXISTS, name: t(ImportI18nKey.Skip) },
];

export const IMPORT_FILE_TYPES = (
  t: (stringToTranslate: string) => string,
  route?: ApplicationRoute,
): RadioButtonWithContent[] => {
  const buttons = [ARCHIVE_IMPORT_TYPE(t)];

  if (isAssetWithVersion(route)) {
    return [...buttons, DIAL_JSON_IMPORT_TYPE(t)];
  }
  if (route === ApplicationRoute.Files) {
    return [...buttons, SEPARATE_FILES_IMPORT_TYPE(t)];
  }

  return buttons;
};
