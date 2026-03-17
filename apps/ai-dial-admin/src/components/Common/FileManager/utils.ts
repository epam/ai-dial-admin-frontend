import { ReactNode } from 'react';

import { DialUploadFileItem, GridSelectionMode } from '@epam/ai-dial-ui-kit';
import { ColDef, ITextFilterParams } from 'ag-grid-community';

import FloatingFilter from '@/src/components/Grid/FloatingFilter/FloatingFilter';
import { baseColumnComparator } from '@/src/components/Grid/comparators/base-column-comparator';
import { ROOT_FOLDER } from '@/src/constants/file';
import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { CREATE_FOLDER_FORBIDDEN_CHARS, FILE_NAME_MAX_LENGTH } from './constants';
import { GridOptions } from '@epam/ai-dial-ui-kit/dist/src/components/FileManager/FileManager';

const gridActionLabels = [
  { key: 'addSibling', label: FileManagerI18nKey.AddSibling },
  { key: 'addChild', label: FileManagerI18nKey.AddChild },
  { key: 'move', label: FileManagerI18nKey.Move },
  { key: 'download', label: ButtonsI18nKey.Export },
  { key: 'managePermissions', label: FileManagerI18nKey.ManagePermissions },
  { key: 'rename', label: FileManagerI18nKey.Rename },
  { key: 'delete', label: ButtonsI18nKey.Delete },
  { key: 'preview', label: FileManagerI18nKey.Preview },
];

const gridActionLabelsReadOnly = [
  { key: 'download', label: ButtonsI18nKey.Export },
  { key: 'preview', label: FileManagerI18nKey.Preview },
];

const treeActionLabels = [
  { key: 'addSibling', label: FileManagerI18nKey.AddSibling },
  { key: 'addChild', label: FileManagerI18nKey.AddChild },
  { key: 'move', label: FileManagerI18nKey.Move },
  { key: 'download', label: ButtonsI18nKey.Export },
  { key: 'delete', label: ButtonsI18nKey.Delete },
  { key: 'rename', label: FileManagerI18nKey.Rename },
  { key: 'managePermissions', label: FileManagerI18nKey.ManagePermissions },
];

const treeActionLabelsReadOnly = [{ key: 'download', label: ButtonsI18nKey.Export }];

const toolbarOptionLabels = [
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

export const getGridOptions = (
  columnDefs: ColDef[],
  t: (key: string) => string,
  isReadOnlyAdmin?: boolean,
) =>
  ({
    alternateOddRowColors: true,
    columnDefs,
    selectionMode: GridSelectionMode.MULTIPLE,
    actionLabels: getActionLabels(isReadOnlyAdmin ? gridActionLabelsReadOnly : gridActionLabels, t),
    additionalGridOptions: {
      defaultColDef: {
        minWidth: 150,
        floatingFilter: true,
        floatingFilterComponent: FloatingFilter,
        resizable: true,
        flex: 1,
        filter: 'agTextColumnFilter',
        filterParams: {
          filterPlaceholder: 'Enter value',
          buttons: ['reset'],
        } as ITextFilterParams,
        comparator: baseColumnComparator.bind(this),
      },
    },
  }) as GridOptions;

export const getTreeOptions = (
  isFetchingFiles: boolean,
  loadedPaths: Set<string>,
  expandedPaths: Set<string>,
  setExpanded: (paths: Set<string>) => void,
  t: (key: string) => string,
  isReadOnlyAdmin?: boolean,
) => {
  const labels = isReadOnlyAdmin ? treeActionLabelsReadOnly : treeActionLabels;
  return {
    collapsed: false,
    expandedPaths: expandedPaths,
    loadedPaths,
    loadingPaths: isFetchingFiles ? new Set<string>([ROOT_FOLDER]) : new Set<string>(),
    actionLabels: getActionLabels(labels, t),
    onExpandedPathsChange: setExpanded,
    header: t(FileManagerI18nKey.FolderTree),
  };
};

export const getToolbarOptions = (t: (key: string) => string) => ({
  showHiddenFilesToggle: false,
  newActions: getActionLabelsWithIcon(toolbarOptionLabels, t),
  newButtonLabel: t(ButtonsI18nKey.Add),
});

export const getBulkActionsToolbarOptions = (t: (key: string) => string) => ({
  getSelectionLabel: (selectedCount: number) => `${selectedCount} ${t(FileManagerI18nKey.SelectedItems)}`,
  actionLabels: getActionLabels(bulkActionLabels, t),
});

export const getDestinationFolderPopupOptions = (
  t: (key: string, options?: Record<string, string | number> | undefined) => string,
) => ({
  getMoveHeader: (itemsCount: number, itemName?: string) =>
    itemsCount === 1 && itemName
      ? t(FileManagerI18nKey.MoveItem, { item: itemName })
      : t(FileManagerI18nKey.MoveItems, { count: itemsCount }),
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

export const validateCreateFolder = (
  name: string,
  t: (key: string, options?: Record<string, string | number>) => string,
): string | null => {
  if (CREATE_FOLDER_FORBIDDEN_CHARS.test(name)) {
    return t(FileManagerI18nKey.CreateFolderValidate);
  } else if (name.startsWith('.')) {
    return t(FileManagerI18nKey.CreateFolderValidateFirstSymbol);
  } else if (name.length > FILE_NAME_MAX_LENGTH) {
    return t(FileManagerI18nKey.CreateFolderValidateNameLength, { length: FILE_NAME_MAX_LENGTH });
  }

  return null;
};
