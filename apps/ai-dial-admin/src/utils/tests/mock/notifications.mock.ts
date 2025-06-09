import { NotificationType } from '@/src/models/notification';

export const NOTIFICATION = {
  id: '1',
  type: NotificationType.success,
  title: 'title',
  description: 'description',
};

const FILE_IN_PROGRESS = {
  id: 'file 1',
  name: 'file name',
  progress: 90,
  failed: false,
  complete: false,
};

const FILE_COMPLETED = {
  id: 'file 2',
  name: 'file name 2',
  progress: 100,
  failed: false,
  complete: true,
};

const FILE_FAILED = {
  id: 'file 3',
  name: 'file name 3',
  progress: 10,
  failed: true,
  complete: false,
};

export const DYNAMIC_NOTIFICATION = {
  id: '1',
  type: NotificationType.dynamic,
  title: 'title',
  description: 'description',
  downloadDetails: [FILE_IN_PROGRESS, FILE_FAILED, FILE_COMPLETED],
};

export const DYNAMIC_NOTIFICATION_EMPTY = {
  id: '1',
  type: NotificationType.dynamic,
  title: 'title',
  description: 'description',
  downloadDetails: [],
};

export const DYNAMIC_NOTIFICATION_COMPLETED = {
  id: '1',
  type: NotificationType.dynamic,
  title: 'title',
  description: 'description',
  downloadDetails: [FILE_COMPLETED],
};

export const NOTIFICATIONS = [NOTIFICATION, DYNAMIC_NOTIFICATION];
