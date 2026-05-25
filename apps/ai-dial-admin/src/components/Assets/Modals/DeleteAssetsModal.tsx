'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import {
  ConfirmationPopupVariant,
  DialConfirmationPopup,
  DialFile,
  DialFileManager,
  DialFileNodeType,
  DialRootFolder,
  GridOptions,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import GridView from '@/src/components/Grid/GridView/GridView';
import {
  generateTreeForDeletingItems,
  getDeleteModalDescription,
  getDeleteModalTitle,
  getGridColumns,
  normalizePath,
  processAssetsData,
} from './utils';
import { ColDef } from 'ag-grid-community';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';

interface Props {
  view: ApplicationRoute;
  isOpen: boolean;
  itemsToDelete: DialFile[];
  selectedVersionsMap?: Record<string, string[]>;
  context: () => AssetsFolderContext;
  onRemove: () => void;
  onClose: () => void;
}

const DeleteAssetsModal: FC<Props> = ({
  view,
  isOpen,
  itemsToDelete,
  selectedVersionsMap,
  context,
  onRemove,
  onClose,
}) => {
  const t = useI18n();
  const [loadedPaths, setLoadedPaths] = useState(new Set(['']));
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set([`${t(FileManagerI18nKey.DeleteFolderTreeRootItem)}/`]),
  );
  const { files, fetchFiles, isFetchingFiles } = context();

  const { treeItems, pathMapping } = useMemo(() => {
    const proccessedTreeItems =
      view === ApplicationRoute.Files
        ? files
        : processAssetsData(files as AssetWithVersion[], selectedVersionsMap || {});
    return generateTreeForDeletingItems(
      proccessedTreeItems,
      itemsToDelete,
      t(FileManagerI18nKey.DeleteFolderTreeRootItem),
    );
  }, [files, itemsToDelete, view, selectedVersionsMap, t]);

  const hasFoldersToDelete = useMemo(() => {
    return itemsToDelete.some((item) => item.nodeType === DialFileNodeType.FOLDER);
  }, [itemsToDelete]);

  const handleOnPathChange = useCallback(
    (nextPath?: string) => {
      if (!nextPath) {
        return;
      }

      const normalizedPath = normalizePath(nextPath || '');
      const originalPath = pathMapping.get(normalizedPath) || '';

      if (originalPath && !loadedPaths.has(originalPath)) {
        fetchFiles(originalPath);
        setLoadedPaths((prev) => new Set(prev).add(originalPath));
      }

      const newExpanded = new Set(expandedFolders);
      newExpanded.add(nextPath);
      setExpandedFolders(newExpanded);
    },
    [fetchFiles, loadedPaths, pathMapping, expandedFolders],
  );

  const getDeleteModalContent = useCallback(() => {
    const columnDefs = getGridColumns(view, hasFoldersToDelete, selectedVersionsMap);

    return (
      <div className="px-6 dial-small mb-6">
        <p className="text-secondary mt-2 mb-6">
          {getDeleteModalDescription(view, t, itemsToDelete.length, hasFoldersToDelete)}
        </p>

        {!hasFoldersToDelete ? (
          <div className="max-h-[60vh] overflow-auto">
            <GridView
              columnDefs={columnDefs as ColDef[]}
              rowData={itemsToDelete}
              additionalGridOptions={{
                defaultColDef: {
                  floatingFilter: false,
                },
              }}
            />
          </div>
        ) : (
          <div className="h-[60vh]">
            <DialFileManager
              className="bg-layer-2 py-2 px-0 size-full grid-rows-[auto]"
              defaultPath={treeItems?.[0]?.path}
              rootItem={treeItems?.[0] as DialRootFolder}
              items={treeItems}
              onPathChange={handleOnPathChange}
              filesLoading={isFetchingFiles}
              emptyStateTitle={t(FileManagerI18nKey.EmptyFolderDescription)}
              emptyStateDescription={''}
              gridOptions={
                {
                  alternateOddRowColors: true,
                  columnDefs: columnDefs,
                } as GridOptions
              }
              treeOptions={{
                header: t(FileManagerI18nKey.FolderTree),
                expandedPaths: expandedFolders,
                onExpandedPathsChange: setExpandedFolders,
              }}
              navigationPanelOptions={{
                searchable: false,
              }}
            />
          </div>
        )}
      </div>
    );
  }, [
    itemsToDelete,
    view,
    hasFoldersToDelete,
    t,
    treeItems,
    handleOnPathChange,
    isFetchingFiles,
    selectedVersionsMap,
    expandedFolders,
    setExpandedFolders,
  ]);

  return (
    <DialConfirmationPopup
      header={getDeleteModalTitle(view, t, itemsToDelete.length, hasFoldersToDelete)}
      open={isOpen}
      confirmLabel={t(ButtonsI18nKey.Delete)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      variant={ConfirmationPopupVariant.Danger}
      onClose={onClose}
      onConfirm={onRemove}
      size={hasFoldersToDelete ? PopupSize.Lg : PopupSize.Md}
      className="bg-layer-2"
    >
      {getDeleteModalContent()}
    </DialConfirmationPopup>
  );
};

export default DeleteAssetsModal;
