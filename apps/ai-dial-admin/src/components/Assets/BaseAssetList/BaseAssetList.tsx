'use client';

import {
  DialCopiedItem,
  DialFile,
  DialFileNodeType,
  DialUploadFileItem,
  FileManagerGridRow,
} from '@epam/ai-dial-react-file-manager';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { createProject, createProjectFolder } from '@/src/app/[lang]/projects/actions';
import { createSkill, createSkillFolder } from '@/src/app/[lang]/skills/actions';
import {
  changeFolder,
  removeFolder,
  removeProjectFolder,
  removeSkillFolder,
} from '@/src/app/[lang]/folders-storage/actions';
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
import { getFolderName } from '@/src/utils/files/folder';
import { useImportProgress } from '@/src/hooks/use-import-progress';
import { usePointerClickModifier } from '@/src/hooks/use-pointer-click-modifier';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { AssetApp, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialPrompt } from '@/src/models/dial/prompt';
import { DialAppRunnerResource, PlatformAsset } from '@/src/models/dial/resource';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
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
  isFileRootPath,
  isFlatPlatformView,
  isPlatformBucketPath,
  isPlatformDualBucketView,
  PLATFORM_ROOT_FOLDER,
} from '@/src/utils/files/root-folder';
import { isVersionlessAssetView } from '@/src/utils/is-view';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { appendUrlQuery, getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { useRouter } from 'next/navigation';
import Modals from './Modals';
import { BaseAssetRoute, CreateAssetRoute, CrudAssetRoute, ModalType } from './types';
import {
  AssetFolderContextMap,
  BulkDeleteAssetActionMap,
  CreateAssetActionMap,
  ExportAssetActionMap,
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
} from './utils';
import { extractNameAndVersion } from '@/src/server/publications/path';
import { VERSIONED_RESOURCE_TYPES } from '@/src/constants/assets-core';
import { ImportResult } from '@/src/components/Assets/types';

interface Props {
  view: ApplicationRoute;
  runners?: DialApplicationScheme[];
  translators?: ResourceInfo[];
}

const BaseAssetList: FC<Props> = ({ view, runners, translators }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [destinationFolder, setDestinationFolder] = useState<string | null>(null);
  const [duplicateItem, setDuplicateItem] = useState<AssetWithVersion | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [versionsMap, setVersionsMap] = useState<Record<string, string[]>>({});
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
  const runImport = useImportProgress();
  const pointerClickModifierRef = usePointerClickModifier();

  const getContext = useCallback(() => {
    return AssetFolderContextMap[view as BaseAssetRoute]();
  }, [view]);

  const { fetchFiles, fetchedFoldersData, setFilePath, filePath } = getContext();

  const emptyStateContent = useMemo(() => {
    return getEmptyStateContent(view, t);
  }, [view, t]);

  useEffect(() => {
    const folderData = fetchedFoldersData[filePath];

    setNames(filterNames(folderData));
    // The versionless group has no versions to map — an empty map keeps every consumer
    // (DuplicateAsset, modals) on its versionless branch.
    setVersionsMap(isVersionlessAssetView(view) ? {} : getVersionsPerName((folderData || []) as AssetWithVersion[]));
  }, [filePath, fetchedFoldersData, view]);

  const handleCreateModalOpen = useCallback((_?: string, currentFolder?: DialFile) => {
    setIsModalOpen(true);
    setModalType(ModalType.create);
    setDestinationFolder(currentFolder?.path || null);
  }, []);

  const handleDuplicateModalOpen = useCallback(
    async (files?: DialFile[]) => {
      if (isFileRootPath(filePath)) {
        return;
      }

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
    [view, filePath],
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
        const url = getUrnForEntity(view, file);
        navigateEntityUrl(
          isFileRootPath(filePath) && view !== ApplicationRoute.PlatformCatalogSchemas
            ? appendUrlQuery(url, 'configFile=true')
            : url,
          router.push,
          pointerEvent,
        );
      }
    },
    [view, router, pointerClickModifierRef, filePath],
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
    },
    [selectedPaths],
  );

  const columnDefs = useMemo(() => {
    return getGridColumns(view, filePath);
  }, [view, filePath]);

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
          : view === ApplicationRoute.Projects
            ? () => createProjectFolder(newPath.slice(0, -1))
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
    async (asset: AssetWithVersion, path?: string, isCreateDuplicate?: boolean, shouldCloseModal = true) => {
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
          : view === ApplicationRoute.Projects
            ? () => {
                const { name, description } = asset as unknown as { name?: string; description?: string };
                return createProject(name || '', description || '', folderPath);
              }
            : isPlatformDualBucketView(view, folderPath)
              ? () => PlatformCreateAssetActionMap[view]!({ ...asset, folderId: folderPath })
              : () => CreateAssetActionMap[view as CreateAssetRoute]({ ...asset, folderId: folderPath });

      return createAsset().then((res) => {
        if (res.success) {
          fetchFiles?.(folderPath);
          if (isCreateDuplicate) {
            const isFlatAsset = isFlatPlatformView(view) || isPlatformDualBucketView(view, folderPath);
            // A versionless duplicate is identified by its plain name — no `__version` suffix.
            let entityLabel: string;
            if (isFlatAsset) {
              entityLabel = asset.name || (asset as DialAppRunnerResource).$id || '';
            } else if (isVersionlessAssetView(view)) {
              entityLabel = asset.name || '';
            } else {
              entityLabel = `${asset.name}__${asset._metadata?.version}`;
            }
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
            let redirectEntity: Parameters<typeof getUrnForEntity>[1];
            if (isFlatAsset) {
              redirectEntity = { ...asset, folderId: folderPath };
            } else if (isVersionlessAssetView(view)) {
              redirectEntity = { name: asset.name, folderId: folderPath };
            } else {
              redirectEntity = { name: asset.name, version: asset._metadata?.version, folderId: folderPath };
            }
            router.push(getUrnForEntity(view, redirectEntity));
          }
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }

        if (shouldCloseModal) {
          handleModalClose();
        }

        return res;
      });
    },
    [destinationFolder, fetchFiles, handleModalClose, showNotification, t, router, view],
  );

  const handleDuplicate = useCallback(
    (asset: AssetWithVersion | DialPrompt) => {
      const platformAsset = asset as unknown as PlatformAsset;
      // A platform-bucket application/toolset row duplicates the same flat, unversioned way the six
      // other flat platform views already do (design.md D2/`platform-applications`/
      // `platform-toolsets`) — the row's own `folderId` decides it (reliably `'platform/'` for a
      // platform-bucket row since `fix-platform-bucket-folder-storage`; a `.path` fallback used to be
      // needed here and was the cause of Issue #4420's `Modals.tsx` counterpart — `.path` never
      // carries the bucket prefix, so it always won the `||` and made this check false for a
      // platform-bucket row).
      const isPlatformDualBucketDuplicate = isPlatformDualBucketView(view, asset.folderId);
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

      // A versionless duplicate is addressed by its plain path — no `__version` suffix.
      let newAsset: AssetWithVersion | DialPrompt;
      if (isVersionlessAssetView(view)) {
        newAsset = { ...asset, path: `${asset.folderId}${asset.name}` };
      } else {
        newAsset = {
          ...asset,
          _metadata: {
            ...asset._metadata,
            path: `${asset._metadata?.folderId}${asset.name}__${asset._metadata?.version}`,
          },
        } as AssetWithVersion;
      }
      delete (newAsset as AssetApp).reference;
      handleCreateAsset(newAsset as AssetApp, asset._metadata?.folderId, true);
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
        const destinationLeaf = file.destinationUrl.split('/').filter(Boolean).pop();
        const resourceType = getResourceTypeByRoute(view);
        const sourceLeaf = file.sourceUrl.slice(file.sourceUrl.lastIndexOf('/') + 1);
        const sourceVersion = extractNameAndVersion(sourceLeaf).version;
        const versionSuffix = sourceVersion == null ? '' : `__${sourceVersion}`;
        const hasSourceVersionSuffix = !!(
          destinationLeaf &&
          resourceType &&
          VERSIONED_RESOURCE_TYPES.some((type) => type === resourceType) &&
          versionSuffix &&
          destinationLeaf.endsWith(versionSuffix)
        );
        const duplicateName = hasSourceVersionSuffix
          ? destinationLeaf?.slice(0, -versionSuffix.length)
          : destinationLeaf;

        if (sourceFolder !== destinationFolder) {
          // Move file
          const filePaths = [];
          const newPath = file.destinationUrl.replaceAll('//', '/').split('/').slice(0, -1).join('/');
          filePaths.push(file.sourceUrl.replaceAll('//', '/'));
          // A platform-bucket row (AssetsApplications/AssetsToolsets browsed under `platform/`) has
          // no folder concept — Core has no move route for it. `DialCopiedItem` never carries
          // `bucket` (it's a ui-kit drag-event payload, not a row model), so this reads the path
          // directly rather than through `isPlatformBucketRow`.
          if (moveAsset && !isPlatformBucketPath(file.sourceUrl)) {
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
    [view],
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

      runImport(getFolderName(importFolder) || '', () => importAssetAction(body, fileType)).then((res) => {
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
    [destinationFolder, handleModalClose, fetchFiles, runImport, showNotification, view, t],
  );

  const onExport = useCallback(
    (fileType: ImportFileType) => {
      setSelectedPaths(new Set());
      const filePaths = (exportedItems || []).map((file) => file.path);

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
      // Grid rows carry their identity flat (`path`/`folderId` straight off the listing, never inside
      // `_metadata`); `etag` rides along only where a listing serves it (skills), which `DialFile`
      // doesn't declare — hence the widened cast instead of the old `DialResource` one.
      const assets = deletedItems.filter((item) => item.nodeType === DialFileNodeType.ITEM) as (DialFile & {
        etag?: string;
      })[];
      const folders = deletedItems.filter((item) => item.nodeType === DialFileNodeType.FOLDER);
      // Selection is already scoped to one folder (confirmed in design.md), so a batch is always
      // single-bucket — resolving by the first asset's path is enough, no mixed-bucket case exists.
      const bulkDeleteAsset = isPlatformDualBucketView(view, assets[0]?.path)
        ? PlatformBulkDeleteAssetActionMap[view]!
        : BulkDeleteAssetActionMap[view as BaseAssetRoute];

      const promises = [];
      if (assets.length > 0) {
        // Only skills and projects use the optional listing etag for bulk deletion.
        const assetsPaths = assets.map((asset) => ({ path: asset.path, etag: asset.etag || DEFAULT_ETAG }));
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
      } else if (view === ApplicationRoute.Projects) {
        // Same dedicated recursive delete as Skills, over the projects routes (`removeProjectFolderCore`).
        folders.forEach((folder) => {
          promises.push(removeProjectFolder(folder.path));
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
      const url = getUrnForEntity(view, file);
      window.open(
        isFileRootPath(filePath) && view !== ApplicationRoute.PlatformCatalogSchemas
          ? appendUrlQuery(url, 'configFile=true')
          : url,
        '_blank',
      );
    },
    [view, filePath],
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
        translators={translators}
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
        onRemove={onMultipleRemove}
        onCreateFolder={handleCreateFolder}
      />
    </>
  );
};

export default BaseAssetList;
