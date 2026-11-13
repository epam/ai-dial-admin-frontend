'use client';

import classNames from 'classnames';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
  DialCopiedItem,
  DialDeletedItem,
  DialFile,
  DialFileManager,
  DialFileManagerActions,
  DialFileNodeType,
  DialRootFolder,
  DialUploadFileItem,
  FileManagerColumnKey,
  FileManagerGridRow,
} from '@epam/ai-dial-react-file-manager';
import { ColDef, GridApi, GridColumnsChangedEvent } from 'ag-grid-community';

import {
  getDeleteNotificationContent,
  getMoveNotificationContent,
  getParentPathByFullPath,
} from '@/src/components/Assets/utils';
import { UnitFolderRole, getUnitFolderRole, isUnitFolder } from '@/src/utils/org-units/units';
import { useGridStatePersistence } from '@/src/components/Grid/hooks/use-grid-state-persistence';
import ResetFiltersButton from '@/src/components/ListView/Header/ResetFiltersButton';
import { getImportTitle } from '@/src/components/EntityListView/HeaderButtons/utils';
import { getImportResults } from '@/src/components/EntityListView/Import/utils';
import { FILE_PREVIEW, PREVIEW_EXTENSIONS, ROOT_FOLDER } from '@/src/constants/file';
import { FileManagerI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { getRouteNamespace } from '@/src/utils/org-units/namespaces';
import { useNotification } from '@/src/context/NotificationContext';
import UnitFolderIcon from '@/src/components/Common/UnitFolderIcon/UnitFolderIcon';
import { useOrgUnits } from '@/src/context/OrgUnitsContext';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useFileManagerExpansion } from '@/src/hooks/use-file-manager-expansion';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ImportResult } from '@/src/models/import';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getFolderName } from '@/src/utils/files/folder';
import { shouldRestoreFolderHierarchy } from '@/src/utils/files/folder-hierarchy';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { addTrailingSlash } from '@/src/utils/url';
import MoveItemsModal from './MoveItemsModal';
import { FILE_MANAGER_GRID_PERSISTENCE, MAX_FOLDER_NESTING_DEPTH, MOVE_ITEMS_INDICATOR_DELAY } from './constants';
import { useShowHiddenFiles } from './use-show-hidden-files';
import {
  getBulkActionsToolbarOptions,
  getDestinationFolderPopupOptions,
  getForbiddenSymbolsRegExp,
  getGridOptions,
  getToolbarOptions,
  isHiddenFilesToggleSupported,
  getTreeOptions,
  getValidationMessages,
  validateCreateFolder,
} from './utils';

interface Props {
  view: ApplicationRoute;
  /** The folder tree's title; omit it where the page already shows its own. */
  label?: string;
  columnDefs: ColDef[];
  getContext: () => AssetsFolderContextReader<AssetListItem>;
  onCreateFolder?: (
    file: DialUploadFileItem | undefined,
    folderPath: string,
  ) => Promise<ServerActionResponse | undefined>;
  onDeleteItems?: (fileNodes: DialDeletedItem[]) => Promise<(ServerActionResponse[] | ServerActionResponse)[]>;
  onMoveItems?: (
    items: DialCopiedItem[],
    sourceFolder: string,
    destinationFolder: string,
  ) => Promise<(ServerActionResponse[] | ServerActionResponse)[]>;
  customUploadFileAction?: (currentPath?: string, currentFolder?: DialFile, preselectedItems?: File[]) => void;
  onExport?: (files: DialFile[]) => Promise<void>;
  onOpenInNewTab?: (file: DialFile) => void;
  customCreateNewItemAction?: (currentPath?: string, currentFolder?: DialFile) => void;
  customDuplicateAction?: (items?: DialFile[]) => void;
  customDeleteItemsAction?: (items: DialFile[], parentFolderPath: string) => void;
  customDownloadItemsAction?: (items?: DialFile[]) => void;
  onTableFileClick?: (item: FileManagerGridRow) => void;
  filterData?: (data: AssetWithVersion[]) => AssetWithVersion[];
  nonClickableTableColumns?: FileManagerColumnKey[];
  onPathChange?: (nextPath?: string) => void;
  onSelectedPathsChange?: (paths: Set<string>) => void;
  selectedPaths?: Set<string>;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  showHiddenFileSwitcherInDestinationPopup?: boolean;
  movingItems?: number;
  movedItems?: number;
  folderToRefetch?: string | null;
}

const ROOT_PATH = `${ROOT_FOLDER}/`;

const UNIT_PROTECTED_ACTIONS = new Set([
  DialFileManagerActions.Move,
  DialFileManagerActions.Rename,
  DialFileManagerActions.Delete,
]);

