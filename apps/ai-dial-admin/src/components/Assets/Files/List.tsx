'use client';

import { FC, useCallback, useState, useEffect } from 'react';

import { useI18n } from '@/src/locales/client';
import { changeFolder, createFolderWithFiles, removeFolder } from '@/src/app/[lang]/folders-storage/actions';
import { ImportResult } from '@/src/models/import';
import { getImportResults } from '@/src/components/EntityListView/Import/utils';

import { bulkDeleteFiles, moveFiles, exportFiles, importFiles } from '@/src/app/[lang]/files/actions';
import Page403 from '@/src/components/Page403/Page403';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { getFormDataForImport, getImportTitle } from '@/src/components/EntityListView/HeaderButtons/utils';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { getSuccessNotification } from '@/src/utils/notification';
import { useNotification } from '@/src/context/NotificationContext';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { getFolderName } from '@/src/utils/files/folder';
import { ApplicationRoute } from '@/src/types/routes';
import { ROOT_FOLDER } from '@/src/constants/file';
import {
  DialFile,
  DialFileManager,
  DialUploadFileItem,
  NAME_COLUMN,
  UPDATED_AT_COLUMN,
  SIZE_COLUMN,
  DialCopiedItem,
  DialDeletedItem,
} from '@epam/ai-dial-ui-kit';
import { DialFileNodeType } from '@/src/models/dial/file';
import { ResourceType } from '@/src/types/resource-type';
import { ServerActionResponse } from '@/src/models/server-action';
import { downloadFile } from '@/src/utils/download';

const FILES_GRID_COLUMNS = [NAME_COLUMN('Display name'), UPDATED_AT_COLUMN('Updated time'), SIZE_COLUMN('Size')];

interface Props {
  view?: ApplicationRoute;
}

