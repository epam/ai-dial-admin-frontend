import { FC } from 'react';
import { createPortal } from 'react-dom';
import Notification from '@/src/components/Notification/Notification';
import { NotificationConfig } from '@/src/models/notification';

interface Props {
  notifications: NotificationConfig[];
}

const NotificationPortal: FC<Props> = ({ notifications }) =>
  createPortal(
    <div className="flex flex-col items-end gap-2 fixed bottom-3 right-3 z-[100]">
      {notifications.map((notification) => (
        <Notification key={notification.id} {...notification} />
      ))}
    </div>,
    document.body,
  );

export default NotificationPortal;
