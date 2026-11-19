import { useEffect, useRef } from 'react';

import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ReadFailure } from '@/src/models/server-action';
import { getErrorNotification } from '@/src/utils/notification';

// A server component cannot raise a notification, so it hands the failure across as a prop and the client
// view reports it from here. The service header is a machine code, so `titleKey` always titles the
// notification and the service message is its description.
export const useReadFailureNotification = (failure: ReadFailure | null | undefined, titleKey: string) => {
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
    showNotification(getErrorNotification(t(titleKey), errorMessage, requestId));
  }, [key, errorMessage, requestId, titleKey, showNotification, t]);
};
