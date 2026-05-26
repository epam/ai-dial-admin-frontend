import { ReactNode } from 'react';

import { DialFile, DialUploadFileItem, GridOptions, GridSelectionMode } from '@epam/ai-dial-ui-kit';
import { ColDef, ITextFilterParams } from 'ag-grid-community';

import { bulkActionLabels } from '@/src/components/Assets/constants';
import { getGridActionLabels, getToolbarOptionLabels, getTreeActionLabels } from '@/src/components/Assets/utils';
import { baseColumnComparator } from '@/src/components/Grid/comparators/base-column-comparator';
import FloatingFilter from '@/src/components/Grid/FloatingFilter/FloatingFilter';
import { ROOT_FOLDER, TEMP_FOLDER } from '@/src/constants/file';
import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { CREATE_FOLDER_FORBIDDEN_CHARS, FILE_NAME_MAX_LENGTH } from './constants';
import { FORBIDDEN_NAME_SYMBOLS } from '@/src/constants/validation';

export const findFolderByPath = (items: DialFile[], targetPath: string): DialFile | undefined => {
  for (const item of items) {
    if (item.path === targetPath) {
      return item;
    }
    if (item.items?.length) {
      const found = findFolderByPath(item.items, targetPath);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
};

const assetEntityMap: Record<string, FileManagerI18nKey> = {
  [ApplicationRoute.AssetsApplications]: FileManagerI18nKey.Applications,
  [ApplicationRoute.AssetsToolsets]: FileManagerI18nKey.Toolsets,
  [ApplicationRoute.Prompts]: FileManagerI18nKey.Prompts,
  [ApplicationRoute.Files]: FileManagerI18nKey.Files,
  [ApplicationRoute.Conversations]: FileManagerI18nKey.Conversations,
};

export const getValidationMessages = (t: (key: string) => string) => {
  return { emptyName: t(FileManagerI18nKey.EnterFolderName), duplicateName: t(FileManagerI18nKey.NameExists) };
};

export const getDestinationFolderPopupOptions = (
  view: ApplicationRoute,
  t: (key: string, options?: Record<string, string | number> | undefined) => string,
) => ({
  emptyStateTitle: t(FileManagerI18nKey.EmptyMoveFolderTitle),
  emptyStateDescription: t(FileManagerI18nKey.EmptyMoveFolderDescription, {
    items: t(assetEntityMap[view]).toLowerCase(),
  }),
  getMoveHeader: (itemsCount: number, itemName?: string) =>
    itemsCount === 1 && itemName
      ? t(FileManagerI18nKey.MoveItem, { item: itemName })
      : t(FileManagerI18nKey.MoveItems, { count: itemsCount }),
});

export const createEmptyFile = () => {
  const fileType = 'text/plain';

  const emptyFile = new File(['1'], TEMP_FOLDER, {
    type: fileType,
  });
  return { emptyFile, fileName: TEMP_FOLDER, fileType };
};

export const getEmptyFile = () => {
  const { emptyFile, fileName } = createEmptyFile();

  const uploadFileItem: DialUploadFileItem = {
    fileContent: emptyFile,
    name: fileName,
  };

  return uploadFileItem;
};

export const isItemNameValid = (name: string): boolean => {
  return !FORBIDDEN_NAME_SYMBOLS.some((symbol) => name.includes(symbol));
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

export const getGridOptions = (
  view: ApplicationRoute,
  isReadOnlyAdmin: boolean,
  columnDefs: ColDef[],
  t: (key: string) => string,
  isSingleSelection?: boolean,
) =>
  ({
    alternateOddRowColors: true,
    columnDefs,
    selectionMode: isReadOnlyAdmin ? void 0 : isSingleSelection ? GridSelectionMode.SINGLE : GridSelectionMode.MULTIPLE,
    actionLabels: getActionLabels(getGridActionLabels(view, isReadOnlyAdmin), t),
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
  isReadOnlyAdmin: boolean,
  isFetchingFiles: boolean,
  loadedPaths: Set<string>,
  expandedPaths: Set<string>,
  view: ApplicationRoute,
  setExpanded: (paths: Set<string>) => void,
  t: (key: string) => string,
) => {
  return {
    collapsed: false,
    expandedPaths: expandedPaths,
    loadedPaths,
    loadingPaths: isFetchingFiles ? new Set<string>([ROOT_FOLDER]) : new Set<string>(),
    actionLabels: getActionLabels(getTreeActionLabels(isReadOnlyAdmin, view), t),
    onExpandedPathsChange: setExpanded,
    header: t(FileManagerI18nKey.FolderTree),
  };
};

export const getToolbarOptions = (route: ApplicationRoute, isReadOnlyAdmin: boolean, t: (key: string) => string) => ({
  showHiddenFilesToggle: false,
  newActions: getActionLabelsWithIcon(getToolbarOptionLabels(route, isReadOnlyAdmin), t),
  newButtonLabel: route === ApplicationRoute.Files ? t(ButtonsI18nKey.Add) : t(ButtonsI18nKey.Create),
});

export const getBulkActionsToolbarOptions = (view: ApplicationRoute, t: (key: string) => string) => {
  const actionLabels =
    view === ApplicationRoute.Conversations
      ? bulkActionLabels.filter((action) => action.key === 'delete')
      : bulkActionLabels;

  return {
    getSelectionLabel: (selectedCount: number) => `${selectedCount} ${t(FileManagerI18nKey.SelectedItems)}`,
    actionLabels: getActionLabels(actionLabels, t),
  };
};
