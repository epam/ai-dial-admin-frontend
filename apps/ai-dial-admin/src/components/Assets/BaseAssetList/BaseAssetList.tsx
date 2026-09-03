'use client';

import {
  DialCopiedItem,
  DialFile,
  DialFileNodeType,
  DialUploadFileItem,
  FileManagerColumnKey,
  FileManagerGridRow,
} from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { createSkill, createSkillFolder } from '@/src/app/[lang]/skills/actions';
import { changeFolder, removeFolder, removeSkillFolder } from '@/src/app/[lang]/folders-storage/actions';
import {
  getDeleteNotificationContent,
  getExportNotificationContent,
  getImportNotificationContent,
  getVersionsPerName,
} from '@/src/components/Assets/utils';
import FileManager from '@/src/components/Common/FileManager/FileManager';
import { isItemOpenable } from '@/src/components/Common/FileManager/utils';
import { navigateEntityUrl } from '@/src/components/EntityListView/utils/on-cell-clicked';
import { getFormDataForImport } from '@/src/components/EntityListView/HeaderButtons/utils';
import { usePointerClickModifier } from '@/src/hooks/use-pointer-click-modifier';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { AssetApp, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialAppRunnerResource, DialResource, PlatformAsset } from '@/src/models/dial/resource';
import { ImportData } from '@/src/models/import-asset';
import { ServerActionResponse } from '@/src/models/server-action';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { downloadFile, downloadJson } from '@/src/utils/download';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { filterNames } from '@/src/utils/entities/filter-names';
import { getJsonFileName } from '@/src/utils/import/get-json-name';
import {
  getRootFolder,
  isFlatPlatformView,
  isPlatformDualBucketView,
  PLATFORM_ROOT_FOLDER,
} from '@/src/utils/files/root-folder';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { useRouter } from 'next/navigation';
import Modals from './Modals';
import { BaseAssetRoute, CreateAssetRoute, CrudAssetRoute, ModalType } from './types';
import {
  AssetFolderContextMap,
  BulkDeleteAssetActionMap,
  CreateAssetActionMap,
  ExportAssetActionMap,
  getAllSelectedItemsPaths,
  GetAssetActionMap,
  getEmptyAsset,
  getEmptyStateContent,
  getFileManagerLabel,
  getGridColumns,
  getPlatformAssetDuplicate,
  getResourceTypeByRoute,
  ImportAssetActionMap,
  MoveAssetActionMap,
  PlatformBulkDeleteAssetActionMap,
  PlatformCreateAssetActionMap,
  PlatformGetAssetActionMap,
  enrichConversationWithVersion,
} from './utils';
import { ImportResult } from '@/src/components/Assets/types';
import { compareVersions } from '@/src/utils/entities/versions';

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
  const [names, setNames] = useState<string[]>([]);
  const [versionsMap, setVersionsMap] = useState<Record<string, string[]>>({});
  const [hasSelectedItems, setHasSelectedItems] = useState(false);
  const [deletedItems, setDeletedItems] = useState<DialFile[] | null>(null);
  const [exportedItems, setExportedItems] = useState<DialFile[] | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(() => new Set());
  const [dragAndDropsItems, setDragAndDropsItems] = useState<File[]>([]);
  const [movingItems, setMovingItems] = useState(0);
  const [movedItems, setMovedItems] = useState(0);
  const [folderToRefetch, setFolderToRefetch] = useState<string | null>(null);
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const pointerClickModifierRef = usePointerClickModifier();

  const getContext = useCallback(() => {
    return AssetFolderContextMap[view as BaseAssetRoute]();
  }, [view]);

  const { data, fetchFiles, fetchedFoldersData, setFilePath, filePath } = getContext();

  const emptyStateContent = useMemo(() => {
    return getEmptyStateContent(view, t);
  }, [view, t]);

  useEffect(() => {
    let folderData = data;
    if (filePath && fetchedFoldersData[filePath]) {
      folderData = fetchedFoldersData[filePath];
    }

    setNames(filterNames(folderData));
    setVersionsMap(getVersionsPerName((folderData || []) as AssetWithVersion[]));
  }, [filePath, fetchedFoldersData, data]);

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

      const { path } = files[0] as AssetWithVersion;
      // Applications and Toolsets are the only views where the "get" call to make depends on which
      // bucket the clicked row belongs to, not just on the view (design.md D2/
      // `platform-applications`/`platform-toolsets`).
      const getAsset = isPlatformDualBucketView(view, path)
        ? PlatformGetAssetActionMap[view]!
        : GetAssetActionMap[view as BaseAssetRoute];
      const fullAsset = await getAsset(path, DEFAULT_ETAG);
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
    if (items.length && items[0]?.path !== parentFolderPath) {
      setDestinationFolder(parentFolderPath);
      setDeletedItems(items);
      setIsModalOpen(true);
      setModalType(ModalType.delete);
    }
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
    setDeletedItems(null);
    setExportedItems(null);
    setDuplicateItem(null);
  }, []);

  const handleGridItemClick = useCallback(
    (file: FileManagerGridRow) => {
      if (isItemOpenable(view, file.name)) {
        const pointerEvent = pointerClickModifierRef.current;
        pointerClickModifierRef.current = null;
        navigateEntityUrl(
          getUrnForEntity(view, {
            name: file.name,
            path: file.path,
          }),
          router.push,
          pointerEvent,
        );
      }
    },
    [view, router, pointerClickModifierRef],
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

  const handlePathChange = useCallback(
    (nextPath?: string) => {
      if (nextPath) {
        setFilePath(nextPath);
      }
    },
    [setFilePath],
  );

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
    return getGridColumns(view, gridItemVersionsChange, selectedVersionsMap, hasSelectedItems, filePath);
  }, [view, gridItemVersionsChange, hasSelectedItems, selectedVersionsMap, filePath]);

  const handleCreateFolder = useCallback(
    async (_: DialUploadFileItem | undefined, folderPath: string) => {
      setSelectedPaths(new Set());
      const newPath = `${folderPath.replaceAll('//', '/')}/`;

      // Skill's folder marker is a genuinely different Core route from every other type's (a
      // trailing-slash grouping-folder PUT, not a folder-shaped "empty entity" written through the
      // same action a real skill uses) — see design D2 — so it's called directly here rather than
      // through `CreateAssetActionMap`. `createSkillFolder` appends its own trailing slash to build
      // Core's folder route, so it takes the path without one — passing `newPath` (which already
      // carries the trailing slash every other branch's folder-marker path expects) produced a
      // double slash Core rejected as a not-found path.
      const createFolder =
        view === ApplicationRoute.Skills
          ? () => createSkillFolder(newPath.slice(0, -1))
          : () => CreateAssetActionMap[view as CreateAssetRoute](getEmptyAsset(view, newPath) as AssetWithVersion);

      return createFolder().then((res) => {
        // Without this the pending tree node just disappears on rejection, leaving no trace that the
        // create was refused — the caller renders the node optimistically and drops it on any result.
        if (!res.success) {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }

        return res;
      });
    },
    [showNotification, view],
  );

  const handleCreateAsset = useCallback(
    async (asset: AssetWithVersion, path?: string, isCreateDuplicate?: boolean) => {
      const folderPath = path || destinationFolder || `${getRootFolder(view)}/`;

      // A real skill and its folder marker are different Core operations for this type (design D2),
      // so Skill is called directly here rather than through `CreateAssetActionMap`, whose single
      // function per type every other entry can serve unmodified. Applications and Toolsets are the
      // other exception: which "create" call to make depends on the destination bucket, not just
      // the view (design.md D2/`platform-applications`/`platform-toolsets`) — the platform variant
      // pins the path to the flat `platform` bucket regardless of the `folderId` passed here.
      const createAsset =
        view === ApplicationRoute.Skills
          ? () => {
              const { name, description } = asset as unknown as { name?: string; description?: string };
              return createSkill(name || '', description || '', folderPath);
            }
          : isPlatformDualBucketView(view, folderPath)
            ? () => PlatformCreateAssetActionMap[view]!({ ...asset, folderId: folderPath })
            : () => CreateAssetActionMap[view as CreateAssetRoute]({ ...asset, folderId: folderPath });

      return createAsset().then((res) => {
        if (res.success) {
          fetchFiles?.(folderPath);
          if (isCreateDuplicate) {
            const isFlatAsset = isFlatPlatformView(view) || isPlatformDualBucketView(view, folderPath);
            const entityLabel = isFlatAsset
              ? asset.name || (asset as DialAppRunnerResource).$id
              : `${asset.name}__${asset.version}`;
            showNotification(
              getSuccessNotification(
                getCreateNotificationTitle(view, t),
                getCreateNotificationDescription(view, entityLabel, t),
              ),
            );
            // `getPlatformAssetDuplicate` strips `folderId` from `asset` (Core's platform-bucket
            // write doesn't want it) — harmless for the six genuinely flat views, whose
            // `getEntityPath` case never reads `folderId`, but `AssetsApplications`/
            // `AssetsToolsets` need it back here to recognize the redirect target as
            // platform-bucket; otherwise `getEntityPath` falls through to the versioned-path
            // branch and builds `?path=undefined{name}__` (design.md D5).
            router.push(
              getUrnForEntity(
                view,
                isFlatAsset
                  ? { ...asset, folderId: folderPath }
                  : { name: asset.name, version: asset.version, folderId: folderPath },
              ),
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
      const platformAsset = asset as unknown as PlatformAsset;
      // A platform-bucket application/toolset row duplicates the same flat, unversioned way the six
      // other flat platform views already do (design.md D2/`platform-applications`/
      // `platform-toolsets`) — the row's own path decides it, since neither dual-bucket view is
      // itself flagged `isFlatPlatformView`.
      const isPlatformDualBucketDuplicate = isPlatformDualBucketView(
        view,
        platformAsset.path || platformAsset.folderId,
      );
      if (isFlatPlatformView(view) || isPlatformDualBucketDuplicate) {
        const duplicate = getPlatformAssetDuplicate(view, platformAsset);
        // `getRootFolder(view)`'s fallback (used when the second argument is omitted) resolves to
        // `platform` for every genuinely flat view, but a dual-bucket view's own root is `public` —
        // it serves both buckets — so a platform-bucket duplicate must pin its destination
        // explicitly rather than relying on that fallback.
        const flatDestinationFolder = isPlatformDualBucketDuplicate ? `${PLATFORM_ROOT_FOLDER}/` : void 0;
        handleCreateAsset(duplicate as unknown as AssetWithVersion, flatDestinationFolder, true);
        handleModalClose();
        return;
      }

      const newAsset = {
        ...asset,
        path: `${asset.folderId}${asset.name}__${asset.version}`,
      };
      delete (newAsset as AssetApp).reference;
      handleCreateAsset(newAsset as AssetApp, asset.folderId, true);
      handleModalClose();
    },
    [handleCreateAsset, handleModalClose, view],
  );

  const handleMoveItems = useCallback(
    (items: DialCopiedItem[], sourceFolder: string, destinationFolder: string) => {
      const files = items.filter((file) => file.nodeType === DialFileNodeType.ITEM);
      const folders = items.filter((file) => file.nodeType === DialFileNodeType.FOLDER);
      setMovingItems((files?.length || 0) + (folders?.length || 0));
      setMovedItems(0);
      const moveAsset =
        view === ApplicationRoute.Conversations ? undefined : MoveAssetActionMap[view as CrudAssetRoute];

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
      let importFolder = destinationFolder || `${getRootFolder(view)}/`;
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

      const importAssetAction = ImportAssetActionMap[view as CrudAssetRoute];

      importAssetAction(body, fileType).then((res) => {
        setFolderToRefetch(null);
        const importResults = res.success ? res.response?.importResults : undefined;

        if (res.success) {
          fetchFiles?.(importFolder);
          const { title, description, errorTitle, errorDescription, skippedTitle, skippedDescription } =
            getImportNotificationContent(view, importResults as ImportResult[], fileType, importFolder, t);
          if (title && description) {
            showNotification(getSuccessNotification(title, description));
          }
          if (errorTitle && errorDescription) {
            showNotification(getErrorNotification(errorTitle, errorDescription));
          }
          if (skippedTitle && skippedDescription && conflictResolutionStrategy !== ConflictResolutionPolicy.SKIP) {
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
          if (view === ApplicationRoute.Conversations && !curr.version) {
            curr = enrichConversationWithVersion(curr);
          }
          curr.selectedVersions = selectedVersionsMap[`${curr.folderId}${curr.name}`] || [curr.version];
          const existing = acc.find((a) => a.nodeType === DialFileNodeType.ITEM && a.name === curr.name);
          if (existing) {
            if (!existing.versions) existing.versions = [];
            if (!existing.versions.includes(curr.version)) {
              existing.versions.push(curr.version);
            }
            if (compareVersions(curr.version, existing.version) > 0) {
              existing.path = curr.path;
              existing.version = curr.version;
            }
            existing.selectedVersions = selectedVersionsMap[`${curr.folderId}${curr.name}`] || [existing.version];
          } else {
            acc.push({ ...curr, versions: [curr.version] });
          }
        } else {
          acc.push(curr);
        }
        return acc;
      }, []);
    },
    [selectedVersionsMap, view],
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

      const exportAsset = ExportAssetActionMap[view as CrudAssetRoute];

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

  const onMultipleRemove = useCallback(async () => {
    if (deletedItems) {
      const assets = deletedItems.filter((item) => item.nodeType === DialFileNodeType.ITEM) as DialResource[];
      const folders = deletedItems.filter((item) => item.nodeType === DialFileNodeType.FOLDER);
      // Selection is already scoped to one folder (confirmed in design.md), so a batch is always
      // single-bucket — resolving by the first asset's path is enough, no mixed-bucket case exists.
      const bulkDeleteAsset = isPlatformDualBucketView(view, assets[0]?.path)
        ? PlatformBulkDeleteAssetActionMap[view]!
        : BulkDeleteAssetActionMap[view as BaseAssetRoute];

      const promises = [];
      if (assets.length > 0) {
        // `etag` is optional here and ignored by every entry except `bulkDeleteSkills`, whose delete
        // has no content GET to source an etag from and so requires one from the listing row.
        const assetsPaths: { path: string; etag?: string }[] = [];
        assets.forEach((asset) => {
          const paths = getAllSelectedItemsPaths(asset.path, selectedVersionsMap);
          if (paths.length > 0) {
            assetsPaths.push(...paths.map((path: string) => ({ path: path, etag: asset.etag || DEFAULT_ETAG })));
          } else {
            assetsPaths.push({ path: asset.path, etag: asset.etag || DEFAULT_ETAG });
          }
          const prefix = asset.path.substring(0, asset.path.lastIndexOf('__'));
          setSelectedVersionsMap({
            ...selectedVersionsMap,
            [prefix]: [],
          });
        });
        promises.push(bulkDeleteAsset(assetsPaths));
      }
      const resourceType = getResourceTypeByRoute(view);
      if (resourceType) {
        folders.forEach((folder) => {
          promises.push(removeFolder(folder.path, resourceType));
        });
      } else if (view === ApplicationRoute.Skills) {
        // Skills aren't one of the five flat resource types `removeFolder`/`removeFolderCore`
        // walks generically (`getResourceTypeByRoute` deliberately excludes SKILL) — they get their
        // own recursive, dedicated-endpoint delete instead (see `removeSkillFolderCore`).
        folders.forEach((folder) => {
          promises.push(removeSkillFolder(folder.path));
        });
      }

      handleModalClose();

      return Promise.all(promises).then((result) => {
        const isSuccess = result.every((res) => res.success);
        if (isSuccess) {
          const parentPath = destinationFolder || `${getRootFolder(view)}/`;
          fetchFiles(parentPath);
          setFilePath(parentPath);
          removeSelection(deletedItems?.map((item) => item.path));
          const notifications = getDeleteNotificationContent(view, deletedItems as DialFile[], t);
          if (Array.isArray(notifications)) {
            notifications.forEach(({ title, description }) => {
              showNotification(getSuccessNotification(title, description));
            });
          } else {
            const { title, description } = notifications as { title: string; description: string };
            showNotification(getSuccessNotification(title, description));
          }
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
        selectedVersionsMap={selectedVersionsMap}
        preselectedItems={dragAndDropsItems}
        duplicateItem={duplicateItem}
        deletedItems={deletedItems}
        getContext={getContext}
        onClose={handleModalClose}
        onCreate={handleCreateAsset}
        onImport={onImport}
        onExport={onExport}
        onDuplicate={handleDuplicate}
        onRemove={onMultipleRemove}
        onCreateFolder={handleCreateFolder}
        hasSelectedItems={hasSelectedItems}
      />
    </>
  );
};

export default BaseAssetList;
