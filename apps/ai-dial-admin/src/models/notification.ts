export interface Notification {
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number | null;
  requestId?: string;
  onClose?: () => void;
  downloadDetails?: FileDetails[];
  disableTitleTruncate?: boolean;
}

export interface FileDetails {
  id: string;
  name: string;
  progress: number;
  onCancel?: () => void;
  failed: boolean;
  complete: boolean;
}

export interface NotificationConfig extends Notification {
  id: string;
}

export enum NotificationType {
  success = 'success',
  error = 'error',
  dynamic = 'dynamic',
  prepare = 'prepare',
}

export enum NotificationIconColor {
  success = 'text-accent-secondary',
  error = 'text-error',
  dynamic = 'text-secondary',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  prepare = 'text-secondary',
}
