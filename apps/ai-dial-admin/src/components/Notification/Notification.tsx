import { IconChevronDown, IconCircleCheck, IconExclamationCircle, IconLoader, IconX } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import Button from '@/src/components/Common/Button/Button';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { NotificationConfig, NotificationIconColor, NotificationType } from '@/src/models/notification';

export const NotificationIcons: Record<NotificationType, ReactNode> = {
  success: <IconCircleCheck {...BASE_ICON_PROPS} />,
  error: <IconExclamationCircle {...BASE_ICON_PROPS} />,
  prepare: <IconLoader {...BASE_ICON_PROPS} />,
  dynamic: <IconChevronDown {...BASE_ICON_PROPS} />,
};

const Notification: FC<NotificationConfig> = ({ type, title, description, onClose }) => {
  const Icon = NotificationIcons[type];
  const iconClassNames = classNames('inline mr-2', NotificationIconColor[type]);

  return (
    <div
      data-testid={'notification'}
      className="flex flex-col layer-3 px-4 py-2 w-[400px] bg-layer-3 [&:not(:last-child)]:mb-4 rounded shadow"
    >
      <div className="flex flex-row w-full relative pr-5 items-center">
        <div className="flex items-center w-full">
          <i data-testid={'notification-icon'} className={iconClassNames}>
            {Icon}
          </i>
          <p data-testid={'notification-title'} className="small-text-semi truncate">
            {title}
          </p>
        </div>
        <Button
          dataTestId={'notification-close'}
          cssClass={'absolute right-0'}
          onClick={onClose}
          iconBefore={<IconX height={18} width={18} />}
        />
      </div>
      {description ? (
        <p
          data-testid={'notification-description'}
          className="tiny text-secondary break-words whitespace-pre-wrap mt-2"
        >
          {description}
        </p>
      ) : null}
    </div>
  );
};

export default Notification;
