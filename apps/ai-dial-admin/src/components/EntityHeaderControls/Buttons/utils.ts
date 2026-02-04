import { ErrorI18nKey } from '@/src/constants/i18n';
import { Notification } from '@/src/models/notification';
import { JSONEditorError } from '@/src/types/editor';
import { getErrorNotification } from '@/src/utils/notification';

export const showEditorErrorNotifications = (
  errors: JSONEditorError[],
  showNotification: (notification: Notification) => string,
  t: (key: string, options?: Record<string, string | number>) => string,
) => {
  return errors.map((error) => {
    const id = showNotification(
      getErrorNotification(
        error.message,
        t(ErrorI18nKey.EditorErrorLine, { line: error.startLineNumber }),
        void 0,
        null,
      ),
    );
    return { id, ...error };
  });
};
