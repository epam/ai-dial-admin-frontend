import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { NAME_COLUMN, SIZE_COLUMN, UPDATED_AT_COLUMN } from '@epam/ai-dial-ui-kit';

export const FILES_GRID_COLUMNS = [NAME_COLUMN('Display name'), UPDATED_AT_COLUMN('Updated time'), SIZE_COLUMN('Size')];

export const BulkActionLabels = [
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

export const ToolbarOptionLabels = [
  {
    key: 'newFolder',
    label: FileManagerI18nKey.Folder,
    icon: null,
  },
  {
    key: 'uploadFiles',
    label: FileManagerI18nKey.File,
    icon: null,
  },
];

export const TreeActionLabels = [
  {
    key: 'addSibling',
    label: FileManagerI18nKey.AddSibling,
  },
  {
    key: 'addChild',
    label: FileManagerI18nKey.AddChild,
  },
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
  {
    key: 'rename',
    label: FileManagerI18nKey.Rename,
  },
  {
    key: 'managePermissions',
    label: FileManagerI18nKey.ManagePermissions,
  },
];

export const GridActionLabels = [
  {
    key: 'addSibling',
    label: FileManagerI18nKey.AddSibling,
  },
  {
    key: 'addChild',
    label: FileManagerI18nKey.AddChild,
  },
  {
    key: 'move',
    label: FileManagerI18nKey.Move,
  },
  {
    key: 'download',
    label: ButtonsI18nKey.Export,
  },
  {
    key: 'managePermissions',
    label: FileManagerI18nKey.ManagePermissions,
  },
  {
    key: 'rename',
    label: FileManagerI18nKey.Rename,
  },
  {
    key: 'delete',
    label: ButtonsI18nKey.Delete,
  },
];
