import { Step } from '@epam/ai-dial-ui-kit';

import { RadioButtonModel } from '@/src/models/radio-button';
import { ImportI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { ConflictResolutionPolicy, ImportFileType, ImportSteps } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';

export const IMPORT_RESOLUTIONS = (
  t: (stringToTranslate: string) => string,
  importType?: string,
): RadioButtonModel[] => {
  const resolutions = [
    { id: ConflictResolutionPolicy.OVERRIDE, name: t(ImportI18nKey.Override) },
    { id: ConflictResolutionPolicy.SKIP, name: t(ImportI18nKey.Skip) },
  ];
  if (importType && (importType === ImportFileType.JSON || importType === ImportFileType.FILES)) {
    resolutions.push({ id: ConflictResolutionPolicy.MANUAL, name: t(ImportI18nKey.EditManually) });
  }
  return resolutions;
};

export const IMPORT_STEPS = (t: (stringToTranslate: string) => string): Step[] => [
  { id: ImportSteps.FILES, name: t(ImportI18nKey.Files) },
  { id: ImportSteps.PROPERTIES, name: t(TabsI18nKey.Properties) },
];

export const IMPORT_CONFIG_STEPS = (t: (stringToTranslate: string) => string): Step[] => [
  { id: ImportSteps.FILES, name: t(ImportI18nKey.Files) },
  { id: ImportSteps.CONFIGURATION, name: t(ImportI18nKey.Configuration) },
];

export const IMPORT_FILE_TYPES = (
  t: (stringToTranslate: string) => string,
  route?: ApplicationRoute,
): RadioButtonModel[] => {
  const buttons = [
    {
      id: ImportFileType.ARCHIVE,
      name: t(ImportI18nKey.DialArchive),
      description: t(ImportI18nKey.ArchiveDescription),
    },
  ];
  if (route === ApplicationRoute.Prompts) {
    return [
      ...buttons,
      {
        id: ImportFileType.JSON,
        name: t(ImportI18nKey.DialCoreFiles),
        description: t(ImportI18nKey.JsonDescription),
      },
    ];
  } else if (route === ApplicationRoute.Files) {
    return [
      ...buttons,
      {
        id: ImportFileType.FILES,
        name: t(ImportI18nKey.SeparateFiles),
        description: t(ImportI18nKey.SeparateFilesDescription),
      },
    ];
  }
  return buttons;
};
