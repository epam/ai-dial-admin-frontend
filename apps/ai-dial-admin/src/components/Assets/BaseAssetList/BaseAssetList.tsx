'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import FileManager from '@/src/components/Common/FileManager/FileManager';
import {
  getDeleteNotificationContent,
  getExportNotificationContent,
  getImportNotificationContent,
  getVersionsPerName,
} from '@/src/components/Assets/utils';
import {
  getResourceTypeByRoute,
  getAllSelectedItemsPaths,
  getEmptyAsset,
  getEmptyStateContent,
  getFileManagerLabel,
  getGridColumns,
  AssetFolderContextMap,
  GetAssetActionMap,
  CreateAssetActionMap,
  MoveAssetActionMap,
  ImportAssetActionMap,
  ExportAssetActionMap,
  RemoveAssetActionMap,
  BulkDeleteAssetActionMap,
} from './utils';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import {
  DialCopiedItem,
  DialFile,
  DialFileNodeType,
  DialUploadFileItem,
  FileManagerColumnKey,
} from '@epam/ai-dial-ui-kit';
import { changeFolder, removeFolder } from '@/src/app/[lang]/folders-storage/actions';
import { filterNames } from '@/src/utils/entities/filter-names';
import { AssetApp, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ROOT_FOLDER } from '@/src/constants/file';
import { useNotification } from '@/src/context/NotificationContext';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { ServerActionResponse } from '@/src/models/server-action';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { ImportFileType } from '@/src/types/import';
import { ImportData } from '@/src/models/import-asset';
import { getFormDataForImport } from '@/src/components/EntityListView/HeaderButtons/utils';
import { FileManagerGridRow } from '@epam/ai-dial-ui-kit/dist/src/components/FileManager/FileManagerContext';
import { useRouter } from 'next/navigation';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { downloadFile, downloadJson } from '@/src/utils/download';
import { getJsonFileName } from '@/src/utils/import/get-json-name';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseAssetRoute, ModalType } from './types';
import Modals from './Modals';
import { isItemNameValid } from '@/src/components/Common/FileManager/utils';

interface Props {
  view: ApplicationRoute;
  runners?: DialApplicationScheme[];
}

