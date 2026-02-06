'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import {
  ConfirmationPopupVariant,
  DialConfirmationPopup,
  DialEllipsisTooltip,
  DialSelect,
  PopupSize,
  SelectSize,
  SelectVariant,
} from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';

import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { Asset } from '@/src/models/dial/deployment-asset';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetView, isBuildersView } from '@/src/utils/is-asset-view';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { AllVersionValue } from './constants';
import RelatedArtefacts from './RelatedArtefact';
import { getConfirmation, getNotificationDescription, getNotificationTitle, getTitle } from './utils';

interface Artefact {
  name?: string;
  displayName?: string;
  displayVersion?: string;
  version?: string;
  $id?: string;
  'dial:applicationTypeDisplayName'?: string;
}
interface Props<T> {
  view: ApplicationRoute;
  entity?: T;
  existingVersions?: string[];
  isSelectedView?: boolean;
  etag?: string;
  onResetEntity?: () => void;
  onRemoveEntity: (entity: string) => Promise<ServerActionResponse>;
  onCloseModal: () => void;
  getAssetContext?: () => AssetsFolderContext<Asset>;
}

const DeleteConfirmationModal = <T extends Artefact>({
  view,
  entity,
  existingVersions,
  etag,
  onRemoveEntity,
  onCloseModal,
  getAssetContext,
  isSelectedView,
  onResetEntity,
}: Props<T>) => {
  if (!entity) {
    return null;
  }
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const folderContext = getAssetContext?.();
  const getReqRef = useRef(useProtectedRequest());
  const modalSize = isBuildersView(view) ? PopupSize.Md : PopupSize.Sm;

  const [selectedVersion, setSelectedVersion] = useState(entity?.version);

  const name = useMemo(
    () => (isAssetView(view) ? entity.name : entity.displayName || entity['dial:applicationTypeDisplayName']),
    [entity, view],
  );
  const id = useMemo(() => (isAssetView(view) ? void 0 : entity.name || entity.$id), [entity.$id, entity.name, view]);

  const showSuccessNotification = useCallback(
    (entityKey: string) => {
      showNotification(
        getSuccessNotification(getNotificationTitle(view, t), getNotificationDescription(view, entityKey, t)),
      );
    },
    [showNotification, t, view],
  );

  const existingVersionOptions = useMemo(() => {
    if (!existingVersions) {
      return [];
    }

    return [
      {
        label: t(EntityFieldsI18nKey.allVersionsOption),
        value: AllVersionValue,
      },
      ...existingVersions.map((version) => ({ value: version, label: version })),
    ];
  }, [existingVersions, t]);

  const onConfirmRemoving = useCallback(() => {
    let entityKeys: string[];

    if (!selectedVersion) {
      entityKeys = [getEntityPath(view, entity, true)];
    } else {
      entityKeys =
        selectedVersion !== AllVersionValue
          ? [getEntityPath(view, entity, true, selectedVersion)]
          : existingVersions?.map((version) => getEntityPath(view, entity, true, version)) || [];
    }

    const promises = entityKeys.map((entityKey) => getReqRef.current(onRemoveEntity, entityKey, etag));

    Promise.all(promises)
      .then((resArr) => {
        let isAllSuccess = true;

        resArr.forEach((res, index) => {
          if (res.success) {
            showSuccessNotification(entityKeys[index]);
          } else {
            isAllSuccess = false;
            showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
          }
        });

        if (isAllSuccess) {
          onCloseModal();
          onResetEntity?.();
          if (isAssetView(view)) {
            folderContext?.fetchFiles(folderContext?.filePath);
          }

          if (isSelectedView) {
            router.push(view);
          }
          router.refresh();
        }
      })
      .catch((error) => {
        showNotification(getErrorNotification(error.message));
      });
  }, [
    view,
    entity,
    onRemoveEntity,
    onCloseModal,
    onResetEntity,
    showSuccessNotification,
    isSelectedView,
    router,
    folderContext,
    showNotification,
    selectedVersion,
    existingVersions,
    etag,
  ]);

  const onVersionChange = useCallback((value: string) => {
    setSelectedVersion(value);
  }, []);

  return (
    <DialConfirmationPopup
      open={true}
      variant={ConfirmationPopupVariant.Danger}
      header={getTitle(view, t)}
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
          {existingVersions && existingVersions.length > 0 ? (
            <div className="text-primary dial-small flex flex-row items-center gap-x-1">
              <span className="text-secondary">{t(EntityFieldsI18nKey.displayVersion)}:</span>
              <DialSelect
                size={SelectSize.Sm}
                variant={SelectVariant.Secondary}
                options={existingVersionOptions}
                onChange={(value) => onVersionChange(value as string)}
                value={selectedVersion}
              />
            </div>
          ) : (
            entity.displayVersion && (
              <div className="text-primary dial-small">
                <span className="text-secondary">{t(EntityFieldsI18nKey.displayVersion)}:</span> {entity.displayVersion}
              </div>
            )
          )}
        </div>
        {isBuildersView(view) && <RelatedArtefacts entity={entity} view={view} />}
      </div>
    </DialConfirmationPopup>
  );
};

export default DeleteConfirmationModal;
