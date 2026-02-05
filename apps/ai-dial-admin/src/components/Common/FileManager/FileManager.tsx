'use client';

import { FC } from 'react';

import { ColDef } from 'ag-grid-community';
import { DialFile, DialFileManager } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { ROOT_FOLDER } from '@/src/constants/file';
import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';

interface Props {
  title: string;
  columns: ColDef[];
}
const FileManager: FC<Props> = ({ title, columns }) => {
  const t = useI18n();

  return (
    <DialFileManager
      // title={title} // TODO: support UI kit
      className="bg-layer-2 py-4 px-6"
      path={path}
      defaultPath={`${ROOT_FOLDER}/`}
      items={files as DialFile[]}
      filesLoading={isFetchingFiles}
      showNavigationPanel={false}
      bulkActionsToolbarOptions={{
        getSelectionLabel: (selectedCount: number) => `${selectedCount} ${t(FileManagerI18nKey.SelectedItems)}`,
        actionLabels: {
          download: t(ButtonsI18nKey.Export),
          delete: t(ButtonsI18nKey.Delete),
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
          addSibling: t(FileManagerI18nKey.AddSibling),
          addChild: t(FileManagerI18nKey.AddChild),
          move: t(FileManagerI18nKey.Move),
          download: t(ButtonsI18nKey.Download),
          delete: t(ButtonsI18nKey.Delete),
          rename: 'Rename',
        },
      }}
      gridOptions={{
        columnDefs: columns,
        actionLabels: {
          move: t(FileManagerI18nKey.Move),
          download: t(ButtonsI18nKey.Download),
          delete: t(ButtonsI18nKey.Delete),
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
  );
};

export default FileManager;
