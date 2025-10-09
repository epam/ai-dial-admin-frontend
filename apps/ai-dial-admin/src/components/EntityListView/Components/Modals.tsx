'use client';
import { FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DialConfirmationPopup } from '@epam/ai-dial-ui-kit';

import DeleteAdapter from '@/src/components/Adapter/Modals/DeleteAdapter';
import DeleteAppRunner from '@/src/components/ApplicationRunners/Modals/DeleteAppRunner';
import FilePathModal from '@/src/components/Common/FilePath/FilePathModal';
import DeleteFolder from '@/src/components/Common/FolderList/Modals/DeleteFolder';
import { deleteModalTitleMap } from '@/src/components/EntityListView/constants';
import ExportModal from '@/src/components/EntityListView/Export/ExportModal';
import ImportModal from '@/src/components/EntityListView/Import/ImportModal';
import DeleteInterceptorTemplate from '@/src/components/InterceptorTemplates/Modals/Delete';
import { BasicI18nKey, ButtonsI18nKey, DeleteI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialFile } from '@/src/models/dial/file';
import { ParsedPrompts } from '@/src/models/prompts';
import { ImportFileType } from '@/src/types/import';
import { PopUpState } from '@/src/types/pop-up';
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
}

interface Props {
  entity?: BaseEntity;
  route?: ApplicationRoute;
  initialPath?: string;
  modalState: PopUpState;
  modalType?: ModalType;
  createModal?: ReactNode;
  duplicateModal?: ReactNode;
  handleExport?: (fileType?: ImportFileType) => void;
  handleImport?: (
    fileType: ImportFileType,
    file: File | File[] | ParsedPrompts,
    resolution: string,
    path: string,
    ignorePaths?: boolean,
  ) => void;
  handleMove?: (path: string) => void;
  handleDelete?: () => void;
  handleDeleteBulk?: () => void;
  handleClose: () => void;
  context?: () => AssetsFolderContext<DialFile>;
}

const Modals: FC<Props> = ({
  entity,
  route,
  initialPath,
  modalState,
  modalType,
  createModal,
  duplicateModal,
  handleExport,
  handleImport,
  handleMove,
  handleDelete,
  handleDeleteBulk,
  handleClose,
  context,
}) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;

  return (
    <>
      {modalState === PopUpState.Opened && modalType === ModalType.create && createPortal(createModal, document.body)}
      {modalState === PopUpState.Opened &&
        modalType === ModalType.import &&
        createPortal(
          <ImportModal
            route={route}
            context={context}
            modalState={modalState}
            onClose={() => {
              handleClose();
            }}
            onApply={handleImport}
          />,
          document.body,
        )}

      {modalState === PopUpState.Opened &&
        modalType === ModalType.delete &&
        createPortal(
          <DialConfirmationPopup
            open={true}
            title={`${t(DeleteI18nKey.Title)} ${t(deleteModalTitleMap[route as keyof typeof deleteModalTitleMap])}`}
            onConfirm={handleDelete as () => void}
            confirmLabel={t(ButtonsI18nKey.Delete)}
            onClose={handleClose}
          >
            {entity &&
              (route === ApplicationRoute.ApplicationRunners ? (
                <DeleteAppRunner entity={entity} />
              ) : route === ApplicationRoute.Adapters ? (
                <DeleteAdapter entity={entity} />
              ) : route === ApplicationRoute.InterceptorTemplates ? (
                <DeleteInterceptorTemplate template={entity} />
              ) : (
                <p className="text-secondary small-150 px-6 py-4">
                  <span>{t(DeleteI18nKey.Confirming)}</span>
                  {entity.displayName || entity.name ? (
                    <span className="important-text-part mr-1">{entity.displayName || entity.name}</span>
                  ) : null}
                  <span>{t(deleteModalTitleMap[route as keyof typeof deleteModalTitleMap])}?</span>
                </p>
              ))}
          </DialConfirmationPopup>,
          document.body,
        )}
      {modalState === PopUpState.Opened &&
        modalType === ModalType.duplicate &&
        createPortal(duplicateModal, document.body)}
      {modalState === PopUpState.Opened &&
        modalType === ModalType.move &&
        createPortal(
          <FilePathModal
            modalTitle={t(BasicI18nKey.MoveToFolder)}
            modalState={modalState}
            onClose={handleClose}
            onApply={handleMove as () => void}
            initialPath={initialPath}
            context={context}
          />,
          document.body,
        )}
      {modalState === PopUpState.Opened &&
        modalType === ModalType.deleteBulk &&
        createPortal(
          <DeleteFolder
            view={route}
            modalState={modalState}
            onClose={handleClose}
            onApply={handleDeleteBulk}
            context={context}
            isBulkDelete={true}
          />,
          document.body,
        )}
      {modalState === PopUpState.Opened &&
        modalType === ModalType.export &&
        createPortal(
          <ExportModal route={route} modalState={modalState} onClose={handleClose} onApply={handleExport} />,
          document.body,
        )}
    </>
  );
};

export default Modals;
