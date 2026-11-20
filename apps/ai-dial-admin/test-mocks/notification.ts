import { vi } from 'vitest';
import type * as NotificationModule from '@/src/context/NotificationContext';

type Notification = ReturnType<typeof NotificationModule.useNotification>;

const notification = {
  showNotification: vi.fn<Notification['showNotification']>(),
  removeNotification: vi.fn<Notification['removeNotification']>(),
};

export const notificationModule = {
  useNotification: vi.fn((): Notification => notification),
};

export const notificationMock = {
  ...notification,
  reset() {
    Object.values(notification).forEach((fn) => fn.mockReset());
    notificationModule.useNotification.mockReset();
  },
};
