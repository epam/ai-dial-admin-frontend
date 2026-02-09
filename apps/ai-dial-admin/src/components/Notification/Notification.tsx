import { IconChevronDown, IconCircleCheck, IconExclamationCircle, IconLoader, IconX } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';
import { DialIconButton } from '@epam/ai-dial-ui-kit';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { NotificationConfig, NotificationIconColor, NotificationType } from '@/src/models/notification';

export const NotificationIcons: Record<NotificationType, ReactNode> = {
  success: <IconCircleCheck {...BASE_BUTTON_ICON_PROPS} />,
  error: <IconExclamationCircle {...BASE_BUTTON_ICON_PROPS} />,
  prepare: <IconLoader {...BASE_BUTTON_ICON_PROPS} />,
  dynamic: <IconChevronDown {...BASE_BUTTON_ICON_PROPS} />,
};

const Notification: FC<NotificationConfig> = ({ type, title, description, requestId, onClose }) => {
  const Icon = NotificationIcons[type];
  const iconClassName = classNames('inline mr-2', NotificationIconColor[type]);

  return (
    <div className="flex flex-col layer-3 px-4 py-2 w-[400px] bg-layer-3 [&:not(:last-child)]:mb-4 rounded shadow">
      <div className="flex flex-row w-full relative pr-5 items-center">
        <div className="flex items-center w-full">
          <i className={iconClassName}>{Icon}</i>
          <p className="small-text-semi truncate">{title}</p>
        </div>
        <DialIconButton
          aria-label="close"
          className="absolute right-0 w-auto h-auto p-0 top-0"
          onClick={onClose}
          icon={<IconX height={18} width={18} />}
        />
      </div>
      {description ? <p className="tiny text-secondary break-words whitespace-pre-wrap mt-2">{description}</p> : null}
      {requestId ? (
        <p className="tiny text-secondary break-words whitespace-pre-wrap mt-2">Request ID: {requestId}</p>
      ) : null}
    </div>
  );
};

export default Notification;
