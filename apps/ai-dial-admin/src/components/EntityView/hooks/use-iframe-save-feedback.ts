'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  view: ApplicationRoute;
  entityName?: string;
  onSaved?: () => void;
}

export const useIframeSaveFeedback = ({ view, entityName, onSaved }: Props) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const onIframeSaveSuccess = useCallback(() => {
    onSaved?.();
    showNotification(
      getSuccessNotification(
        getUpdateNotificationTitle(view, t),
        getUpdateNotificationDescription(view, entityName, t),
      ),
    );
    router.refresh();
  }, [entityName, onSaved, router, showNotification, t, view]);

  const onIframeSaveError = useCallback(
    (message?: string) => {
      showNotification(getErrorNotification(t(EntitiesI18nKey.IframeSaveFailed), message));
    },
    [showNotification, t],
  );

  return { onIframeSaveSuccess, onIframeSaveError };
};
