'use client';

import { FC, useState } from 'react';
import { createPortal } from 'react-dom';

import { ConfirmationPopup, ConfirmationPopupVariant } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';

import { getNotificationDescription, getNotificationTitle } from '@/src/components/EntityView/Modals/Delete/utils';
import { ButtonsI18nKey, QueriesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { SavedQuery } from '@/src/models/analytics/saved-query';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  query: SavedQuery;
  onRemove: (id: string) => Promise<ServerActionResponse>;
  onClose: () => void;
}

const DeleteQueryPopup: FC<Props> = ({ query, onRemove, onClose }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [isRemoving, setIsRemoving] = useState(false);

  const onConfirm = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      const res = await onRemove(query.id);
      if (!res.success) {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        setIsRemoving(false);
        return;
      }
      showNotification(
        getSuccessNotification(
          getNotificationTitle(ApplicationRoute.AnalyticsQueries, t),
          getNotificationDescription(ApplicationRoute.AnalyticsQueries, query.name, t),
        ),
      );
      onClose();
      router.push(ApplicationRoute.AnalyticsQueries);
      router.refresh();
    } catch (error) {
      showNotification(getErrorNotification((error as Error).message));
      setIsRemoving(false);
    }
  };

  return createPortal(
    <ConfirmationPopup
      variant={ConfirmationPopupVariant.Danger}
      open={true}
      header={t(QueriesI18nKey.DeleteQueryHeader)}
      description={t(QueriesI18nKey.DeleteQueryDescription, { name: query.name })}
      confirmLabel={t(QueriesI18nKey.DeleteQuery)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onConfirm={onConfirm}
      onClose={onClose}
      onCancel={onClose}
    />,
    document.body,
  );
};

export default DeleteQueryPopup;
