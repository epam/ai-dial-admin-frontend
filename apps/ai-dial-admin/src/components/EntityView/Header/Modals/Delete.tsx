'use client';

import { useCallback } from 'react';

import { useRouter } from 'next/navigation';
import { ConfirmationPopupVariant, DialConfirmationPopup } from '@epam/ai-dial-ui-kit';

import DeleteAdapter from '@/src/components/Adapter/Modals/DeleteAdapter';
import DeleteAppRunner from '@/src/components/ApplicationRunners/Modals/DeleteAppRunner';
import DeleteInterceptorTemplate from '@/src/components/InterceptorTemplates/Modals/Delete';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { getConfirmation, getNotificationDescription, getNotificationTitle, getTitle } from './utils';
import { isAssetView } from '@/src/utils/is-asset-view';

interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  isSelectedView?: boolean;
  resetCurrentEntity?: () => void;
  removeEntity: (entity: string) => Promise<ServerActionResponse>;
  onCloseModal: () => void;
  context?: () => AssetsFolderContext<DialFile>;
}

const DeleteConfirmationModal = <T extends object>({
  view,
  entity,
  removeEntity,
  onCloseModal,
  context,
  isSelectedView,
  resetCurrentEntity,
}: Props<T>) => {
  const t = useI18n() as (key: string, options?: Record<string, string>) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const folderContext = context?.();

  const showSuccessNotification = useCallback(
    (entityKey: string) => {
      showNotification(
        getSuccessNotification(getNotificationTitle(view, t), getNotificationDescription(view, entityKey, t)),
      );
    },
    [showNotification, t, view],
  );

  const onConfirmRemoving = useCallback(() => {
    const entityKey = getEntityPath(view, entity, true);

    removeEntity(entityKey).then((res) => {
      if (res.success) {
        onCloseModal();
        resetCurrentEntity?.();
        if (isAssetView(view)) {
          folderContext?.fetchFiles(folderContext?.filePath);
        }
        showSuccessNotification(entityKey);
        if (isSelectedView) {
          router.push(view);
        }
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [
    view,
    entity,
    removeEntity,
    onCloseModal,
    resetCurrentEntity,
    showSuccessNotification,
    isSelectedView,
    router,
    folderContext,
    showNotification,
  ]);

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
      open={true}
      variant={ConfirmationPopupVariant.Danger}
      description={getConfirmation(view, t)}
      title={getTitle(view, t)}
      onConfirm={onConfirmRemoving}
      onClose={onCloseModal}
      confirmLabel={t(ButtonsI18nKey.Delete)}
    >
      {deleteModalContent}
    </DialConfirmationPopup>
  );
};

export default DeleteConfirmationModal;
