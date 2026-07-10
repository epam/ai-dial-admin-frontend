'use client';
import { FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import ImportModal from '@/src/components/EntityListView/Import/ImportModal';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { BaseEntity } from '@/src/models/dial/base-entity';
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
  stopBuild = 'stopBuild',
  globalFirewall = 'globalFirewall',
  addImage = 'addImage',
  createContainer = 'createContainer',
  createServingHF = 'createServingHF',
  createServingNIM = 'createServingNIM',
  createMcpDockerImage = 'createMcpDockerImage',
  createAdapterDockerImage = 'createAdapterDockerImage',
  createApplicationDockerImage = 'createApplicationDockerImage',
  createInterceptorDockerImage = 'createInterceptorDockerImage',
  createMcpRegistry = 'createMcpRegistry',
  addImageFromMcpRegistry = 'addImageFromMcpRegistry',
  runTestSuite = 'runTestSuite',
}

interface Props {
  entity?: BaseEntity;
  route: ApplicationRoute;
  isModalOpen: boolean;
  modalType?: ModalType;
  createModal?: ReactNode;
  duplicateModal?: ReactNode;
  existingVersions?: string[];
  onResetCurrentEntity?: () => void;
  onRemove?: (entity: string) => Promise<ServerActionResponse>;
  onImport?: (
    fileType: ImportFileType,
    file: ImportData,
    resolution: string,
    path: string,
    ignorePaths?: boolean,
  ) => void;
  onClose: () => void;
  getAssetContext?: () => AssetsFolderContext;
  preselectedItems?: File[];
}

const Modals: FC<Props> = ({
  entity,
  route,
  isModalOpen,
  modalType,
  createModal,
  duplicateModal,
  existingVersions,
  preselectedItems,
  onImport,
  onClose,
  getAssetContext,
  onRemove,
}) => {
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
            preselectedItems={preselectedItems}
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
    </>
  );
};

export default Modals;
