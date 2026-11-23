import { ReactNode } from 'react';

export interface Notification {
  type: NotificationType;
  title: string;
  // A node, not a string, so a body can carry a link; the `get*Notification` helpers still take a string.
  description?: ReactNode;
  duration?: number | null;
  requestId?: string;
  onClose?: () => void;
  action?: NotificationAction;
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface NotificationConfig extends Notification {
  id: string;
}

export enum NotificationType {
  success = 'success',
  error = 'error',
  prepare = 'prepare',
}
