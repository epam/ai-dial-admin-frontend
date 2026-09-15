'use client';

import { useCallback, useRef } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ReadFailure } from '@/src/models/server-action';
import { getErrorNotification } from '@/src/utils/notification';

// The inspector detects these failures in its own client reads, so it reports them imperatively rather
// than through the prop-driven `useReadFailureNotification`.
export const useHopReadReport = () => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const reportedKey = useRef<string | null>(null);

  return useCallback(
    (failure?: ReadFailure) => {
      const { errorHeader, errorMessage, requestId } = failure ?? {};
      // Request, response, raw and each opened message are separate reads of one body, so an outage
      // reaches this several times per hop.
      const key = JSON.stringify([errorHeader, errorMessage, requestId]);

      if (reportedKey.current === key) {
        return;
      }

      reportedKey.current = key;
      showNotification(
        getErrorNotification(errorHeader ?? t(ConversationsTraceI18nKey.InspectorLoadFailed), errorMessage, requestId),
      );
    },
    [showNotification, t],
  );
};
