import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { NAME_COLUMN, SIZE_COLUMN, UPDATED_AT_COLUMN } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';

export const FILES_GRID_COLUMNS: ColDef[] = [
  NAME_COLUMN('Display name') as ColDef,
  UPDATED_AT_COLUMN('Updated time') as ColDef,
  SIZE_COLUMN('Size') as ColDef,
];

export const gridActionLabels = [
  { key: 'addSibling', label: FileManagerI18nKey.AddSibling },
  { key: 'addChild', label: FileManagerI18nKey.AddChild },
  { key: 'move', label: FileManagerI18nKey.Move },
  { key: 'download', label: ButtonsI18nKey.Export },
  { key: 'managePermissions', label: FileManagerI18nKey.ManagePermissions },
  { key: 'rename', label: FileManagerI18nKey.Rename },
  { key: 'delete', label: ButtonsI18nKey.Delete },
  { key: 'preview', label: FileManagerI18nKey.Preview },
];

export const gridActionLabelsReadOnly = [
  { key: 'download', label: ButtonsI18nKey.Export },
  { key: 'preview', label: FileManagerI18nKey.Preview },
];

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

export const toolbarOptionLabels = [
  {
    key: 'newFolder',
    label: FileManagerI18nKey.Folder,
    icon: null,
  },
  {
    key: 'uploadFiles',
    label: FileManagerI18nKey.Files,
    icon: null,
  },
];

export const bulkActionLabels = [
  {
    key: 'move',
    label: FileManagerI18nKey.Move,
  },
  {
    key: 'download',
    label: ButtonsI18nKey.Export,
  },
  {
    key: 'delete',
    label: ButtonsI18nKey.Delete,
  },
];
