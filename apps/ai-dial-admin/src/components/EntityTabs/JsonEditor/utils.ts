import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';

export const clearResolvedErrors = (
  errorNotifications: JSONEditorErrorNotification[],
  removeNotification: (id: string) => void,
  errors?: JSONEditorError[],
) => {
  errorNotifications?.forEach((notification) => {
    const persist = errors?.find((error) => {
      return error.message === notification?.message && error.startLineNumber === notification?.startLineNumber;
    });

    if (!persist) {
      removeNotification(notification.id);
    }
  });
};
