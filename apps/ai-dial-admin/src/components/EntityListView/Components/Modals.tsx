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
import { DialFile } from '@/src/models/dial/file';
import { ParsedPrompts } from '@/src/models/prompts';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { Asset } from '@/src/models/dial/deployment-asset';

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
}

interface Props {
  entity?: BaseEntity;
  route: ApplicationRoute;
  initialPath?: string;
  isModalOpen: boolean;
  modalType?: ModalType;
  createModal?: ReactNode;
  duplicateModal?: ReactNode;
  resetCurrentEntity?: () => void;
  removeEntity?: (entity: string) => Promise<ServerActionResponse>;
  handleExport?: (fileType?: ImportFileType) => void;
  handleImport?: (
    fileType: ImportFileType,
    file: File | File[] | ParsedPrompts,
    resolution: string,
    path: string,
    ignorePaths?: boolean,
  ) => void;
  handleMove?: (path: string) => void;
  handleDeleteBulk?: () => void;
  handleClose: () => void;
  context?: () => AssetsFolderContext<Asset | DialFile>;
}

const Modals: FC<Props> = ({
  entity,
  route,
  initialPath,
  isModalOpen,
  modalType,
  createModal,
  duplicateModal,
  handleExport,
  handleImport,
  handleMove,
  handleDeleteBulk,
  handleClose,
  context,
  removeEntity,
}) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;

  return (
    <>
      {isModalOpen && modalType === ModalType.create && createPortal(createModal, document.body)}
      {isModalOpen &&
        modalType === ModalType.import &&
        createPortal(
          <ImportModal
            route={route}
            context={context}
            isModalOpen={isModalOpen}
            onClose={handleClose}
            onApply={handleImport}
          />,
          document.body,
        )}

      {isModalOpen &&
        modalType === ModalType.delete &&
        createPortal(
          <DeleteConfirmationModal
            entity={entity as object}
            view={route}
            onCloseModal={handleClose}
            context={context}
            removeEntity={removeEntity as (entity: string) => Promise<ServerActionResponse>}
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
            onClose={handleClose}
            onApply={handleMove as () => void}
            initialPath={initialPath}
            context={context}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.deleteBulk &&
        createPortal(
          <DeleteFolder
            view={route}
            isModalOpen={isModalOpen}
            onClose={handleClose}
            onApply={handleDeleteBulk}
            context={context}
            isBulkDelete={true}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.export &&
        createPortal(
          <ExportModal route={route} isModalOpen={isModalOpen} onClose={handleClose} onApply={handleExport} />,
          document.body,
        )}
    </>
  );
};

export default Modals;
