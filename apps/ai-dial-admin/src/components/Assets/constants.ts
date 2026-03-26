import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';

export const allActionLabels = [
  { key: 'addSibling', label: FileManagerI18nKey.AddSibling },
  { key: 'addChild', label: FileManagerI18nKey.AddChild },
  { key: 'duplicate', label: ButtonsI18nKey.Duplicate },
  { key: 'move', label: FileManagerI18nKey.Move },
  { key: 'download', label: ButtonsI18nKey.Export },
  { key: 'managePermissions', label: FileManagerI18nKey.ManagePermissions },
  { key: 'rename', label: FileManagerI18nKey.Rename },
  { key: 'delete', label: ButtonsI18nKey.Delete },
  { key: 'preview', label: FileManagerI18nKey.Preview },
];

export const allToolbarOptionLabels = [
  {
    key: 'newFolder',
    label: FileManagerI18nKey.Folder,
    icon: null,
  },
  {
    key: 'newItem',
    label: FileManagerI18nKey.Prompt,
    icon: null,
  },
  {
    key: 'uploadFiles',
    label: FileManagerI18nKey.Files,
    icon: null,
  },
];

export const bulkActionLabels = [
  { key: 'move', label: FileManagerI18nKey.Move },
  { key: 'download', label: ButtonsI18nKey.Export },
  { key: 'delete', label: ButtonsI18nKey.Delete },
];
