import { FoldersI18nKey } from '@/src/constants/i18n';
import { Step, StepStatus } from '@/src/models/step';

export enum CreateFolderSteps {
  FOLDER_SETUP = 'folderSetup',
  FILE_REVIEW = 'fileReview',
  PERMISSIONS = 'permissions',
}

export const CREATE_FOLDER_STEPS = (t: (stringToTranslate: string) => string): Step[] => [
  { id: CreateFolderSteps.FOLDER_SETUP, name: t(FoldersI18nKey.FolderSetup), status: StepStatus.INVALID },
  { id: CreateFolderSteps.FILE_REVIEW, name: t(FoldersI18nKey.FileReview), status: StepStatus.INVALID },
  { id: CreateFolderSteps.PERMISSIONS, name: t(FoldersI18nKey.Permissions), status: StepStatus.VALID },
];
