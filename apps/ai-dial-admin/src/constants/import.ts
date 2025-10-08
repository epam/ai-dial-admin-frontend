import { RadioButtonWithContent } from '@epam/ai-dial-ui-kit';

import { ImportI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { ConflictResolutionPolicy, ImportFileType, ImportSteps } from '@/src/types/import';
import { Step, StepStatus } from '@/src/models/step';
import { ApplicationRoute } from '@/src/types/routes';

export const IMPORT_RESOLUTIONS = (
  t: (stringToTranslate: string) => string,
  importType?: string,
): RadioButtonWithContent[] => {
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
  { id: ImportSteps.FILES, name: t(ImportI18nKey.Files), status: StepStatus.INVALID },
  { id: ImportSteps.PROPERTIES, name: t(TabsI18nKey.Properties), status: StepStatus.INVALID },
];

export const IMPORT_CONFIG_STEPS = (t: (stringToTranslate: string) => string): Step[] => [
  { id: ImportSteps.FILES, name: t(ImportI18nKey.Files), status: StepStatus.INVALID },
  { id: ImportSteps.CONFIGURATION, name: t(ImportI18nKey.Configuration), status: StepStatus.INVALID },
];

export const IMPORT_FILE_TYPES = (
  t: (stringToTranslate: string) => string,
  route?: ApplicationRoute,
): RadioButtonWithContent[] => {
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
