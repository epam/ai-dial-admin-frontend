'use client';

import { useCallback } from 'react';

import { useRouter } from 'next/navigation';
import { DialConfirmationPopup } from '@epam/ai-dial-ui-kit';

import DeleteAdapter from '@/src/components/Adapter/Modals/DeleteAdapter';
import DeleteAppRunner from '@/src/components/ApplicationRunners/Modals/DeleteAppRunner';
import { deleteModalTitleMap } from '@/src/components/EntityListView/constants';
import DeleteInterceptorTemplate from '@/src/components/InterceptorTemplates/Modals/Delete';
import { ButtonsI18nKey, DeleteI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { ServerActionResponse } from '@/src/models/server-action';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';

interface Props<T> {
  modalState: PopUpState;
  view: ApplicationRoute;
  entity: T;
  removeEntity: (entity: string) => Promise<ServerActionResponse>;
  onCloseModal: () => void;
  context?: () => AssetsFolderContext<DialFile>;
}

const DeleteConfirmationModal = <T extends object>({ view, entity, removeEntity, onCloseModal, context }: Props<T>) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const folderContext = context?.();

  const onConfirmRemoving = useCallback(() => {
    const removeKey = getEntityPath(view, entity, true);

    removeEntity(removeKey).then((res) => {
      if (res.success) {
        onCloseModal();

        if (
          view === ApplicationRoute.Prompts ||
          view === ApplicationRoute.AssetsToolsets ||
          view === ApplicationRoute.AssetsApplications
        ) {
          folderContext?.fetchFiles(folderContext?.filePath);
        }

        router.push(view);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [view, entity, removeEntity, onCloseModal, router, folderContext, showNotification]);

  const deleteModalContent =
    view === ApplicationRoute.ApplicationRunners ? (
      <DeleteAppRunner entity={entity} isEntityView={true} />
    ) : view === ApplicationRoute.Adapters ? (
      <DeleteAdapter entity={entity} isEntityView={true} />
    ) : view === ApplicationRoute.InterceptorTemplates ? (
      <DeleteInterceptorTemplate template={entity} />
    ) : null;

  return (
    <DialConfirmationPopup
      description={`${t(DeleteI18nKey.Confirming)} ${t(deleteModalTitleMap[view])}?`}
      title={`${t(DeleteI18nKey.Title)} ${t(deleteModalTitleMap[view])}`}
      onConfirm={onConfirmRemoving}
      onClose={onCloseModal}
      confirmLabel={t(ButtonsI18nKey.Delete)}
    >
      {deleteModalContent}
    </DialConfirmationPopup>
  );
};

export default DeleteConfirmationModal;
