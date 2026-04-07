'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import FileManager from '@/src/components/Common/FileManager/FileManager';
import {
  bulkDeletePrompts,
  createPrompt,
  exportPrompts,
  getPrompt,
  movePrompts,
  removePrompt,
} from '@/src/app/[lang]/prompts/actions';
import { importPrompts } from '@/src/utils/prompts/import-prompts';
import {
  getDeleteNotificationContent,
  getExportNotificationContent,
  getImportNotificationContent,
  getVersionsPerName,
} from '@/src/components/Assets/utils';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { ApplicationRoute } from '@/src/types/routes';
import { DialPrompt } from '@/src/models/dial/prompt';
import { useI18n } from '@/src/locales/client';
import { FileManagerI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import {
  DialCopiedItem,
  DialFile,
  DialFileNodeType,
  DialUploadFileItem,
  FileManagerColumnKey,
} from '@epam/ai-dial-ui-kit';
import { changeFolder, removeFolder } from '@/src/app/[lang]/folders-storage/actions';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import { filterNames } from '@/src/utils/entities/filter-names';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ROOT_FOLDER } from '@/src/constants/file';
import { useNotification } from '@/src/context/NotificationContext';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { ServerActionResponse } from '@/src/models/server-action';
import { ResourceType } from '@/src/types/resource-type';
import DuplicateAsset from '@/src/components/Assets/Deployments/DuplicateAsset';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import ImportModal from '@/src/components/EntityListView/Import/ImportModal';
import { ImportFileType } from '@/src/types/import';
import { ImportData } from '@/src/models/import-asset';
import { getFormDataForImport } from '@/src/components/EntityListView/HeaderButtons/utils';
import { FileManagerGridRow } from '@epam/ai-dial-ui-kit/dist/src/components/FileManager/FileManagerContext';
import { useRouter } from 'next/navigation';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { getAllSelectedItemsPaths, getPromptGridColumns } from './utils';
import { downloadFile, downloadJson } from '@/src/utils/download';
import { getJsonFileName } from '@/src/utils/import/get-json-name';
import DeleteModal from './DeleteModal';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import ExportModal from '@/src/components/EntityListView/Export/ExportModal';

