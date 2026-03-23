'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import FileManager from '@/src/components/Common/FileManager/FileManager';
import {
  bulkDeletePrompts,
  createPrompt,
  exportPrompts,
  getPrompt,
  movePrompts,
} from '@/src/app/[lang]/prompts/actions';
import { importPrompts } from '@/src/utils/prompts/import-prompts';
import { getVersionsPerName } from '@/src/components/Assets/utils';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { ApplicationRoute } from '@/src/types/routes';
import { DialPrompt } from '@/src/models/dial/prompt';
import { useI18n } from '@/src/locales/client';
import { FoldersI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import {
  DialCopiedItem,
  DialDeletedItem,
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
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { getAllSelectedItemsPaths, getPromptGridColumns } from './utils';
import { downloadJson } from '@/src/utils/download';
import { getJsonFileName } from '@/src/utils/import/get-json-name';

const PromptsList: FC = () => {
  const [isCreatePromptModalOpen, setIsCreatePromptModalOpen] = useState(false);
  const [isDuplicatePromptModalOpen, setIsDuplicatePromptModalOpen] = useState(false);
  const [isImportPromptModalOpen, setIsImportPromptModalOpen] = useState(false);
  const [destinationFolder, setDestinationFolder] = useState<string | null>(null);
  const [duplicatePrompt, setDuplicatePrompt] = useState<AssetWithVersion | null>(null);
  const [selectedVersionsMap, setSelectedVersionsMap] = useState<Record<string, string[]>>({});
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [versionsMap, setVersionsMap] = useState<Record<string, string[]>>({});
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const getPromptContext = useCallback(() => {
    return usePromptFolder();
  }, []);
  const { data, fetchFiles, fetchedFoldersData } = getPromptContext();

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
      version: '0',
      content: '',
      path: `${newPath}.dial_folder`,
      nodeType: DialFileNodeType.ITEM,
    };

    return createPrompt(emptyPrompt);
  }, []);

  const handleDeleteItems = useCallback(
    async (fileNodes: DialDeletedItem[]) => {
      const files = fileNodes.filter((file) => file.nodeType === DialFileNodeType.ITEM);
      const folders = fileNodes.filter((file) => file.nodeType === DialFileNodeType.FOLDER);

      const promises = [];
      if (files.length > 0) {
        const filePaths: { path: string }[] = [];
        files.forEach((file) => {
          const paths = getAllSelectedItemsPaths(file.sourceUrl, selectedVersionsMap);
          filePaths.push(...paths.map((path) => ({ path: path })));
          const prefix = file.sourceUrl.substring(0, file.sourceUrl.lastIndexOf('__'));
          setSelectedVersionsMap({
            ...selectedVersionsMap,
            [prefix]: [],
          });
        });
        promises.push(bulkDeletePrompts(filePaths));
      }
      folders.forEach((folder) => {
        promises.push(removeFolder(folder.sourceUrl));
      });

      return Promise.all(promises);
    },
    [selectedVersionsMap],
  );

  const handleCreatePromptModalClose = useCallback(() => {
    setIsCreatePromptModalOpen(false);
    setDestinationFolder(null);
  }, []);

  const handleCreatePromptModalOpen = useCallback((_?: string, currentFolder?: DialFile) => {
    setIsCreatePromptModalOpen(true);
    setDestinationFolder(currentFolder?.path || null);
  }, []);

  const handleCreatePrompt = useCallback(
    (prompt: DialPrompt, path?: string) => {
      const folderPath = path || destinationFolder || `${ROOT_FOLDER}/`;
      return createPrompt({ ...prompt, folderId: folderPath }).then((res) => {
        if (res.success) {
          fetchFiles?.(folderPath);
          showNotification(getSuccessNotification(t(FoldersI18nKey.Import)));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }

        handleCreatePromptModalClose();

        return res;
      });
    },
    [destinationFolder, fetchFiles, handleCreatePromptModalClose, showNotification, t],
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
      handleCreatePrompt(newPrompt as DialPrompt, prompt.folderId);
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
  }, []);

  const handleImportPromptModalOpen = useCallback((_?: string, currentFolder?: DialFile) => {
    setIsImportPromptModalOpen(true);
    setDestinationFolder(currentFolder?.path || null);
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
          showNotification(getSuccessNotification(t(FoldersI18nKey.Import)));
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

  const onExport = useCallback((files: DialFile[]) => {
    const filePaths: string[] = [];
    (files as AssetWithVersion[]).forEach((file) => {
      if (file.selectedVersions) {
        filePaths.push(...file.selectedVersions.map((version) => `${file.folderId}${file.name}__${version}`));
      } else {
        filePaths.push(file.path);
      }
    });

    return exportPrompts(filePaths).then((res) => {
      downloadJson(res, getJsonFileName(ApplicationRoute.Prompts));
    });
  }, []);

  const handlePathChange = useCallback((nextPath?: string) => {
    if (nextPath) {
      setCurrentPath(nextPath);
    }
  }, []);

  return (
    <>
      <FileManager
        label={t(MenuI18nKey.Prompts)}
        columnDefs={getPromptGridColumns(gridItemVersionsChange, selectedVersionsMap)}
        getContext={getPromptContext}
        view={ApplicationRoute.Prompts}
        onCreateFolder={handleCreateFolder}
        onDeleteItems={handleDeleteItems}
        onExport={onExport}
        customUploadFileAction={handleImportPromptModalOpen}
        customCreateNewItemAction={handleCreatePromptModalOpen}
        customDuplicateAction={handleDuplicatePromptModalOpen}
        onMoveItems={handleMoveItems}
        onTableFileClick={handleGridItemClick}
        filterData={processPromptsData}
        nonClickableTableColumns={[FileManagerColumnKey.Version]}
        onPathChange={handlePathChange}
      />
      {isImportPromptModalOpen && (
        <ImportModal
          route={ApplicationRoute.Prompts}
          getAssetContext={getPromptContext}
          isModalOpen={isImportPromptModalOpen}
          onClose={handleImportPromptModalClose}
          onApply={onImport}
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
    </>
  );
};

export default PromptsList;
