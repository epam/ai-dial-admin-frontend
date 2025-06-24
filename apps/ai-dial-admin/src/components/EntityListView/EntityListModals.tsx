'use client';
import { FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import DeleteAdapter from '@/src/components/AdaptersList/Delete/DeleteAdapter';
import DeleteScheme from '@/src/components/ApplicationRunners/ListView/Delete/DeleteAppRunner';
import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import FilePathModal from '@/src/components/Common/FilePath/FilePathModal';
import { BasicI18nKey, ButtonsI18nKey, DeleteI18nKey } from '@/src/constants/i18n';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { ParsedPrompts } from '@/src/models/prompts';
import { ImportFileType } from '@/src/types/import';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { deleteModalTitleMap } from './entity-list-view';
import ExportModal from './Export/ExportModal';
import ImportModal from './Import/ImportModal';

export enum ModalType {
  create = 'create',
  export = 'export',
  import = 'import',
  delete = 'delete',
  duplicate = 'duplicate',
  move = 'move',
}

interface Props {
  entity?: DialBaseEntity;
  route?: ApplicationRoute;
  initialPath?: string;
  modalState: PopUpState;
  modalType?: ModalType;
  createModal?: ReactNode;
  duplicateModal?: ReactNode;
  handleImport?: (
    fileType: ImportFileType,
    file: File | File[] | ParsedPrompts,
    resolution: string,
    path: string,
  ) => void;
  handleExport?: (paths: string[]) => void;
  handleMove?: (path: string) => void;
  handleDelete?: () => void;
  handleClose: () => void;
  context?: () => PromptFolderContextType | FileFolderContextType;
}

const EntityListModals: FC<Props> = ({
  entity,
  route,
  initialPath,
  modalState,
  modalType,
  createModal,
  duplicateModal,
  handleImport,
  handleExport,
  handleMove,
  handleDelete,
  handleClose,
  context,
}) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const folderContext = context?.();

  return (
    <>
      {modalState === PopUpState.Opened && modalType === ModalType.create && createPortal(createModal, document.body)}
      {modalState === PopUpState.Opened &&
        modalType === ModalType.export &&
        createPortal(
          <ExportModal
            route={route}
            context={context}
            modalState={modalState}
            onClose={() => {
              handleClose();
              folderContext?.setExportFoldersData({});
            }}
            onApply={handleExport}
          />,
          document.body,
        )}

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
          <ConfirmationModal
            heading={`${t(DeleteI18nKey.Title)} ${t(deleteModalTitleMap[route as keyof typeof deleteModalTitleMap])}`}
            onConfirm={handleDelete as () => void}
            modalState={modalState}
            confirmLabel={t(ButtonsI18nKey.Delete)}
            onClose={handleClose}
          >
            {route === ApplicationRoute.ApplicationRunners ? (
              <DeleteScheme entity={entity as DialApplicationScheme} />
            ) : route === ApplicationRoute.Adapters ? (
              <DeleteAdapter entity={entity as DialAdapter} />
            ) : (
              <p className="text-secondary small-150 px-6 py-4">
                <span>{t(DeleteI18nKey.Confirming)}</span>
                {(entity as DialBaseEntity).displayName || entity?.name ? (
                  <span className="important-text-part mr-1">
                    {(entity as DialBaseEntity).displayName || entity?.name}
                  </span>
                ) : null}
                <span>{t(deleteModalTitleMap[route as keyof typeof deleteModalTitleMap])}?</span>
              </p>
            )}
          </ConfirmationModal>,
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
    </>
  );
};

export default EntityListModals;
