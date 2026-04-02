import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';

export const mergeWithIgnoredFields = <T extends object>(
  prev: T,
  parsed: Partial<T>,
  ignoredFields?: (keyof T)[],
): T => {
  const merged = { ...prev, ...parsed };
  for (const field of ignoredFields ?? []) {
    merged[field] = prev[field];
  }
  return merged;
};

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
