import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';

export const CREATE_FOLDER_FORBIDDEN_CHARS = /[<>:"/\\|?*]/;
export const NEW_FOLDER_NAME = 'New Folder';
export const FILE_NAME_MAX_LENGTH = 160;

export const treeActionLabels = [
  { key: 'addSibling', label: FileManagerI18nKey.AddSibling },
  { key: 'addChild', label: FileManagerI18nKey.AddChild },
  { key: 'move', label: FileManagerI18nKey.Move },
  { key: 'download', label: ButtonsI18nKey.Export },
  { key: 'delete', label: ButtonsI18nKey.Delete },
  { key: 'rename', label: FileManagerI18nKey.Rename },
  { key: 'managePermissions', label: FileManagerI18nKey.ManagePermissions },
];

export const treeActionLabelsReadOnly = [{ key: 'download', label: ButtonsI18nKey.Export }];
