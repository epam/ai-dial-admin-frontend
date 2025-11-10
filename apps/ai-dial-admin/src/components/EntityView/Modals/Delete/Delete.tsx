'use client';

import { useCallback, useMemo, useRef } from 'react';

import { useRouter } from 'next/navigation';
import { ConfirmationPopupVariant, DialConfirmationPopup, DialEllipsisTooltip, PopupSize } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { getConfirmation, getNotificationDescription, getNotificationTitle, getTitle } from './utils';
import { isAssetView, isBuildersView } from '@/src/utils/is-asset-view';
import RelatedArtefacts from './RelatedArtefact';
import { useProtectedRequest } from '../../../../hooks/use-protected-request';

interface Artefact {
  name?: string;
  displayName?: string;
  displayVersion?: string;
  $id?: string;
  'dial:applicationTypeDisplayName'?: string;
}
interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  isSelectedView?: boolean;
  resetCurrentEntity?: () => void;
  removeEntity: (entity: string) => Promise<ServerActionResponse>;
  onCloseModal: () => void;
  context?: () => AssetsFolderContext<DialFile>;
}

const DeleteConfirmationModal = <T extends Artefact>({
  view,
  entity,
  removeEntity,
  onCloseModal,
  context,
  isSelectedView,
  resetCurrentEntity,
}: Props<T>) => {
  const name = useMemo(
    () => (isAssetView(view) ? entity.name : entity.displayName || entity['dial:applicationTypeDisplayName']),
    [entity, view],
  );
  const id = useMemo(() => (isAssetView(view) ? void 0 : entity.name || entity.$id), [entity.$id, entity.name, view]);

  const t = useI18n() as (key: string, options?: Record<string, string>) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const folderContext = context?.();
  const getReqRef = useRef(useProtectedRequest());
  const modalSize = isBuildersView(view) ? PopupSize.Md : PopupSize.Sm;

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

    getReqRef.current(removeEntity, entityKey).then((res) => {
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

  return (
    <DialConfirmationPopup
      open={true}
      variant={ConfirmationPopupVariant.Danger}
      title={getTitle(view, t)}
      onConfirm={onConfirmRemoving}
      onClose={onCloseModal}
      size={modalSize}
      confirmLabel={t(ButtonsI18nKey.Delete)}
    >
      <div className="h-full flex flex-col gap-y-4 px-6 py-2 w-full">
        <span className="text-secondary dial-small">{getConfirmation(view, t)}</span>
        <div className="flex flex-col gap-y-2">
          {id && (
            <div className="text-primary dial-small flex flex-row items-center gap-x-1">
              <span className="text-secondary">{t(EntityFieldsI18nKey.id)}:</span>
              <DialEllipsisTooltip text={entity.name || entity.$id} />
            </div>
          )}
          {name && (
            <div className="text-primary dial-small flex flex-row items-center gap-x-1">
              <span className="text-secondary">{t(EntityFieldsI18nKey.displayName)}:</span>
              <DialEllipsisTooltip text={name} />
            </div>
          )}
          {entity.displayVersion && (
            <div className="text-primary dial-small">
              <span className="text-secondary">{t(EntityFieldsI18nKey.displayVersion)}:</span> {entity.displayVersion}
            </div>
          )}
        </div>
        {isBuildersView(view) && <RelatedArtefacts entity={entity} view={view} />}
      </div>
    </DialConfirmationPopup>
  );
};

export default DeleteConfirmationModal;