const PromptsList: FC = () => {
  const [isExportPromptModalOpen, setIsExportPromptModalOpen] = useState(false);
  const [isCreatePromptModalOpen, setIsCreatePromptModalOpen] = useState(false);
  const [isDuplicatePromptModalOpen, setIsDuplicatePromptModalOpen] = useState(false);
  const [isImportPromptModalOpen, setIsImportPromptModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [destinationFolder, setDestinationFolder] = useState<string | null>(null);
  const [duplicatePrompt, setDuplicatePrompt] = useState<AssetWithVersion | null>(null);
  const [selectedVersionsMap, setSelectedVersionsMap] = useState<Record<string, string[]>>({});
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [versionsMap, setVersionsMap] = useState<Record<string, string[]>>({});
  const [hasSelectedItems, setHasSelectedItems] = useState(false);
  const [deletedItems, setDeleledItems] = useState<DialFile[] | null>(null);
  const [exportedItems, setExportedItems] = useState<DialFile[] | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(() => new Set());
  const [dragAndDropsItems, setDragAndDropsItems] = useState<File[]>([]);
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const getPromptContext = useCallback(() => {
    return usePromptFolder();
  }, []);
  const { data, fetchFiles, fetchedFoldersData, setFilePath } = getPromptContext();

  useEffect(() => {
    let folderData = data;
    if (currentPath && fetchedFoldersData[currentPath]) {
      folderData = fetchedFoldersData[currentPath];
    }

    setNames(filterNames(folderData));
    setVersionsMap(getVersionsPerName((folderData || []) as AssetWithVersion[]));
  }, [currentPath, fetchedFoldersData, data]);

  const handleCreateFolder = useCallback(async (_: DialUploadFileItem | undefined, folderPath: string) => {
    const newPath = `${folderPath.replaceAll('//', '/')}/`;
    const emptyPrompt: DialPrompt = {
      name: '.dial_folder',
      folderId: newPath,
      version: '',
      content: '',
      path: `${newPath}.dial_folder`,
      nodeType: DialFileNodeType.ITEM,
    };

    return createPrompt(emptyPrompt);
  }, []);

  const handleCreatePromptModalClose = useCallback(() => {
    setIsCreatePromptModalOpen(false);
    setDestinationFolder(null);
  }, []);

  const handleCreatePromptModalOpen = useCallback((_?: string, currentFolder?: DialFile) => {
    setIsCreatePromptModalOpen(true);
    setDestinationFolder(currentFolder?.path || null);
  }, []);

  const handleCreatePrompt = useCallback(
    (prompt: DialPrompt, path?: string, isCreateDuplicate?: boolean) => {
      const folderPath = path || destinationFolder || `${ROOT_FOLDER}/`;
      return createPrompt({ ...prompt, folderId: folderPath }).then((res) => {
        if (res.success) {
          fetchFiles?.(folderPath);
          if (isCreateDuplicate) {
            showNotification(
              getSuccessNotification(
                getCreateNotificationTitle(ApplicationRoute.Prompts, t),
                getCreateNotificationDescription(ApplicationRoute.Prompts, `${prompt.name}__${prompt.version}`, t),
              ),
            );
            router.push(
              getUrnForEntity(ApplicationRoute.Prompts, {
                name: prompt.name,
                path: prompt.path,
              }),
            );
          }
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }

        handleCreatePromptModalClose();

        return res;
      });
    },
    [destinationFolder, fetchFiles, handleCreatePromptModalClose, showNotification, t, router],
  );

  const handleDuplicatePromptModalClose = useCallback(() => {
    setIsDuplicatePromptModalOpen(false);
  }, []);

  const handleDuplicatePromptModalOpen = useCallback(async (files?: DialFile[]) => {
    if (!files?.length) {
      return;
    }

    const { folderId, name = '', version } = files[0] as DialPrompt;
    const fullPrompt = await getPrompt(folderId, name, version, DEFAULT_ETAG);
    setDuplicatePrompt(fullPrompt?.response as AssetWithVersion);
    setIsDuplicatePromptModalOpen(true);
  }, []);

  const handleDuplicate = useCallback(
    (prompt: AssetWithVersion) => {
      const newPrompt = {
        ...prompt,
        path: `${prompt.folderId}${prompt.name}__${prompt.version}`,
      };
      handleCreatePrompt(newPrompt as DialPrompt, prompt.folderId, true);
      setIsDuplicatePromptModalOpen(false);
    },
    [handleCreatePrompt],
  );

  const handleMoveItems = useCallback(
    (items: DialCopiedItem[], sourceFolder: string, destinationFolder: string) => {
      const files = items.filter((file) => file.nodeType === DialFileNodeType.ITEM);
      const folders = items.filter((file) => file.nodeType === DialFileNodeType.FOLDER);

      const promises: (Promise<ServerActionResponse> | Promise<ServerActionResponse[]>)[] = [];
      files.forEach((file) => {
        if (sourceFolder !== destinationFolder) {
          // Move file
          const filePaths = [];
          const newPath = file.destinationUrl.replaceAll('//', '/').split('/').slice(0, -1).join('/');
          const paths = getAllSelectedItemsPaths(file.sourceUrl, selectedVersionsMap);
          filePaths.push(...paths.map((path) => path.replaceAll('//', '/')));
          promises.push(movePrompts(filePaths, newPath));
        } else {
          // Rename file
        }
      });
      folders.forEach((folder) => {
        promises.push(
          changeFolder(
            folder.sourceUrl.replaceAll('//', '/'),
            folder.destinationUrl.replaceAll('//', '/'),
            ResourceType.PROMPT,
          ),
        );
      });

      return Promise.all(promises);
    },
    [selectedVersionsMap],
  );

  const handleImportPromptModalClose = useCallback(() => {
    setIsImportPromptModalOpen(false);
    setDestinationFolder(null);
    setDragAndDropsItems([]);
  }, []);

  const handleImportPromptModalOpen = useCallback((_?: string, currentFolder?: DialFile, preselectedItems?: File[]) => {
    setIsImportPromptModalOpen(true);
    setDestinationFolder(currentFolder?.path || null);
    setDragAndDropsItems(preselectedItems || []);
  }, []);

  const onImport = useCallback(
    (
      fileType: ImportFileType,
      file: ImportData,
      conflictResolutionStrategy: string,
      _: string,
      ignorePaths?: boolean,
    ) => {
      let importFolder = destinationFolder || `${ROOT_FOLDER}/`;
      const { body } = getFormDataForImport(
        importFolder,
        file,
        fileType,
        conflictResolutionStrategy,
        void 0,
        ignorePaths,
        ApplicationRoute.Prompts,
      );

      importPrompts(body, fileType).then((res) => {
        if (res.success) {
          fetchFiles?.(importFolder);
          const { title, description } = getImportNotificationContent(
            ApplicationRoute.Files,
            file,
            fileType,
            importFolder,
            t,
          );
          showNotification(getSuccessNotification(title, description));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });

      handleImportPromptModalClose();
    },
    [destinationFolder, handleImportPromptModalClose, fetchFiles, showNotification, t],
  );

  const handleGridItemClick = useCallback(
    (file: FileManagerGridRow) => {
      router.push(
        getUrnForEntity(ApplicationRoute.Prompts, {
          name: file.name,
          path: file.path,
        }),
      );
    },
    [router],
  );

  const processPromptsData = useCallback(
    (assets: AssetWithVersion[]): AssetWithVersion[] => {
      const processedAssets = assets.map((asset) => {
        if (asset.nodeType === DialFileNodeType.FOLDER && asset.items) {
          return { ...asset, items: processPromptsData(asset.items) };
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

  const gridItemVersionsChange = useCallback(
    (value: string | string[], data: unknown) => {
      const promptData = data as AssetWithVersion;
      setSelectedVersionsMap({
        ...selectedVersionsMap,
        [`${promptData.folderId}${promptData.name}`]: Array.isArray(value) ? value : [value],
      });
    },
    [selectedVersionsMap],
  );

  const handleExportPromptModalOpen = useCallback((files?: DialFile[]) => {
    if (files?.length) {
      setIsExportPromptModalOpen(true);
      setExportedItems(files);
    }
  }, []);

  const handleExportPromptModalClose = useCallback(() => {
    setIsExportPromptModalOpen(false);
    setExportedItems(null);
  }, []);

  const onExport = useCallback(
    (fileType: ImportFileType) => {
      const filePaths: string[] = [];
      (exportedItems as AssetWithVersion[]).forEach((file) => {
        if (file.selectedVersions) {
          filePaths.push(...file.selectedVersions.map((version) => `${file.folderId}${file.name}__${version}`));
        } else {
          filePaths.push(file.path);
        }
      });

      exportPrompts(filePaths, fileType).then((res) => {
        if (fileType === ImportFileType.ARCHIVE) {
          const { blob, fileName } = res as { blob: Blob; fileName: string };
          downloadFile(blob, fileName);
        } else {
          downloadJson(res, getJsonFileName(ApplicationRoute.Prompts));
        }
        const { title, description } = getExportNotificationContent(
          ApplicationRoute.Prompts,
          exportedItems || [],
          t,
          filePaths,
        );
        showNotification(getSuccessNotification(title, description));
      });
      handleExportPromptModalClose();
    },
    [exportedItems, handleExportPromptModalClose, showNotification, t],
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

  const columnDefs = useMemo(() => {
    return getPromptGridColumns(gridItemVersionsChange, selectedVersionsMap, hasSelectedItems);
  }, [gridItemVersionsChange, hasSelectedItems, selectedVersionsMap]);

  const handleDeleteModalOpen = useCallback((items: DialFile[], parentFolderPath: string) => {
    setDestinationFolder(parentFolderPath);
    setDeleledItems(items);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteModalClose = useCallback(() => {
    setIsDeleteModalOpen(false);
    setDeleledItems(null);
    setDestinationFolder(null);
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

  const onDeleteFolder = useCallback(() => {
    const pathToRemove = deletedItems?.[0]?.path;
    if (pathToRemove) {
      removeFolder(pathToRemove).then((result) => {
        if (result.success) {
          const parentPath = destinationFolder || `${ROOT_FOLDER}/`;
          setFilePath(parentPath);
          fetchFiles(parentPath);
          removeSelection(pathToRemove);
          const { title, description } = getDeleteNotificationContent(
            ApplicationRoute.Prompts,
            deletedItems as DialFile[],
            t,
            parentPath,
          );
          showNotification(getSuccessNotification(title, description));
        }
      });
    }
  }, [deletedItems, destinationFolder, fetchFiles, setFilePath, removeSelection, showNotification, t]);

  const onMultipleRemove = useCallback(() => {
    setIsDeleteModalOpen(false);

    if (deletedItems) {
      const prompts = deletedItems.filter((item) => item.nodeType === DialFileNodeType.ITEM);
      const folders = deletedItems.filter((item) => item.nodeType === DialFileNodeType.FOLDER);

      const promises = [];
      if (prompts.length > 0) {
        const promptsPaths: { path: string }[] = [];
        prompts.forEach((prompt) => {
          const paths = getAllSelectedItemsPaths(prompt.path, selectedVersionsMap);
          promptsPaths.push(...paths.map((path) => ({ path: path })));
          const prefix = prompt.path.substring(0, prompt.path.lastIndexOf('__'));
          setSelectedVersionsMap({
            ...selectedVersionsMap,
            [prefix]: [],
          });
        });
        promises.push(bulkDeletePrompts(promptsPaths));
      }
      folders.forEach((folder) => {
        promises.push(removeFolder(folder.path));
      });

      return Promise.all(promises).then((result) => {
        const isSuccess = result.every((res) => res.success);
        if (isSuccess) {
          const parentPath = destinationFolder || `${ROOT_FOLDER}/`;
          fetchFiles(parentPath);
          setFilePath(parentPath);
          removeSelection(deletedItems?.map((item) => item.path));
          const { title, description } = getDeleteNotificationContent(
            ApplicationRoute.Prompts,
            deletedItems as DialFile[],
            t,
            parentPath,
          );
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
  ]);

  const onRemovePromptEndHandler = useCallback(() => {
    const parentPath = destinationFolder || `${ROOT_FOLDER}/`;
    setFilePath(parentPath);
    fetchFiles(parentPath);
    removeSelection(deletedItems?.map((item) => item.path));
  }, [destinationFolder, setFilePath, fetchFiles, deletedItems, removeSelection]);

  const handleOpenInNewTab = useCallback((file: DialFile) => {
    onOpenInNewTab(ApplicationRoute.Prompts, file);
  }, []);

  return (
    <>
      <FileManager
        label={t(MenuI18nKey.Prompts)}
        columnDefs={columnDefs}
        getContext={getPromptContext}
        view={ApplicationRoute.Prompts}
        onCreateFolder={handleCreateFolder}
        customDownloadItemsAction={handleExportPromptModalOpen}
        customUploadFileAction={handleImportPromptModalOpen}
        customCreateNewItemAction={handleCreatePromptModalOpen}
        customDuplicateAction={handleDuplicatePromptModalOpen}
        customDeleteItemsAction={handleDeleteModalOpen}
        onMoveItems={handleMoveItems}
        onOpenInNewTab={handleOpenInNewTab}
        onTableFileClick={handleGridItemClick}
        filterData={processPromptsData}
        nonClickableTableColumns={hasSelectedItems ? [FileManagerColumnKey.Version] : []}
        onPathChange={handlePathChange}
        onSelectedPathsChange={handleSelectedPathsChange}
        selectedPaths={selectedPaths}
        emptyStateTitle={t(FileManagerI18nKey.PromptEmptyStateTitle)}
        emptyStateDescription={t(FileManagerI18nKey.PromptEmptyStateDescription)}
      />
      {isImportPromptModalOpen && (
        <ImportModal
          route={ApplicationRoute.Prompts}
          getAssetContext={getPromptContext}
          isModalOpen={isImportPromptModalOpen}
          onClose={handleImportPromptModalClose}
          onApply={onImport}
          preselectedItems={dragAndDropsItems}
        />
      )}
      {isCreatePromptModalOpen && (
        <CreateEntity
          context={getPromptContext}
          route={ApplicationRoute.Prompts}
          isModalOpen={isCreatePromptModalOpen}
          createEntity={handleCreatePrompt}
          onClose={handleCreatePromptModalClose}
          names={names || []}
          versionsMap={versionsMap}
        />
      )}
      {isDuplicatePromptModalOpen && (
        <DuplicateAsset
          context={getPromptContext}
          view={ApplicationRoute.Prompts}
          entity={duplicatePrompt as AssetWithVersion}
          versionsMap={versionsMap}
          onDuplicate={handleDuplicate}
          isModalOpen={isDuplicatePromptModalOpen}
          onClose={handleDuplicatePromptModalClose}
        />
      )}
      {isDeleteModalOpen && deletedItems && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          itemsToDelete={deletedItems}
          versionsMap={versionsMap}
          getAssetContext={getPromptContext}
          onRemovePrompt={removePrompt}
          onRemoveFolder={onDeleteFolder}
          onMultipleRemove={onMultipleRemove}
          onClose={handleDeleteModalClose}
          onRemovePromptEnd={onRemovePromptEndHandler}
        />
      )}
      {isExportPromptModalOpen && (
        <ExportModal
          route={ApplicationRoute.Prompts}
          isModalOpen={isExportPromptModalOpen}
          onClose={handleExportPromptModalClose}
          onApply={onExport}
        />
      )}
    </>
  );
};

export default PromptsList;
