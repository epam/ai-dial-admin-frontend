import { ActionMenuOperationI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';

export const allActionLabels = [
  { key: 'addSibling', label: ActionMenuOperationI18nKey.Add_sibling },
  { key: 'addChild', label: ActionMenuOperationI18nKey.Add_child },
  { key: 'duplicate', label: ActionMenuOperationI18nKey.Duplicate },
  { key: 'move', label: ActionMenuOperationI18nKey.Move_to },
  { key: 'download', label: ActionMenuOperationI18nKey.Export },
  { key: 'managePermissions', label: ActionMenuOperationI18nKey.Manage_folder },
  { key: 'rename', label: ActionMenuOperationI18nKey.Rename },
  { key: 'delete', label: ActionMenuOperationI18nKey.Delete },
  { key: 'preview', label: ActionMenuOperationI18nKey.Preview },
  { key: 'openInNewTab', label: ActionMenuOperationI18nKey.Open_in_new_tab },
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
  { key: 'move', label: ActionMenuOperationI18nKey.Move_to },
  { key: 'download', label: ActionMenuOperationI18nKey.Export },
  { key: 'delete', label: ActionMenuOperationI18nKey.Delete },
];
