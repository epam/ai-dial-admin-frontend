import { RadioButtonWithContent, Step } from '@epam/ai-dial-ui-kit';

import { ImportI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { ConflictResolutionPolicy, ImportFileType, ImportSteps } from '@/src/types/import';
import { CatalogResolutionPolicy } from '@/src/types/analytics/import';
import { DeploymentImportResolutionPolicy } from '@/src/types/deployments/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getImportSizeLimits } from '@/src/utils/import/get-import-size-limits';
import { isAssetWithVersion } from '@/src/utils/is-view';

export const ROW_IMPORT_META_KEY = '__import' as const;

type TranslateFn = (stringToTranslate: string, options?: Record<string, string | number>) => string;

export const IMPORT_RESOLUTIONS = (t: TranslateFn, _importType?: string): RadioButtonWithContent[] => {
  return [
    { id: ConflictResolutionPolicy.OVERRIDE, name: t(ImportI18nKey.Override) },
    { id: ConflictResolutionPolicy.SKIP, name: t(ImportI18nKey.Skip) },
  ];
};

export const IMPORT_STEPS = (t: TranslateFn): Step[] => [
  { id: ImportSteps.FILES, name: t(ImportI18nKey.Files) },
  { id: ImportSteps.PROPERTIES, name: t(TabsI18nKey.Properties) },
];

export const IMPORT_CONFIG_STEPS = (t: TranslateFn): Step[] => [
  { id: ImportSteps.FILES, name: t(ImportI18nKey.Files) },
  { id: ImportSteps.CONFIGURATION, name: t(ImportI18nKey.Configuration) },
];

export const ARCHIVE_IMPORT_TYPE = (t: TranslateFn, route?: ApplicationRoute) => ({
  id: ImportFileType.ARCHIVE,
  name: t(ImportI18nKey.DialArchive),
  content: (
    <div className="dial-tiny-text ml-[33px]">
      {route === ApplicationRoute.Files
        ? t(ImportI18nKey.DialArchiveWithLimitDescription, { size: getImportSizeLimits(route).maxFileSizeMb })
        : t(ImportI18nKey.DialArchiveDescription)}
    </div>
  ),
});

export const DIAL_JSON_IMPORT_TYPE = (t: TranslateFn, route?: ApplicationRoute) => {
  const { maxFileSizeMb, maxMultiFilesSizeMb } = getImportSizeLimits(route);

  return {
    id: ImportFileType.JSON,
    name: t(ImportI18nKey.DialCoreFiles),
    content: (
      <div className="dial-tiny-text ml-[33px]">
        {t(ImportI18nKey.JsonFilesDescription, { size: maxFileSizeMb, totalSize: maxMultiFilesSizeMb })}
      </div>
    ),
  };
};

export const SEPARATE_FILES_IMPORT_TYPE = (t: TranslateFn, route?: ApplicationRoute) => ({
  id: ImportFileType.FILES,
  name: t(ImportI18nKey.SeparateFiles),
  content: (
    <div className="dial-tiny-text ml-[33px]">
      {t(ImportI18nKey.SeparateFilesDescription, { totalSize: getImportSizeLimits(route).maxMultiFilesSizeMb })}
    </div>
  ),
});

export const DEPLOYMENT_IMPORT_RESOLUTIONS = (t: TranslateFn): RadioButtonWithContent[] => [
  { id: DeploymentImportResolutionPolicy.OVERWRITE, name: t(ImportI18nKey.Override) },
  { id: DeploymentImportResolutionPolicy.SKIP_IF_EXISTS, name: t(ImportI18nKey.Skip) },
];

export const ANALYTICS_IMPORT_RESOLUTIONS = (t: TranslateFn): RadioButtonWithContent[] => [
  { id: CatalogResolutionPolicy.FAIL_IF_EXISTS, name: t(ImportI18nKey.AnalyticsFailIfExists) },
  { id: CatalogResolutionPolicy.SKIP_IF_EXISTS, name: t(ImportI18nKey.AnalyticsSkipIfExists) },
];

export const IMPORT_FILE_TYPES = (t: TranslateFn, route?: ApplicationRoute): RadioButtonWithContent[] => {
  const buttons = [ARCHIVE_IMPORT_TYPE(t, route)];

  // Prompts are versionless but keep the aggregate JSON import (a `{ prompts: [...] }`
  // document); apps/toolsets keep theirs.
  if (isAssetWithVersion(route) || route === ApplicationRoute.Prompts) {
    return [...buttons, DIAL_JSON_IMPORT_TYPE(t, route)];
  }
  if (route === ApplicationRoute.Files) {
    return [...buttons, SEPARATE_FILES_IMPORT_TYPE(t, route)];
  }

  return buttons;
};
