'use client';
import { FC } from 'react';

import ExportModal from '@/src/components/EntityListView/Export/ExportModal';
import ImportModal from '@/src/components/EntityListView/Import/ImportModal';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import DuplicateAsset from '@/src/components/Assets/Deployments/DuplicateAsset';
import { ApplicationRoute } from '@/src/types/routes';
import { ModalType } from './types';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { ImportFileType } from '@/src/types/import';
import { ImportData } from '@/src/models/import-asset';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ServerActionResponse } from '@/src/models/server-action';
import { DialFile, DialUploadFileItem } from '@epam/ai-dial-ui-kit';
import DeleteAssetsModal from '../Modals/DeleteAssetsModal';

interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  modalType: ModalType | null;
  preselectedItems?: File[];
  names?: string[];
  versionsMap?: Record<string, string[]>;
  selectedVersionsMap?: Record<string, string[]>;
  runners?: DialApplicationScheme[];
  duplicateItem?: AssetWithVersion | null;
  deletedItems?: DialFile[] | null;
  hasSelectedItems: boolean;
  getContext: () => AssetsFolderContext;
  onClose: () => void;
  onImport?: (
    fileType: ImportFileType,
    file: ImportData,
    resolution: string,
    path: string,
    ignorePaths?: boolean,
  ) => void;
  onExport?: (fileType: ImportFileType) => void;
  onCreate?: (asset: AssetWithVersion) => Promise<ServerActionResponse>;
  onDuplicate?: (entity: AssetWithVersion) => void;
  onRemove: () => Promise<void>;
  onCreateFolder?: (_: DialUploadFileItem | undefined, folderPath: string) => Promise<ServerActionResponse>;
}

const Modals: FC<Props> = ({
  view,
  isModalOpen,
  modalType,
  names,
  versionsMap,
  selectedVersionsMap,
  runners,
  preselectedItems,
  duplicateItem,
  deletedItems,
  hasSelectedItems = false,
  getContext,
  onClose,
  onImport,
  onExport,
  onCreate,
  onDuplicate,
  onRemove,
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
        <DeleteAssetsModal
          context={getContext}
          view={view}
          isOpen={isModalOpen}
          onClose={onClose}
          itemsToDelete={deletedItems}
          onRemove={onRemove}
          selectedVersionsMap={hasSelectedItems ? selectedVersionsMap : undefined}
        />
      )}
      {isModalOpen && modalType === ModalType.export && (
        <ExportModal route={view} isModalOpen={isModalOpen} onClose={onClose} onApply={onExport} />
      )}
    </>
  );
};

export default Modals;
