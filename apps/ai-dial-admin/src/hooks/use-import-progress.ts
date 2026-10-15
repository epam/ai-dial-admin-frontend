'use client';

import { useCallback } from 'react';

import { ImportI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { getPrepareNotification } from '@/src/utils/notification';

// Shows a persistent "in progress" notification for the lifetime of an import request. Result
// notifications stay with the caller: the import routes report results differently.
export const useImportProgress = () => {
  const t = useI18n();
  const { showNotification, removeNotification } = useNotification();

  return useCallback(
    async (folderName: string, request: () => Promise<ServerActionResponse>): Promise<ServerActionResponse> => {
      const notificationId = showNotification(
        getPrepareNotification(
          t(ImportI18nKey.InProgressTitle),
          t(ImportI18nKey.InProgressDescription, { folder: folderName }),
        ),
      );

      try {
        return await request();
      } catch (error) {
        // Reported as a failed response so each caller's existing getErrorNotification branch shows it.
        console.error('Import request failed', error);
        return { success: false, errorHeader: t(ImportI18nKey.ImportFailed) };
      } finally {
        removeNotification(notificationId);
      }
    },
    [showNotification, removeNotification, t],
  );
};
