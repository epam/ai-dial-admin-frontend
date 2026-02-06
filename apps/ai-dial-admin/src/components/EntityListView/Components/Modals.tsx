'use client';
import { FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import FilePathModal from '@/src/components/Common/FilePath/FilePathModal';
import DeleteFolder from '@/src/components/Common/FolderList/Modals/DeleteFolder';
import ExportModal from '@/src/components/EntityListView/Export/ExportModal';
import ImportModal from '@/src/components/EntityListView/Import/ImportModal';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { BasicI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { Asset } from '@/src/models/dial/deployment-asset';
import { ImportData } from '@/src/models/import-asset';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';

export enum ModalType {
  create = 'create',
  export = 'export',
  import = 'import',
  delete = 'delete',
  deleteBulk = 'deleteBulk',
  duplicate = 'duplicate',
  move = 'move',
  addVersion = 'add-version',
  compareVersions = 'compare-versions',
  createAsset = 'createAsset',
  createEntity = 'createEntity',
  build = 'build',
  saveNewVersion = 'saveNewVersion',
  createNewVersion = 'createNewVersion',
  install = 'install',
  globalFirewall = 'globalFirewall',
  addImage = 'addImage',
  createContainer = 'createContainer',
  createServingHF = 'createServingHF',
  createServingNIM = 'createServingNIM',
}

interface Props {
  entity?: BaseEntity;
  route: ApplicationRoute;
  initialPath?: string;
  isModalOpen: boolean;
  modalType?: ModalType;
  createModal?: ReactNode;
  duplicateModal?: ReactNode;
  existingVersions?: string[];
  onResetCurrentEntity?: () => void;
  onRemove?: (entity: string) => Promise<ServerActionResponse>;
  onExport?: (fileType?: ImportFileType) => void;
  onImport?: (
    fileType: ImportFileType,
    file: ImportData,
    resolution: string,
    path: string,
    ignorePaths?: boolean,
  ) => void;
  onMove?: (path: string) => void;
  onDeleteBulk?: () => void;
  onClose: () => void;
  getAssetContext?: () => AssetsFolderContext<Asset>;
}

const Modals: FC<Props> = ({
  entity,
  route,
  initialPath,
  isModalOpen,
  modalType,
  createModal,
  duplicateModal,
  existingVersions,
  onExport,
  onImport,
  onMove,
  onDeleteBulk,
  onClose,
  getAssetContext,
  onRemove,
}) => {
  const t = useI18n();

  return (
    <>
      {isModalOpen && modalType === ModalType.create && createPortal(createModal, document.body)}
      {isModalOpen &&
        modalType === ModalType.import &&
        createPortal(
          <ImportModal
            route={route}
            getAssetContext={getAssetContext}
            isModalOpen={isModalOpen}
            onClose={onClose}
            onApply={onImport}
          />,
          document.body,
        )}

      {isModalOpen &&
        modalType === ModalType.delete &&
        createPortal(
          <DeleteConfirmationModal
            entity={entity as object}
            view={route}
            onCloseModal={onClose}
            getAssetContext={getAssetContext}
            existingVersions={existingVersions}
            onRemoveEntity={onRemove as (entity: string) => Promise<ServerActionResponse>}
          />,
          document.body,
        )}
      {isModalOpen && modalType === ModalType.duplicate && createPortal(duplicateModal, document.body)}
      {isModalOpen &&
        modalType === ModalType.move &&
        createPortal(
          <FilePathModal
            modalTitle={t(BasicI18nKey.MoveToFolder)}
            isModalOpen={isModalOpen}
            onClose={onClose}
            onApply={onMove as () => void}
            initialPath={initialPath}
            context={getAssetContext}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.deleteBulk &&
        createPortal(
          <DeleteFolder
            view={route}
            isModalOpen={isModalOpen}
            onClose={onClose}
            onApply={onDeleteBulk}
            context={getAssetContext}
            isBulkDelete={true}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.export &&
        createPortal(
          <ExportModal route={route} isModalOpen={isModalOpen} onClose={onClose} onApply={onExport} />,
          document.body,
        )}
    </>
  );
};

export default Modals;
