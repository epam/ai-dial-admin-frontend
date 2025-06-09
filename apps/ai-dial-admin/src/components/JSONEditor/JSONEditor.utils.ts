import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { Notification } from '@/src/models/notification';
import { EditorI18nKey } from '@/src/constants/i18n';
import { getErrorNotification } from '@/src/utils/notification';

export const showEditorErrorNotifications = ({
  errors,
  showNotification,
  t,
}: {
  errors: JSONEditorError[];
  showNotification: (notification: Notification) => string;
  t: (key: string, options?: Record<string, string | number>) => string;
}) => {
  return errors.map((error) => {
    const id = showNotification(
      getErrorNotification(error.message, t(EditorI18nKey.ErrorLine, { line: error.startLineNumber }), null),
    );
    return { id, ...error };
  });
};

export const clearResolvedErrors = ({
  errorNotifications,
  errors,
  removeNotification,
}: {
  errorNotifications: JSONEditorErrorNotification[];
  errors?: JSONEditorError[];
  removeNotification: (id: string) => void;
}) => {
  errorNotifications?.forEach((notification) => {
    const persist = errors?.find((error) => {
      return error.message === notification?.message && error.startLineNumber === notification?.startLineNumber;
    });

    if (!persist) {
      removeNotification(notification.id);
    }
  });
};
