import { useEffect, useRef } from 'react';

import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ReadFailure } from '@/src/models/server-action';
import { getErrorNotification } from '@/src/utils/notification';

// A server component cannot raise a notification, so it hands the failure across as a prop and the client
// view reports it from here. `fallbackTitleKey` titles a failure the response carried no header for.
export const useReadFailureNotification = (failure: ReadFailure | null | undefined, fallbackTitleKey: string) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const reportedKey = useRef<string | null>(null);

  const { errorHeader, errorMessage, requestId } = failure ?? {};
  // Keyed on content, not identity: the prop is a fresh object on every render.
  const key = failure ? JSON.stringify([errorHeader, errorMessage, requestId]) : null;

  useEffect(() => {
    // Cleared on success, so the same failure recurring later is reported again.
    if (key == null) {
      reportedKey.current = null;
      return;
    }

    if (reportedKey.current === key) {
      return;
    }

    reportedKey.current = key;
    showNotification(getErrorNotification(errorHeader ?? t(fallbackTitleKey), errorMessage, requestId));
  }, [key, errorHeader, errorMessage, requestId, fallbackTitleKey, showNotification, t]);
};