const FilesList: FC<Props> = ({ view = ApplicationRoute.Files }) => {
  const t = useI18n();
  const { files, fetchFiles, isFetchingFiles } = useFileFolder();

  if (files == null) {
    return <Page403 />;
  }

  useEffect(() => {
    if (files == null || files?.length === 0) {
      fetchFiles(`${ROOT_FOLDER}/`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const [path, setPath] = useState('');
  const [loadedPaths, setLoadedPaths] = useState(new Set(['']));

  const { showNotification } = useNotification();

  useEffect(() => {
    if (path) {
      fetchFiles?.(path, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const handleCreateFolder = useCallback(
    async (file: DialUploadFileItem, parentPath: string) => {
      // file arg is not used, because folder with empty file is not created
      const filename = '.dial-folder';
      const fileType = 'text/plain';
      const emptyFile = new File(['1'], filename, {
        type: fileType,
      });
      const newPath = `${parentPath.replaceAll('//', '/')}/`;

      const body = getFormDataForImport(
        newPath,
        [emptyFile],
        ImportFileType.FILES,
        ConflictResolutionPolicy.SKIP,
        void 0,
        false,
        ApplicationRoute.Files,
      ).body;

      createFolderWithFiles(body, ImportFileType.FILES, view).then((res) => {
        if (res.success) {
          fetchFiles?.(path, true);
          setPath(path);
          const results = (res.response as { importResults: ImportResult[] }).importResults;
          const translatedType = t(getImportTitle(view)).toLowerCase();
          showNotification(getSuccessNotification(t(FoldersI18nKey.FolderCreateSuccess)));
          getImportResults(results, getFolderName(path) as string, translatedType, t, showNotification);
        }
      });
    },
    [fetchFiles, path, showNotification, t, view],
  );

  const handleImportFiles = useCallback(
    async (files: DialUploadFileItem[], destinationFolder: string) => {
      const promises: Promise<ServerActionResponse>[] = [];
      files.forEach((file) => {
        const body = getFormDataForImport(
          destinationFolder,
          [file.fileContent],
          ImportFileType.FILES,
          ConflictResolutionPolicy.SKIP,
          [],
          false,
          view,
        ).body;

        promises.push(importFiles(body, ImportFileType.FILES));
      });

      Promise.all(promises).then((result) => {
        const isSuccess = result.every((res) => res.success);
        if (isSuccess) {
          fetchFiles?.(`${ROOT_FOLDER}/`, true);
          showNotification(getSuccessNotification(t(FoldersI18nKey.Import)));
        }
      });
    },
    [fetchFiles, showNotification, t, view],
  );

  const handleImportArchive = useCallback(
    async (file: File, name: string, destinationFolder: string) => {
      const body = getFormDataForImport(
        destinationFolder,
        [file],
        ImportFileType.ARCHIVE,
        ConflictResolutionPolicy.SKIP,
        [],
        false,
        view,
      ).body;

      importFiles(body, ImportFileType.ARCHIVE).then((res) => {
        if (res.success) {
          fetchFiles?.(`${ROOT_FOLDER}/`, true);
          showNotification(getSuccessNotification(t(FoldersI18nKey.Import)));
        }
      });
    },
    [fetchFiles, showNotification, t, view],
  );

  const handleOnPathChange = useCallback((nextPath: string | undefined) => {
    if (!nextPath) {
      return;
    }

    setPath(nextPath);
    setLoadedPaths((prev) => new Set(prev).add(nextPath));
  }, []);

  const handleFolderPopupPathChange = useCallback((nextPath: string | undefined) => {
    console.log(nextPath);
  }, []);

  const handleAddChild = useCallback(
    (files: DialFile[]) => {
      const newPath = files[0].path + 'New Folder';
      handleCreateFolder(files[0], newPath);
    },
    [handleCreateFolder],
  );

  const handleAddSibling = useCallback(
    (files: DialFile[]) => {
      const newPath = files[0].path.replace(/([^/]+)\/?$/, 'New Folder');
      handleCreateFolder(files[0], newPath);
    },
    [handleCreateFolder],
  );

  const handleCreateFolderValidate = useCallback((name: string) => {
    const forbiddenChars = /[<>:"/\\|?*]/;
    if (forbiddenChars.test(name)) {
      return 'Folder name contains forbidden characters: < > : " / \\ | ? *';
    }

    return null;
  }, []);

  const handleCopyFiles = useCallback((items: DialCopiedItem[], destinationFolder: string) => {
    alert(
      `Copied ${items.length} file(s) to ${destinationFolder}:\n${items
        .map((f) => `${f.sourceUrl} -> ${f.destinationUrl} (overwrite: ${f.overwrite})`)
        .join('\n')}`,
    );
  }, []);

  const handleDownloadFiles = useCallback(async (files: DialFile[]) => {
    const filePaths = files.map((file) => file.path);
    exportFiles(filePaths).then((res) => {
      const { blob, fileName } = res as { blob: Blob; fileName: string };
      downloadFile(blob, fileName);
    });
  }, []);

  const handleDeleteFileNodes = useCallback(
    async (fileNodes: DialDeletedItem[]) => {
      const files = fileNodes.filter((file) => file.nodeType === DialFileNodeType.ITEM);
      const folders = fileNodes.filter((file) => file.nodeType === DialFileNodeType.FOLDER);

      const promises = [];
      if (files.length > 0) {
        const filePaths = files.map((file) => ({ path: file.sourceUrl }));
        promises.push(bulkDeleteFiles(filePaths));
      }
      folders.forEach((folder) => {
        promises.push(removeFolder(folder.sourceUrl));
      });

      Promise.all(promises).then((result) => {
        const isSuccess = result.every((res) => res.success);
        if (isSuccess) {
          fetchFiles?.(`${ROOT_FOLDER}/`, true);
        }
      });
    },
    [fetchFiles],
  );

  const handleMoveToFiles = useCallback(
    async (items: DialCopiedItem[], sourceFolder: string, destinationFolder: string) => {
      const files = items.filter((file) => file.nodeType === DialFileNodeType.ITEM);
      const folders = items.filter((file) => file.nodeType === DialFileNodeType.FOLDER);

      const promises: (Promise<ServerActionResponse> | Promise<ServerActionResponse[]>)[] = [];
      files.forEach((file) => {
        if (sourceFolder !== destinationFolder) {
          // Move file
          const newPath = file.destinationUrl.replaceAll('//', '/').split('/').slice(0, -1).join('/');
          promises.push(moveFiles([file.sourceUrl.replaceAll('//', '/')], newPath));
        } else {
          // Rename file
        }
      });
      folders.forEach((folder) => {
        promises.push(
          changeFolder(
            folder.sourceUrl.replaceAll('//', '/'),
            folder.destinationUrl.replaceAll('//', '/'),
            ResourceType.FILE,
          ),
        );
      });

      Promise.all(promises).then((result) => {
        const isSuccess = result.every((res) => res.success);
        if (isSuccess) {
          fetchFiles?.(destinationFolder, true);
          fetchFiles?.(sourceFolder, true);
        }
      });
    },
    [fetchFiles],
  );

  return (
    <>
      <DialFileManager
        title={'Files'}
        className={'bg-layer-2'}
        path={path}
        defaultPath={`${ROOT_FOLDER}/`}
        items={files as DialFile[]}
        filesLoading={isFetchingFiles}
        showNavigationPanel={false}
        bulkActionsToolbarOptions={{
          getSelectionLabel: (selectedCount: number) => `${selectedCount} item(s) selected`,
          actionLabels: {
            move: 'Move to',
            download: 'Export',
            delete: 'Delete',
          },
        }}
        toolbarOptions={{
          showHiddenFilesToggle: false,
          newActions: {
            newFolder: { label: 'Folder', icon: null },
            uploadFiles: { label: 'File', icon: null },
          },
          newButtonLabel: 'Create',
        }}
        treeOptions={{
          collapsed: false,
          expandedPaths: new Set<string>([`${ROOT_FOLDER}/`]),
          loadedPaths,
          loadingPaths: isFetchingFiles ? new Set<string>([ROOT_FOLDER]) : new Set<string>(),
          actionLabels: {
            addSibling: 'Add Sibling',
            addChild: 'Add Child',
            duplicate: 'Duplicate',
            copy: 'Copy to',
            move: 'Move to',
            download: 'Download',
            delete: 'Delete',
            rename: 'Rename',
          },
        }}
        gridOptions={{
          columnDefs: FILES_GRID_COLUMNS,
          actionLabels: {
            addSibling: 'Add Sibling',
            addChild: 'Add Child',
            duplicate: 'Duplicate',
            copy: 'Copy to',
            move: 'Move to',
            download: 'Download',
            delete: 'Delete',
            rename: 'Rename',
          },
        }}
        onPathChange={handleOnPathChange}
        onAddChild={handleAddChild}
        onAddSibling={handleAddSibling}
        onCopyFiles={handleCopyFiles}
        onCreateFolder={handleCreateFolder}
        onUploadFiles={handleImportFiles}
        onUploadArchive={handleImportArchive}
        onDownloadFiles={handleDownloadFiles}
        onCreateFolderValidate={handleCreateFolderValidate}
        onDeleteFiles={handleDeleteFileNodes}
        onMoveToFiles={handleMoveToFiles}
        onFolderPopupPathChange={handleFolderPopupPathChange}
        folderCreationValidationMessages={{
          emptyName: 'Please enter a folder name',
          duplicateName: 'A folder with this name already exists in this location',
        }}
        renameValidationMessages={{
          emptyName: 'Please enter a folder name',
          duplicateName: 'A folder with this name already exists in this location',
        }}
      />
    </>
  );
};

export default FilesList;
