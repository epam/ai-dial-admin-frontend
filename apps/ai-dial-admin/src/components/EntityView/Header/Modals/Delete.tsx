'use client';

import { useCallback } from 'react';

import { useRouter } from 'next/navigation';

import DeleteAdapter from '@/src/components/Adapter/Modals/DeleteAdapter';
import DeleteAppRunner from '@/src/components/ApplicationRunners/Modals/DeleteAppRunner';
import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import { deleteModalTitleMap } from '@/src/components/EntityListView/constants';
import DeleteInterceptorTemplate from '@/src/components/InterceptorTemplates/Modals/Delete';
import { ButtonsI18nKey, DeleteI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { usePromptFolder } from '@/src/context/PromptFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DialKey } from '@/src/models/dial/key';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { ServerActionResponse } from '@/src/models/server-action';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';

interface Props<T> {
  modalState: PopUpState;
  view: ApplicationRoute;
  entity: T;
  removeEntity: (entity?: string) => Promise<ServerActionResponse>;
  onCloseModal: () => void;
}

const DeleteConfirmationModal = <T extends DialBaseEntity | DialKey>({
  modalState,
  view,
  entity,
  removeEntity,
  onCloseModal,
}: Props<T>) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { fetchFiles, filePath } = usePromptFolder();

  const onConfirmRemoving = useCallback(() => {
    const removeKey = getEntityPath(view, entity, true);

    removeEntity(removeKey).then((res) => {
      if (res.success) {
        onCloseModal();

        if (view === ApplicationRoute.Prompts) {
          fetchFiles(filePath);
        }

        router.push(view);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [onCloseModal, showNotification, router, entity, view, removeEntity, fetchFiles, filePath]);

  const deleteModalContent =
    view === ApplicationRoute.ApplicationRunners ? (
      <DeleteAppRunner entity={entity as DialApplicationScheme} isEntityView={true} />
    ) : view === ApplicationRoute.Adapters ? (
      <DeleteAdapter entity={entity as DialAdapter} isEntityView={true} />
    ) : view === ApplicationRoute.InterceptorTemplates ? (
      <DeleteInterceptorTemplate template={entity as InterceptorTemplate} />
    ) : null;

  return (
    <ConfirmationModal
      description={`${t(DeleteI18nKey.Confirming)} ${t(deleteModalTitleMap[view])}?`}
      heading={`${t(DeleteI18nKey.Title)} ${t(deleteModalTitleMap[view])}`}
      onConfirm={onConfirmRemoving}
      modalState={modalState}
      onClose={onCloseModal}
      confirmLabel={t(ButtonsI18nKey.Delete)}
    >
      {deleteModalContent}
    </ConfirmationModal>
  );
};

export default DeleteConfirmationModal;
