import { ImageVersion } from '@/src/models/deployments/images';
import { AssetApp, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { compareVersions, modifyNameVersionInPrompt } from '@/src/utils/prompts/versions';
import { baseColumnComparator } from '@/src/components/Grid/comparators/base-column-comparator';
import FloatingFilter from '@/src/components/Grid/FloatingFilter/FloatingFilter';
import { GridOptions, GridSelectionMode } from '@epam/ai-dial-ui-kit';
import { ColDef, ITextFilterParams } from 'ag-grid-community';
import { ReactNode } from 'react';
import { ActionLabel, ActionLabelWithIcon } from './types';
import { ApplicationRoute } from '@/src/types/routes';
import {
  bulkActionLabels,
  gridActionLabelsFiles,
  gridActionLabelsPrompts,
  gridActionLabelsReadOnlyFiles,
  gridActionLabelsReadOnlyPrompts,
  toolbarOptionLabelsFiles,
  toolbarOptionLabelsPrompts,
  treeActionLabels,
  treeActionLabelsReadOnly,
} from './constants';
import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { ROOT_FOLDER } from '@/src/constants/file';

export const filterLatestVersions = (data: AssetWithVersion[]) => {
  const latestVersions: Record<string, AssetWithVersion> = {};

  data?.forEach((item) => {
    const name = item.name as string;
    if (!latestVersions[name] || compareVersions(item.version, latestVersions[name].version) > 0) {
      latestVersions[name] = item as AssetWithVersion;
    }
  });

  return Object.values(latestVersions);
};

export const getVersionsPerName = (data: AssetWithVersion[] | ImageVersion[]) => {
  const versionsPerName: Record<string, string[]> = {};

  data.forEach((item) => {
    const name = item.name as string;

    if (!versionsPerName[name]) {
      versionsPerName[name] = [];
    }
    versionsPerName[name].push(item.version);
  });

  Object.keys(versionsPerName).forEach((key) => {
    versionsPerName[key] = versionsPerName[key].sort(compareVersions);
  });

  return versionsPerName;
};

export const getIsNeedToMove = (entity: AssetWithVersion, initialEntity?: AssetWithVersion) => {
  return entity.folderId !== initialEntity?.folderId;
};

export const getEntityForUpdate = (entity: AssetWithVersion, initialEntity?: AssetWithVersion) => {
  return {
    ...entity,
    folderId: (initialEntity as AssetWithVersion)?.folderId,
  };
};

export const addNewVersion = (entity: AssetWithVersion, version: string) => {
  const path = modifyNameVersionInPrompt(entity.path, void 0, version);
  delete (entity as AssetApp).reference;
  return {
    ...entity,
    path,
    version,
  };
};

export const getParentPathByFullPath = (fullPath: string) => {
  let normalized = fullPath.endsWith('/') && fullPath !== '/' ? fullPath.slice(0, -1) : fullPath;
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === -1) return '';

  return normalized.slice(0, lastSlash + 1);
};

const getGridActionLabels = (view: ApplicationRoute, isReadOnlyAdmin: boolean, t: (key: string) => string) => {
  let actionLabels: ActionLabel[] = [];
  switch (view) {
    case ApplicationRoute.Files:
      actionLabels = isReadOnlyAdmin ? gridActionLabelsReadOnlyFiles : gridActionLabelsFiles;
      break;
    case ApplicationRoute.Prompts:
      actionLabels = isReadOnlyAdmin ? gridActionLabelsReadOnlyPrompts : gridActionLabelsPrompts;
      break;
    default:
      actionLabels = [];
  }

  return actionLabels.reduce((acc: { [key: string]: string }, item) => {
    acc[item.key] = t(item.label);
    return acc;
  }, {});
};

const getTreeActionLabels = (isReadOnlyAdmin: boolean, t: (key: string) => string) => {
  const actionLabels = isReadOnlyAdmin ? treeActionLabelsReadOnly : treeActionLabels;

  return actionLabels.reduce((acc: { [key: string]: string }, item) => {
    acc[item.key] = t(item.label);
    return acc;
  }, {});
};

const getToolbarOptionLabels = (view: ApplicationRoute, isReadOnlyAdmin: boolean, t: (key: string) => string) => {
  let actionLabels: ActionLabelWithIcon[] = [];
  switch (view) {
    case ApplicationRoute.Files:
      actionLabels = isReadOnlyAdmin ? [] : toolbarOptionLabelsFiles;
      break;
    case ApplicationRoute.Prompts:
      actionLabels = isReadOnlyAdmin ? [] : toolbarOptionLabelsPrompts;
      break;
    default:
      actionLabels = [];
  }

  return actionLabels.reduce((acc: { [key: string]: { label?: ReactNode; icon?: ReactNode } }, item) => {
    acc[item.key] = { label: t(item.label), icon: item.icon };
    return acc;
  }, {});
};

const getBulkActionLabels = (t: (key: string) => string) => {
  return bulkActionLabels.reduce((acc: { [key: string]: string }, item) => {
    acc[item.key] = t(item.label);
    return acc;
  }, {});
};

export const getGridOptions = (
  view: ApplicationRoute,
  isReadOnlyAdmin: boolean,
  columnDefs: ColDef[],
  t: (key: string) => string,
) =>
  ({
    alternateOddRowColors: true,
    columnDefs,
    selectionMode: GridSelectionMode.MULTIPLE,
    actionLabels: getGridActionLabels(view, isReadOnlyAdmin, t),
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
  setExpanded: (paths: Set<string>) => void,
  t: (key: string) => string,
) => {
  return {
    collapsed: false,
    expandedPaths: expandedPaths,
    loadedPaths,
    loadingPaths: isFetchingFiles ? new Set<string>([ROOT_FOLDER]) : new Set<string>(),
    actionLabels: getTreeActionLabels(isReadOnlyAdmin, t),
    onExpandedPathsChange: setExpanded,
    header: t(FileManagerI18nKey.FolderTree),
  };
};

export const getToolbarOptions = (route: ApplicationRoute, isReadOnlyAdmin: boolean, t: (key: string) => string) => ({
  showHiddenFilesToggle: false,
  newActions: getToolbarOptionLabels(route, isReadOnlyAdmin, t),
  newButtonLabel: route === ApplicationRoute.Files ? t(ButtonsI18nKey.Add) : t(ButtonsI18nKey.Create),
});

export const getBulkActionsToolbarOptions = (t: (key: string) => string) => ({
  getSelectionLabel: (selectedCount: number) => `${selectedCount} ${t(FileManagerI18nKey.SelectedItems)}`,
  actionLabels: getBulkActionLabels(t),
});
