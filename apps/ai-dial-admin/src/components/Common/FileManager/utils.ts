import { DialUploadFileItem, GridSelectionMode } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';

import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { ROOT_FOLDER } from '@/src/constants/file';
import { ReactNode } from 'react';
import { CREATE_FOLDER_FORBIDDEN_CHARS } from './constants';

const gridActionLabels = [
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

const treeActionLabels = [
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

const toolbarOptionLabels = [
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

const bulkActionLabels = [
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

export const getValidationMessages = (t: (key: string) => string) => {
  return { emptyName: t(FileManagerI18nKey.EnterFolderName), duplicateName: t(FileManagerI18nKey.NameExists) };
};

export const getGridOptions = (columnDefs: ColDef[], t: (key: string) => string) => ({
  alternateOddRowColors: true,
  columnDefs,
  selectionMode: GridSelectionMode.MULTIPLE,
  actionLabels: getActionLabels(gridActionLabels, t),
});

export const getTreeOptions = (isFetchingFiles: boolean, loadedPaths: Set<string>, t: (key: string) => string) => ({
  collapsed: false,
  expandedPaths: new Set<string>([`${ROOT_FOLDER}/`]),
  loadedPaths,
  loadingPaths: isFetchingFiles ? new Set<string>([ROOT_FOLDER]) : new Set<string>(),
  actionLabels: getActionLabels(treeActionLabels, t),
});

export const getToolbarOptions = (t: (key: string) => string) => ({
  showHiddenFilesToggle: false,
  newActions: getActionLabelsWithIcon(toolbarOptionLabels, t),
  newButtonLabel: t(ButtonsI18nKey.Create),
});

export const getBulkActionsToolbarOptions = (t: (key: string) => string) => ({
  getSelectionLabel: (selectedCount: number) => `${selectedCount} ${t(FileManagerI18nKey.SelectedItems)}`,
  actionLabels: getActionLabels(bulkActionLabels, t),
});

const getActionLabels = (actionLabels: { key: string; label: string }[], t: (key: string) => string) => {
  return actionLabels.reduce((acc: { [key: string]: string }, item) => {
    acc[item.key] = t(item.label);
    return acc;
  }, {});
};

const getActionLabelsWithIcon = (
  actionLabels: { key: string; label: string; icon: ReactNode }[],
  t: (key: string) => string,
) => {
  return actionLabels.reduce((acc: { [key: string]: { label?: ReactNode; icon?: ReactNode } }, item) => {
    acc[item.key] = { label: t(item.label), icon: item.icon };
    return acc;
  }, {});
};

export const createEmptyFile = () => {
  const fileName = '.dial_folder';
  const fileType = 'text/plain';

  const emptyFile = new File(['1'], fileName, {
    type: fileType,
  });
  return { emptyFile, fileName, fileType };
};

export const getEmptyFile = () => {
  const { emptyFile, fileName } = createEmptyFile();

  const uploadFileItem: DialUploadFileItem = {
    fileContent: emptyFile,
    name: fileName,
  };

  return uploadFileItem;
};

export const validateCreateFolder = (name: string, t: (key: string) => string): string | null => {
  if (CREATE_FOLDER_FORBIDDEN_CHARS.test(name)) {
    return t(FileManagerI18nKey.CreateFolderValidate);
  }
  return null;
};