const FileManager: FC<Props> = ({
  label,
  columnDefs,
  view,
  getContext,
  onCreateFolder,
  onDeleteItems,
  onMoveItems,
  onExport,
  filterData,
  onPathChange,
  customUploadFileAction,
  movingItems,
  movedItems,
  folderToRefetch,
  ...props
}) => {
  const [loadedPaths, setLoadedPaths] = useState(new Set(['']));

  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { isUnitMode, canWriteAt } = useAppContext();
  const { showNotification } = useNotification();
  const { units, ensureUnits } = useOrgUnits();
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const folderContext = getContext();
  const {
    files,
    fetchFiles,
    fetchFolderHierarchy,
    isFetchingFiles,
    filePath,
    setFilePath,
    expandedFolders,
    setExpandedFolders,
    fetchedFoldersData,
  } = folderContext;
  const { onExpandedPathsChange, onFetchFolder } = useFileManagerExpansion(folderContext);
  const treeLoadedPaths = useMemo(
    () => new Set([...loadedPaths, ...Object.keys(fetchedFoldersData ?? {})]),
    [loadedPaths, fetchedFoldersData],
  );
  // In unit mode the unit owning the open folder decides; a view with no unit namespace stays read-only.
  const namespace = getRouteNamespace(view);
  const isReadOnly = isReadOnlyAdmin || (isUnitMode && (namespace == null || !canWriteAt(namespace, filePath ?? '')));
  const [gridApi, setGridApi] = useState<GridApi>();
  const [isShowHiddenFiles, onShowHiddenFilesChange] = useShowHiddenFiles(view);
  const isHiddenFilesToggleVisible = isHiddenFilesToggleSupported(view);
  const {
    columnDefs: persistedColumnDefs,
    reapplyState,
    onFilterChanged,
    onSortChanged,
    onColumnMoved,
    onColumnVisible,
    onColumnResized,
  } = useGridStatePersistence({ storageKey: view, columnDefs, gridApi, ...FILE_MANAGER_GRID_PERSISTENCE });

  // A filter typed in one folder would hide the contents of the next one, whichever way the user got there.
  useEffect(() => {
    if (Object.keys(gridApi?.getFilterModel() ?? {}).length > 0) {
      gridApi?.setFilterModel(null);
    }
    // Only a path change clears; a grid that appears later has nothing to clear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath]);

  useEffect(() => {
    ensureUnits();
  }, [ensureUnits]);

  useEffect(() => {
    if (!folderToRefetch) {
      return;
    }

    const normalizedFolderPath = folderToRefetch.replaceAll('//', '/');
    setLoadedPaths((prev) => {
      const newLoadedPaths = new Set<string>();

      prev.forEach((path) => {
        const normalizedPath = path.replaceAll('//', '/');
        if (
          normalizedPath === normalizedFolderPath ||
          normalizedPath === `${normalizedFolderPath}/` ||
          !normalizedPath.includes(normalizedFolderPath)
        ) {
          newLoadedPaths.add(path);
        }
      });

      return newLoadedPaths;
    });
  }, [folderToRefetch]);

  useEffect(() => {
    if (files == null || files?.length === 0) {
      // A selection that outlived the tree (back from a details page) needs its chain, not just the root.
      if (fetchFolderHierarchy && shouldRestoreFolderHierarchy(filePath, fetchedFoldersData)) {
        fetchFolderHierarchy(filePath, true);
      } else {
        fetchFiles(ROOT_PATH);
      }
      setLoadedPaths(new Set([ROOT_PATH]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // Conversations have no folder concept for their rows — the row context menu and bulk toolbar already hide
  // "Move to" for them (`Assets/utils.ts`, `FileManager/utils.ts`), but `onMoveToFiles` also drives
  // drag-and-drop independently of those menus, so it must be withheld here too rather than left to resolve
  // as a silent no-op with a false success toast (`handleMoveToFiles` reports success on an empty promise list).
  const isMoveSupported = view !== ApplicationRoute.Conversations;
  const hasUnits = Object.keys(units).length > 0;
  const getUnitIcon = useCallback(
    (file: DialFile) =>
      hasUnits && file.nodeType === DialFileNodeType.FOLDER && isUnitFolder(units, file.path) ? (
        <UnitFolderIcon />
      ) : undefined,
    [hasUnits, units],
  );

  const getItemActionRestriction = useCallback(
    (file: DialFile, action: DialFileManagerActions) => {
      if (!hasUnits || file.nodeType !== DialFileNodeType.FOLDER) {
        return undefined;
      }
      const role = getUnitFolderRole(units, file.path);
      if (action === DialFileManagerActions.Download) {
        return role === UnitFolderRole.UNIT ? t(FoldersI18nKey.UnitFolderExportRestriction) : undefined;
      }
      if (!UNIT_PROTECTED_ACTIONS.has(action)) {
        return undefined;
      }
      if (role === UnitFolderRole.UNIT) {
        return t(FoldersI18nKey.UnitFolderRestriction);
      }
      return role === UnitFolderRole.CONTAINS_UNIT ? t(FoldersI18nKey.ContainsUnitRestriction) : undefined;
    },
    [hasUnits, units, t],
  );
  const filteredFiles = useMemo(() => {
    return filterData ? filterData(files as AssetWithVersion[]) : files;
  }, [files, filterData]);

  const scrollToNewFolder = useCallback(() => {
    let attempts = 0;
    const maxAttempts = 20;
    const scrollInterval = setInterval(() => {
      const selectedElement = document.querySelector('[aria-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        clearInterval(scrollInterval);
      } else if (attempts >= maxAttempts) {
        clearInterval(scrollInterval);
      }
      attempts++;
    }, 100);
  }, []);

  // TODO: move common functions into context files

  /**
   * `isOpenCreatedFolder` is false for the move-destination popup: its own `DialFileManager` reads
   * the same items, so the refetch is what makes the new folder appear there — but navigating the
   * list underneath an open modal is not wanted.
   */
  const createFolder = useCallback(
    async (_: DialUploadFileItem | undefined, folderPath: string, isOpenCreatedFolder: boolean) => {
      const newPath = `${folderPath.replaceAll('//', '/')}/`;

      // Awaited, not fire-and-forget: ui-kit awaits this before tearing down the inline editor, so
      // dropping the promise made every create look instantly successful — including the ones Core
      // rejected.
      await onCreateFolder?.(_, folderPath).then((res) => {
        if (res && res.success) {
          const parentPath = getParentPathByFullPath(newPath) || ROOT_PATH;

          fetchFiles(parentPath);
          setLoadedPaths((prev) => new Set(prev).add(newPath));

          const results = (res.response as { importResults: ImportResult[] }).importResults;
          const translatedType = t(getImportTitle(view)).toLowerCase();
          showNotification(
            getSuccessNotification(
              t(FileManagerI18nKey.CreateFolderSuccessTitle),
              t(FileManagerI18nKey.CreateFolderSuccessDescription),
            ),
          );
          getImportResults(results, getFolderName(filePath) as string, translatedType, t);

          if (isOpenCreatedFolder) {
            setExpandedFolders(new Set(expandedFolders.add(parentPath).add(newPath)));
            setFilePath(newPath);
            scrollToNewFolder();
          }
        }
      });
    },
    [
      onCreateFolder,
      expandedFolders,
      fetchFiles,
      filePath,
      scrollToNewFolder,
      setExpandedFolders,
      setFilePath,
      showNotification,
      t,
      view,
    ],
  );

  const handleCreateFolder = useCallback(
    (file: DialUploadFileItem | undefined, folderPath: string) => createFolder(file, folderPath, true),
    [createFolder],
  );

  const handleDestinationFolderCreate = useCallback(
    (file: DialUploadFileItem | undefined, folderPath: string) => createFolder(file, folderPath, false),
    [createFolder],
  );

  // The breadcrumb reports `public/folder` (segments joined with no trailing slash), while the tree, the
  // expanded set and the fetched-folder cache are all keyed `public/folder/`.
  const onPathChangeNormalized = useCallback(
    (rawPath: string | undefined) => {
      if (!rawPath) {
        return;
      }
      const nextPath = addTrailingSlash(rawPath);
      const newExpanded = new Set(expandedFolders);

      if (newExpanded.has(nextPath)) {
        newExpanded.delete(nextPath);
      } else {
        newExpanded.add(nextPath);
      }
      if (!loadedPaths.has(nextPath)) {
        onFetchFolder(nextPath);
      }
      setFilePath(nextPath);
      setLoadedPaths((prev) => new Set(prev).add(nextPath));
      setExpandedFolders(newExpanded);
      onPathChange?.(nextPath);
    },
    [expandedFolders, onFetchFolder, loadedPaths, setExpandedFolders, setFilePath, onPathChange],
  );

  const handleFolderPopupPathChange = useCallback(
    (nextPath: string | undefined) => {
      if (!nextPath) return;

      const normalizedPath = nextPath.endsWith('/') ? nextPath : `${nextPath}/`;
      if (normalizedPath && !loadedPaths.has(normalizedPath)) {
        setLoadedPaths((prev) => new Set(prev).add(normalizedPath));
        fetchFiles(normalizedPath);
      }
    },
    [loadedPaths, fetchFiles],
  );

  const handleManagePermissions = useCallback((path?: string) => {
    if (!path) return;

    window.open(`${ApplicationRoute.FoldersStorage}?path=${encodeURIComponent(path)}`, '_blank');
  }, []);

  const handleCreateFolderValidate = useCallback(
    (name: string) => {
      return validateCreateFolder(name, t);
    },
    [t],
  );

  const handleDownloadFiles = useCallback(
    async (files: DialFile[]) => {
      onExport?.(files);
    },
    [onExport],
  );

  const handleDeleteFileNodes = useCallback(
    async (fileNodes: DialDeletedItem[]) => {
      onDeleteItems?.(fileNodes).then((result) => {
        const isSuccess = result.every((res) => (Array.isArray(res) ? res.every((r) => r.success) : res.success));
        if (isSuccess) {
          const parentPath = getParentPathByFullPath(fileNodes[0]?.sourceUrl) || ROOT_PATH;
          fetchFiles(parentPath);
          setFilePath(parentPath);

          const notifications = getDeleteNotificationContent(view, fileNodes, t);
          if (Array.isArray(notifications)) {
            notifications.forEach(({ title, description }) => {
              showNotification(getSuccessNotification(title, description));
            });
          } else {
            const { title, description } = notifications as { title: string; description: string };
            showNotification(getSuccessNotification(title, description));
          }
        }
      });
    },
    [onDeleteItems, fetchFiles, setFilePath, showNotification, t, view],
  );

  const handleMoveToFiles = useCallback(
    async (items: DialCopiedItem[], sourceFolder: string, destinationFolder: string) => {
      if (!items?.length) {
        return;
      }

      if (sourceFolder !== destinationFolder) {
        setIsMoveModalOpen(true);
      }

      onMoveItems?.(items, sourceFolder, destinationFolder).then((result) => {
        setTimeout(() => {
          setIsMoveModalOpen(false);
        }, MOVE_ITEMS_INDICATOR_DELAY);

        const isSuccess = result.every((res) => (Array.isArray(res) ? res.every((r) => r.success) : res.success));
        if (isSuccess) {
          fetchFiles(destinationFolder);
          fetchFiles(sourceFolder);

          const { title, description } = getMoveNotificationContent(view, items, sourceFolder, destinationFolder, t);
          showNotification(getSuccessNotification(title, description));
        } else {
          const errorRes = result.flat().find((res) => !res.success);
          if (errorRes) {
            showNotification(getErrorNotification(errorRes.errorHeader, errorRes.errorMessage, errorRes.requestId));
          }
        }
      });
    },
    [fetchFiles, onMoveItems, showNotification, t, view],
  );

  const handlePreviewFile = useCallback((path?: string) => {
    window.open(`${FILE_PREVIEW}?path=${encodeURIComponent(path || '')}`, '_blank');
  }, []);

  const handleDragAndDropFiles = useCallback(
    (files: DialUploadFileItem[], destinationFolder: string) => {
      const folder = { path: destinationFolder };
      customUploadFileAction?.(
        destinationFolder,
        folder as DialFile,
        files.map((file) => file.fileContent),
      );
    },
    [customUploadFileAction],
  );

  const handleMoveModalClose = useCallback(() => {
    setIsMoveModalOpen(false);
  }, []);

  const handleFolderNestingDepthExceeded = useCallback(() => {
    showNotification(
      getErrorNotification(
        t(FileManagerI18nKey.FolderNestingDepthExceededTitle),
        t(FileManagerI18nKey.FolderNestingDepthExceededDescription, { depth: MAX_FOLDER_NESTING_DEPTH }),
      ),
    );
  }, [showNotification, t]);

  // The file-manager library rebuilds the grid's columns on a path, selection or compact-view change. When
  // that changes the column set (compact view keeps only the first column), the stored order and sort are
  // re-applied; a rebuild of the same columns keeps the current order through `maintainColumnOrder`.
  const onGridColumnsChanged = useCallback((event: GridColumnsChangedEvent) => reapplyState(event.api), [reapplyState]);

  const gridOptions = useMemo(() => {
    const base = getGridOptions(view, isReadOnly, persistedColumnDefs ?? columnDefs, t);
    return {
      ...base,
      getItemIcon: getUnitIcon,
      additionalGridOptions: {
        ...base.additionalGridOptions,
        maintainColumnOrder: true,
        onFilterChanged,
        onSortChanged,
        onColumnMoved,
        onColumnVisible,
        onColumnResized,
        onGridColumnsChanged,
      },
    };
  }, [
    view,
    isReadOnly,
    getUnitIcon,
    persistedColumnDefs,
    columnDefs,
    t,
    onFilterChanged,
    onSortChanged,
    onColumnMoved,
    onColumnVisible,
    onColumnResized,
    onGridColumnsChanged,
  ]);

  const isUnitFolderActive = hasUnits && isUnitFolder(units, filePath ?? '');
  const hasFolderPath = !!filePath?.replaceAll('/', '');

  const toolbarOptions = useMemo(() => {
    const base = getToolbarOptions(view, isReadOnlyAdmin, t);
    // A unit folder cannot receive imported resources, so its Create menu keeps only the "new item" entry.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { uploadFiles: _import, ...newActions } = base.newActions;
    return {
      ...base,
      newActions: isUnitFolderActive ? newActions : base.newActions,
      additionalButtons: <ResetFiltersButton gridApi={gridApi} />,
    };
  }, [view, isReadOnlyAdmin, t, gridApi, isUnitFolderActive]);

  return (
    <>
      <DialFileManager
        // The library pads the tree's bottom only (`pb-6`); without a tree title, give it vertical padding instead.
        className={classNames('bg-transparent', !label && '[&_div:has(>[role=tree])]:!py-4')}
        path={filePath}
        defaultPath={ROOT_PATH}
        items={filteredFiles as []}
        rootItem={filteredFiles?.[0] as DialRootFolder}
        filesLoading={isFetchingFiles}
        showNavigationPanel={hasFolderPath}
        contentHeaderClassName={classNames('h-[52px] items-start', !hasFolderPath && 'justify-end')}
        navigationPanelOptions={{ searchable: false, ariaLabel: t(FileManagerI18nKey.FolderPath) }}
        sortOptions={{ sortable: false }}
        bulkActionsToolbarOptions={getBulkActionsToolbarOptions(view, t)}
        toolbarOptions={toolbarOptions}
        showHiddenFiles={isHiddenFilesToggleVisible ? isShowHiddenFiles : undefined}
        onShowHiddenFilesChange={isHiddenFilesToggleVisible ? onShowHiddenFilesChange : undefined}
        showHiddenFileSwitcherInDestinationPopup={isHiddenFilesToggleVisible ? true : undefined}
        treeOptions={{
          ...getTreeOptions(
            isReadOnly,
            isFetchingFiles,
            treeLoadedPaths,
            expandedFolders,
            view,
            onExpandedPathsChange,
            t,
            label,
          ),
          getItemIcon: getUnitIcon,
        }}
        gridOptions={gridOptions}
        onGridApiChange={setGridApi}
        onPathChange={onPathChangeNormalized}
        forbiddenSymbolsRegExp={getForbiddenSymbolsRegExp(view)}
        {...props}
        getItemActionRestriction={getItemActionRestriction}
        onCreateFolder={isReadOnly ? undefined : handleCreateFolder}
        onDownloadFiles={handleDownloadFiles}
        onCreateFolderValidate={handleCreateFolderValidate}
        onRenameValidate={handleCreateFolderValidate}
        onDeleteFiles={isReadOnly ? undefined : handleDeleteFileNodes}
        onMoveToFiles={isReadOnly || !isMoveSupported ? undefined : handleMoveToFiles}
        onFolderPopupPathChange={handleFolderPopupPathChange}
        onManagePermissions={isReadOnly ? undefined : handleManagePermissions}
        onPreview={handlePreviewFile}
        onUploadFiles={isReadOnly ? undefined : handleDragAndDropFiles}
        folderCreationValidationMessages={getValidationMessages(t)}
        renameValidationMessages={getValidationMessages(t)}
        destinationFolderPopupOptions={getDestinationFolderPopupOptions(
          view,
          t,
          handleFolderNestingDepthExceeded,
          isReadOnly ? undefined : handleDestinationFolderCreate,
        )}
        isRenameFileAvailable={false}
        isDuplicateFolderAvailable={false}
        previewExtensions={PREVIEW_EXTENSIONS}
        customUploadFileAction={customUploadFileAction}
        maxNewFolderDepth={MAX_FOLDER_NESTING_DEPTH + 1}
        onNewFolderDepthExceeded={handleFolderNestingDepthExceeded}
        contentClassName="gap-0 px-0 pb-0"
      />
      <MoveItemsModal
        isModalOpen={isMoveModalOpen}
        onCancel={handleMoveModalClose}
        totalItems={movingItems}
        movedItems={movedItems}
      />
    </>
  );
};

export default FileManager;