const BaseAssetList: FC<Props> = ({ view, runners }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [destinationFolder, setDestinationFolder] = useState<string | null>(null);
  const [duplicateItem, setDuplicateItem] = useState<AssetWithVersion | null>(null);
  const [selectedVersionsMap, setSelectedVersionsMap] = useState<Record<string, string[]>>({});
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [versionsMap, setVersionsMap] = useState<Record<string, string[]>>({});
  const [hasSelectedItems, setHasSelectedItems] = useState(false);
  const [deletedItems, setDeleledItems] = useState<DialFile[] | null>(null);
  const [exportedItems, setExportedItems] = useState<DialFile[] | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(() => new Set());
  const [dragAndDropsItems, setDragAndDropsItems] = useState<File[]>([]);
  const [movingItems, setMovingItems] = useState(0);
  const [movedItems, setMovedItems] = useState(0);
  const [folderToRefetch, setFolderToRefetch] = useState<string | null>(null);
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const getContext = useCallback(() => {
    return AssetFolderContextMap[view as BaseAssetRoute]();
  }, [view]);

  const { data, fetchFiles, fetchedFoldersData, setFilePath } = getContext();

  const emptyStateContent = useMemo(() => {
    return getEmptyStateContent(view, t);
  }, [view, t]);

  useEffect(() => {
    let folderData = data;
    if (currentPath && fetchedFoldersData[currentPath]) {
      folderData = fetchedFoldersData[currentPath];
    }

    setNames(filterNames(folderData));
    setVersionsMap(getVersionsPerName((folderData || []) as AssetWithVersion[]));
  }, [currentPath, fetchedFoldersData, data]);

  const handleCreateModalOpen = useCallback((_?: string, currentFolder?: DialFile) => {
    setIsModalOpen(true);
    setModalType(ModalType.create);
    setDestinationFolder(currentFolder?.path || null);
  }, []);

  const handleDuplicateModalOpen = useCallback(
    async (files?: DialFile[]) => {
      if (!files?.length) {
        return;
      }

      const { folderId, name = '', version } = files[0] as AssetWithVersion;
      const getAsset = GetAssetActionMap[view as BaseAssetRoute];
      const fullAsset = await getAsset(folderId, name, version, DEFAULT_ETAG);
      setDuplicateItem(fullAsset?.response as AssetWithVersion);
      setIsModalOpen(true);
      setModalType(ModalType.duplicate);
    },
    [view],
  );

  const handleImportModalOpen = useCallback((_?: string, currentFolder?: DialFile, preselectedItems?: File[]) => {
    setIsModalOpen(true);
    setModalType(ModalType.import);
    setDestinationFolder(currentFolder?.path || null);
    setDragAndDropsItems(preselectedItems || []);
  }, []);

  const handleDeleteModalOpen = useCallback((items: DialFile[], parentFolderPath: string) => {
    setDestinationFolder(parentFolderPath);
    setDeleledItems(items);
    setIsModalOpen(true);
    setModalType(ModalType.delete);
  }, []);

  const handleExportModalOpen = useCallback((files?: DialFile[]) => {
    if (files?.length) {
      setIsModalOpen(true);
      setModalType(ModalType.export);
      setExportedItems(files);
    }
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setModalType(null);
    setDestinationFolder(null);
    setDragAndDropsItems([]);
    setDeleledItems(null);
    setExportedItems(null);
    setDuplicateItem(null);
  }, []);

  const handleGridItemClick = useCallback(
    (file: FileManagerGridRow) => {
      if (isItemNameValid(file.name)) {
        router.push(
          getUrnForEntity(view, {
            name: file.name,
            path: file.path,
          }),
        );
      }
    },
    [view, router],
  );

  const gridItemVersionsChange = useCallback(
    (value: string | string[], data: unknown) => {
      const assetData = data as AssetWithVersion;
      setSelectedVersionsMap({
        ...selectedVersionsMap,
        [`${assetData.folderId}${assetData.name}`]: Array.isArray(value) ? value : [value],
      });
    },
    [selectedVersionsMap],
  );

  const handlePathChange = useCallback((nextPath?: string) => {
    if (nextPath) {
      setCurrentPath(nextPath);
    }
  }, []);

  const handleSelectedPathsChange = useCallback((paths: Set<string>) => {
    setSelectedPaths(paths);
    setHasSelectedItems(paths.size > 0);
  }, []);

  const removeSelection = useCallback(
    (paths?: string | string[]) => {
      if (!paths) {
        return;
      }

      const selectionsToRemove = Array.isArray(paths) ? paths : [paths];
      const newPaths = new Set(selectedPaths);
      selectionsToRemove.forEach((path) => {
        newPaths.delete(path);
      });
      setSelectedPaths(newPaths);
      setHasSelectedItems(newPaths.size > 0);
    },
    [selectedPaths],
  );

  const columnDefs = useMemo(() => {
    return getGridColumns(gridItemVersionsChange, selectedVersionsMap, hasSelectedItems);
  }, [gridItemVersionsChange, hasSelectedItems, selectedVersionsMap]);

  const handleCreateFolder = useCallback(
    async (_: DialUploadFileItem | undefined, folderPath: string) => {
      const newPath = `${folderPath.replaceAll('//', '/')}/`;
      const emptyAsset = getEmptyAsset(view, newPath);

      const createAsset = CreateAssetActionMap[view as BaseAssetRoute];

      return createAsset(emptyAsset);
    },
    [view],
  );

  const handleCreateAsset = useCallback(
    async (asset: AssetWithVersion, path?: string, isCreateDuplicate?: boolean) => {
      const folderPath = path || destinationFolder || `${ROOT_FOLDER}/`;
      const createAsset = CreateAssetActionMap[view as BaseAssetRoute];

      return createAsset({ ...asset, folderId: folderPath }).then((res) => {
        if (res.success) {
          fetchFiles?.(folderPath);
          if (isCreateDuplicate) {
            showNotification(
              getSuccessNotification(
                getCreateNotificationTitle(view, t),
                getCreateNotificationDescription(view, `${asset.name}__${asset.version}`, t),
              ),
            );
            router.push(
              getUrnForEntity(view, {
                name: asset.name,
                path: asset.path,
              }),
            );
          }
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }

        handleModalClose();

        return res;
      });
    },
    [destinationFolder, fetchFiles, handleModalClose, showNotification, t, router, view],
  );

  const handleDuplicate = useCallback(
    (asset: AssetWithVersion) => {
      const newAsset = {
        ...asset,
        path: `${asset.folderId}${asset.name}__${asset.version}`,
      };
      handleCreateAsset(newAsset as AssetApp, asset.folderId, true);
      handleModalClose();
    },
    [handleCreateAsset, handleModalClose],
  );

  const handleMoveItems = useCallback(
    (items: DialCopiedItem[], sourceFolder: string, destinationFolder: string) => {
      const files = items.filter((file) => file.nodeType === DialFileNodeType.ITEM);
      const folders = items.filter((file) => file.nodeType === DialFileNodeType.FOLDER);
      setMovingItems((files?.length || 0) + (folders?.length || 0));
      setMovedItems(0);
      const moveAsset = MoveAssetActionMap[view as BaseAssetRoute];

      const promises: Promise<ServerActionResponse | ServerActionResponse[]>[] = [];
      files.forEach((file) => {
        const duplicateName = file.destinationUrl
          .split('/')
          .filter((p) => p != null)
          .pop();

        if (sourceFolder !== destinationFolder) {
          // Move file
          const filePaths = [];
          const newPath = file.destinationUrl.replaceAll('//', '/').split('/').slice(0, -1).join('/');
          const paths = getAllSelectedItemsPaths(file.sourceUrl, selectedVersionsMap);
          filePaths.push(...paths.map((path: string) => path.replaceAll('//', '/')));
          if (moveAsset) {
            promises.push(
              moveAsset(filePaths, newPath, file?.overwrite, duplicateName).then((res) => {
                setMovedItems((prev) => prev + filePaths.length);
                return res;
              }),
            );
          }
        } else {
          // Rename file
        }
      });

      const resourceType = getResourceTypeByRoute(view);
      if (resourceType) {
        folders.forEach((folder) => {
          promises.push(
            changeFolder(
              folder.sourceUrl.replaceAll('//', '/'),
              folder.destinationUrl.replaceAll('//', '/'),
              resourceType,
              folder?.overwrite,
            ).then((res) => {
              setMovedItems((prev) => prev + 1);
              return res;
            }),
          );
        });
      }

      return Promise.all(promises);
    },
    [selectedVersionsMap, view],
  );

  const onImport = useCallback(
    (
      fileType: ImportFileType,
      file: ImportData,
      conflictResolutionStrategy: string,
      _: string,
      ignorePaths?: boolean,
    ) => {
      let importFolder = destinationFolder || `${ROOT_FOLDER}/`;
      setFolderToRefetch(importFolder);

      const { body } = getFormDataForImport(
        importFolder,
        file,
        fileType,
        conflictResolutionStrategy,
        void 0,
        ignorePaths,
        view,
      );

      const importAssetAction = ImportAssetActionMap[view as BaseAssetRoute];

      importAssetAction(body, fileType).then((res) => {
        setFolderToRefetch(null);
        if (res.success) {
          fetchFiles?.(importFolder);
          const { title, description, errorTitle, errorDescription, skippedTitle, skippedDescription } =
            getImportNotificationContent(view, res.response.importResults, fileType, importFolder, t);
          if (title && description) {
            showNotification(getSuccessNotification(title, description));
          }
          if (errorTitle && errorDescription) {
            showNotification(getErrorNotification(errorTitle, errorDescription));
          }
          if (skippedTitle && skippedDescription) {
            showNotification(getErrorNotification(skippedTitle, skippedDescription));
          }
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });

      handleModalClose();
    },
    [destinationFolder, handleModalClose, fetchFiles, showNotification, view, t],
  );

  const processAssetsData = useCallback(
    (assets: AssetWithVersion[]): AssetWithVersion[] => {
      const processedAssets = assets.map((asset) => {
        if (asset.nodeType === DialFileNodeType.FOLDER && asset.items) {
          return { ...asset, items: processAssetsData(asset.items) };
        }
        return asset;
      });

      return processedAssets.reduce((acc: AssetWithVersion[], curr) => {
        if (curr.nodeType === DialFileNodeType.ITEM) {
          curr.selectedVersions = selectedVersionsMap[`${curr.folderId}${curr.name}`] || [curr.version];
          const existing = acc.find((a) => a.nodeType === DialFileNodeType.ITEM && a.name === curr.name);
          if (existing) {
            existing.path = curr.path;
            existing.version = curr.version;
            existing.selectedVersions = selectedVersionsMap[`${curr.folderId}${curr.name}`] || [curr.version];
            if (!existing.versions) existing.versions = [];
            if (!existing.versions.includes(curr.version)) {
              existing.versions.push(curr.version);
            }
          } else {
            acc.push({ ...curr, versions: [curr.version] });
          }
        } else {
          acc.push(curr);
        }
        return acc;
      }, []);
    },
    [selectedVersionsMap],
  );

  const onExport = useCallback(
    (fileType: ImportFileType) => {
      setSelectedPaths(new Set());
      setHasSelectedItems(false);
      const filePaths: string[] = [];
      (exportedItems as AssetWithVersion[]).forEach((file) => {
        if (file.selectedVersions) {
          filePaths.push(...file.selectedVersions.map((version) => `${file.folderId}${file.name}__${version}`));
        } else {
          filePaths.push(file.path);
        }
      });

      const exportAsset = ExportAssetActionMap[view as BaseAssetRoute];

      exportAsset(filePaths, fileType).then((res) => {
        if (fileType === ImportFileType.ARCHIVE) {
          const { blob, fileName } = res as { blob: Blob; fileName: string };
          downloadFile(blob, fileName);
        } else {
          downloadJson(res, getJsonFileName(view));
        }
        const { title, description } = getExportNotificationContent(view, exportedItems || [], t, filePaths);
        showNotification(getSuccessNotification(title, description));
      });
      handleModalClose();
    },
    [exportedItems, handleModalClose, showNotification, t, view],
  );

  const onDeleteFolder = useCallback(() => {
    const pathToRemove = deletedItems?.[0]?.path;
    if (pathToRemove) {
      removeFolder(pathToRemove).then((result) => {
        if (result.success) {
          const parentPath = destinationFolder || `${ROOT_FOLDER}/`;
          setFilePath(parentPath);
          fetchFiles(parentPath);
          removeSelection(pathToRemove);
          const { title, description } = getDeleteNotificationContent(view, deletedItems as DialFile[], t, parentPath);
          showNotification(getSuccessNotification(title, description));
        }
      });
    }
  }, [deletedItems, destinationFolder, fetchFiles, setFilePath, removeSelection, showNotification, t, view]);

  const onMultipleRemove = useCallback(async () => {
    if (deletedItems) {
      const assets = deletedItems.filter((item) => item.nodeType === DialFileNodeType.ITEM);
      const folders = deletedItems.filter((item) => item.nodeType === DialFileNodeType.FOLDER);
      const bulkDeleteAsset = BulkDeleteAssetActionMap[view as BaseAssetRoute];

      const promises = [];
      if (assets.length > 0) {
        const assetsPaths: { path: string }[] = [];
        assets.forEach((asset) => {
          const paths = getAllSelectedItemsPaths(asset.path, selectedVersionsMap);
          assetsPaths.push(...paths.map((path: string) => ({ path: path })));
          const prefix = asset.path.substring(0, asset.path.lastIndexOf('__'));
          setSelectedVersionsMap({
            ...selectedVersionsMap,
            [prefix]: [],
          });
        });
        promises.push(bulkDeleteAsset(assetsPaths));
      }
      folders.forEach((folder) => {
        promises.push(removeFolder(folder.path));
      });

      handleModalClose();

      return Promise.all(promises).then((result) => {
        const isSuccess = result.every((res) => res.success);
        if (isSuccess) {
          const parentPath = destinationFolder || `${ROOT_FOLDER}/`;
          fetchFiles(parentPath);
          setFilePath(parentPath);
          removeSelection(deletedItems?.map((item) => item.path));
          const { title, description } = getDeleteNotificationContent(view, deletedItems as DialFile[], t, parentPath);
          showNotification(getSuccessNotification(title, description));
        } else {
          const errorRes = result.flat().find((res) => !res.success);
          if (errorRes) {
            showNotification(getErrorNotification(errorRes.errorHeader, errorRes.errorMessage, errorRes.requestId));
          }
        }
      });
    }
  }, [
    deletedItems,
    selectedVersionsMap,
    destinationFolder,
    fetchFiles,
    setFilePath,
    removeSelection,
    showNotification,
    t,
    view,
    handleModalClose,
  ]);

  const onRemoveAssetEndHandler = useCallback(() => {
    const parentPath = destinationFolder || `${ROOT_FOLDER}/`;
    setFilePath(parentPath);
    fetchFiles(parentPath);
    removeSelection(deletedItems?.map((item) => item.path));
  }, [destinationFolder, setFilePath, fetchFiles, deletedItems, removeSelection]);

  const handleOpenInNewTab = useCallback(
    (file: DialFile) => {
      onOpenInNewTab(view, file);
    },
    [view],
  );

  return (
    <>
      <FileManager
        label={t(getFileManagerLabel(view))}
        columnDefs={columnDefs}
        getContext={getContext}
        view={view}
        onCreateFolder={handleCreateFolder}
        customDownloadItemsAction={handleExportModalOpen}
        customUploadFileAction={handleImportModalOpen}
        customCreateNewItemAction={handleCreateModalOpen}
        customDuplicateAction={handleDuplicateModalOpen}
        customDeleteItemsAction={handleDeleteModalOpen}
        onMoveItems={handleMoveItems}
        onOpenInNewTab={handleOpenInNewTab}
        onTableFileClick={handleGridItemClick}
        filterData={processAssetsData}
        nonClickableTableColumns={hasSelectedItems ? [FileManagerColumnKey.Version] : []}
        onPathChange={handlePathChange}
        onSelectedPathsChange={handleSelectedPathsChange}
        selectedPaths={selectedPaths}
        emptyStateTitle={emptyStateContent.title}
        emptyStateDescription={emptyStateContent.description}
        showHiddenFileSwitcherInDestinationPopup={false}
        movingItems={movingItems}
        movedItems={movedItems}
        folderToRefetch={folderToRefetch}
      />
      <Modals
        view={view}
        isModalOpen={isModalOpen}
        modalType={modalType}
        names={names}
        runners={runners || []}
        versionsMap={versionsMap}
        preselectedItems={dragAndDropsItems}
        duplicateItem={duplicateItem}
        deletedItems={deletedItems}
        getContext={getContext}
        onClose={handleModalClose}
        onCreate={handleCreateAsset}
        onImport={onImport}
        onExport={onExport}
        onDuplicate={handleDuplicate}
        onRemove={RemoveAssetActionMap[view as BaseAssetRoute]}
        onDeleteFolder={onDeleteFolder}
        onMultipleRemove={onMultipleRemove}
        onRemoveAssetEnd={onRemoveAssetEndHandler}
      />
    </>
  );
};

export default BaseAssetList;
