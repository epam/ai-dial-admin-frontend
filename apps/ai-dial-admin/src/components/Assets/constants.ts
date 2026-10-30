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

/** Folder-row actions on the Skills and Projects lists; rename and move have no Core-backed support there. */
export const SKILL_PROJECT_FOLDER_ACTIONS: ReadonlySet<string> = new Set([
  'addSibling',
  'addChild',
  'managePermissions',
  'delete',
]);

/** The grid serves one label set for every row, so item rows' `openInNewTab` rides along with the folder actions. */
export const SKILL_PROJECT_ROW_ACTIONS: ReadonlySet<string> = new Set([
  ...SKILL_PROJECT_FOLDER_ACTIONS,
  'openInNewTab',
]);

export const baseToolbarOptionLabels = [
  {
    key: 'newFolder',
    label: FileManagerI18nKey.Folder,
    icon: null,
  },
];

export const bulkActionLabels = [
  { key: 'move', label: ActionMenuOperationI18nKey.Move_to },
  { key: 'download', label: ActionMenuOperationI18nKey.Export },
  { key: 'delete', label: ActionMenuOperationI18nKey.Delete },
];
