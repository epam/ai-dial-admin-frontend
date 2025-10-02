import { Step, StepStatus } from '@epam/ai-dial-ui-kit';

import { FoldersI18nKey } from '@/src/constants/i18n';

export enum CreateFolderSteps {
  FOLDER_SETUP = 'folderSetup',
  FILE_REVIEW = 'fileReview',
  PERMISSIONS = 'permissions',
}

export const CREATE_FOLDER_STEPS = (t: (stringToTranslate: string) => string): Step[] => [
  { id: CreateFolderSteps.FOLDER_SETUP, name: t(FoldersI18nKey.FolderSetup) },
  { id: CreateFolderSteps.FILE_REVIEW, name: t(FoldersI18nKey.FileReview) },
  { id: CreateFolderSteps.PERMISSIONS, name: t(FoldersI18nKey.Permissions), status: StepStatus.VALID },
];
