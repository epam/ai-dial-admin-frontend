import { NotificationType, Notification } from '@/src/models/notification';

export const getErrorNotification = (
  title?: string,
  description?: string,
  duration: number | null = null,
): Notification => {
  return getNotification(NotificationType.error, title, description, duration);
};

export const getSuccessNotification = (
  title?: string,
  description?: string,
  duration?: number | null,
): Notification => {
  return getNotification(NotificationType.success, title, description, duration);
};

export const getPrepareNotification = (
  title?: string,
  description?: string,
  duration: number | null = null,
): Notification => {
  return getNotification(NotificationType.prepare, title, description, duration);
};

export const getNotification = (
  type: NotificationType,
  title?: string,
  description?: string,
  duration: number | null = null,
): Notification => {
  return {
    type,
    title: title ?? '',
    description: description ?? '',
    duration,
  };
};
