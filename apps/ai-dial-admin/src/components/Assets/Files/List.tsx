'use client';

import { FC, useCallback, useState, useRef, useEffect } from 'react';

import { useI18n } from '@/src/locales/client';
import { createFolderWithFiles } from '@/src/app/[lang]/folders-storage/actions';
import { ImportResult } from '@/src/models/import';
import { getImportResults } from '@/src/components/EntityListView/Import/utils';

// import { bulkDeleteFiles, moveFiles, removeFile } from '@/src/app/[lang]/files/actions';
// import { FILES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
// import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import Page403 from '@/src/components/Page403/Page403';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
// import { ApplicationRoute } from '@/src/types/routes';
// import { getGridFileData } from '@/src/utils/files/grid-data';
import { getFormDataForImport, getImportTitle } from '@/src/components/EntityListView/HeaderButtons/utils';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
// import { DialRule } from '@/src/models/dial/rule';
// import { ImportResult } from '@/src/models/import';
// import { ImportData } from '@/src/models/import-asset';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { getSuccessNotification } from '@/src/utils/notification';
import { useNotification } from '@/src/context/NotificationContext';
import {
  // BasicI18nKey,
  FoldersI18nKey,
} from '@/src/constants/i18n';
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
} from '@epam/ai-dial-ui-kit';

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
  }, [files, fetchFiles]);

  const [path, setPath] = useState('');
  const [loadedPaths, setLoadedPaths] = useState(new Set(['']));

  const getReqRef = useRef(useProtectedRequest());
  const { showNotification } = useNotification();

  const handleCreateFolder = useCallback(
    async (file: DialUploadFileItem, parentPath: string) => {
      // file arg is not used, because folder with empty file is not created
      const filename = '.dial-folder';
      const fileType = 'text/plain';
      const emptyFile = new File(['1'], filename, {
        type: fileType,
      });

      const body = getFormDataForImport(
        `${parentPath.replaceAll('//', '/')}/`,
        [emptyFile],
        ImportFileType.FILES,
        ConflictResolutionPolicy.SKIP,
        [],
        false,
        ApplicationRoute.Files,
      ).body;

      getReqRef.current(createFolderWithFiles, body, ImportFileType.FILES, view).then((res) => {
        if (res.success) {
          fetchFiles?.(`${ROOT_FOLDER}/`, true);
          const results = (res.response as { importResults: ImportResult[] }).importResults;
          const translatedType = t(getImportTitle(view)).toLowerCase();
          showNotification(getSuccessNotification(t(FoldersI18nKey.FolderCreateSuccess)));
          getImportResults(results, getFolderName(path) as string, translatedType, t, showNotification);
        }
      });
    },
    [fetchFiles, path, showNotification, t, view],
  );

  const handleOnPathChange = useCallback((nextPath: string | undefined) => {
    if (!nextPath) {
      return;
    }

    setPath(nextPath);
    setLoadedPaths((prev) => new Set(prev).add(nextPath));
  }, []);

  const handleUploadFiles = useCallback((files: DialUploadFileItem[], destinationFolder: string) => {
    alert(
      `Uploaded ${files.length} file(s) to ${destinationFolder}:\n${files
        .map((f) => `${f.name} (${(f.fileContent.size / 1024).toFixed(2)} KB)`)
        .join('\n')}`,
    );
  }, []);

  const handleAddChild = useCallback((files: DialFile[]) => {
    alert(`Adding child to: ${files.map((f) => f.name).join(',')}`);
  }, []);

  const handleAddSibling = useCallback((files: DialFile[]) => {
    alert(`Adding sibling to: ${files.map((f) => f.name).join(',')}`);
  }, []);

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

  return (
    <>
      <h1>Files</h1>
      <DialFileManager
        items={files as DialFile[]}
        path={path}
        filesLoading={isFetchingFiles}
        showNavigationPanel={false}
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
        onUploadFiles={handleUploadFiles}
        onCreateFolderValidate={handleCreateFolderValidate}
        folderCreationValidationMessages={{
          emptyName: 'Please enter a folder name',
          duplicateName: 'A folder with this name already exists in this location',
        }}
      />
    </>
  );
};

export default FilesList;
