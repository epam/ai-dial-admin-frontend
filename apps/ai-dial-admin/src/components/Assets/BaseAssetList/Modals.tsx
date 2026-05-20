'use client';
import { FC } from 'react';

import ExportModal from '@/src/components/EntityListView/Export/ExportModal';
import ImportModal from '@/src/components/EntityListView/Import/ImportModal';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import DuplicateAsset from '@/src/components/Assets/Deployments/DuplicateAsset';
import DeleteModal from './DeleteModal';
import { ApplicationRoute } from '@/src/types/routes';
import { ModalType } from './types';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { ImportFileType } from '@/src/types/import';
import { ImportData } from '@/src/models/import-asset';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ServerActionResponse } from '@/src/models/server-action';
import { DialFile, DialUploadFileItem } from '@epam/ai-dial-ui-kit';

interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  modalType: ModalType | null;
  preselectedItems?: File[];
  names: string[];
  versionsMap: Record<string, string[]>;
  runners: DialApplicationScheme[];
  duplicateItem: AssetWithVersion | null;
  deletedItems: DialFile[] | null;
  getContext: () => AssetsFolderContext;
  onClose: () => void;
  onImport: (
    fileType: ImportFileType,
    file: ImportData,
    resolution: string,
    path: string,
    ignorePaths?: boolean,
  ) => void;
  onExport: (fileType: ImportFileType) => void;
  onCreate: (asset: AssetWithVersion) => Promise<ServerActionResponse>;
  onDuplicate: (entity: AssetWithVersion) => void;
  onRemove: (entity: string) => Promise<ServerActionResponse>;
  onDeleteFolder: () => void;
  onMultipleRemove: () => Promise<void>;
  onRemoveAssetEnd: () => void;
  onCreateFolder: (_: DialUploadFileItem | undefined, folderPath: string) => Promise<ServerActionResponse>;
}

const Modals: FC<Props> = ({
  view,
  isModalOpen,
  modalType,
  names,
  versionsMap,
  runners,
  preselectedItems,
  duplicateItem,
  deletedItems,
  getContext,
  onClose,
  onImport,
  onExport,
  onCreate,
  onDuplicate,
  onDeleteFolder,
  onRemove,
  onMultipleRemove,
  onRemoveAssetEnd,
  onCreateFolder,
}) => {
  return (
    <>
      {isModalOpen && modalType === ModalType.import && (
        <ImportModal
          route={view}
          getAssetContext={getContext}
          isModalOpen={isModalOpen}
          onClose={onClose}
          onApply={onImport}
          preselectedItems={preselectedItems}
        />
      )}
      {isModalOpen && modalType === ModalType.create && (
        <CreateEntity
          context={getContext}
          route={view}
          isModalOpen={isModalOpen}
          onClose={onClose}
          createEntity={onCreate}
          names={names || []}
          versionsMap={versionsMap}
          runners={runners}
          isModal
        />
      )}
      {isModalOpen && modalType === ModalType.duplicate && (
        <DuplicateAsset
          context={getContext}
          view={view}
          isModalOpen={isModalOpen}
          onClose={onClose}
          entity={duplicateItem as AssetWithVersion}
          versionsMap={versionsMap}
          onDuplicate={onDuplicate}
          onCreateFolder={onCreateFolder}
        />
      )}
      {isModalOpen && modalType === ModalType.delete && deletedItems && (
        <DeleteModal
          view={view}
          isOpen={isModalOpen}
          onClose={onClose}
          itemsToDelete={deletedItems}
          versionsMap={versionsMap}
          getAssetContext={getContext}
          onRemoveAsset={onRemove}
          onRemoveFolder={onDeleteFolder}
          onMultipleRemove={onMultipleRemove}
          onRemoveAssetEnd={onRemoveAssetEnd}
        />
      )}
      {isModalOpen && modalType === ModalType.export && (
        <ExportModal route={view} isModalOpen={isModalOpen} onClose={onClose} onApply={onExport} />
      )}
    </>
  );
};

export default Modals;
