import { FC, ReactNode } from 'react';

import { NotificationVariant, Notification, NotificationType } from '@epam/ai-dial-ui-kit';

interface Props {
  variant?: NotificationVariant;
  title?: ReactNode;
  message: ReactNode;
  className?: string;
  children?: ReactNode;
}

const EntityBanner: FC<Props> = ({ variant, title, message, className, children }) => {
  return (
    <Notification
      type={NotificationType.SectionMessage}
      className={className}
      variant={variant ?? NotificationVariant.Warning}
      message={
        <span className="dial-small-text">
          {title && (
            <>
              <span className="dial-small-semi-text">{title}</span>{' '}
            </>
          )}
          {message}
        </span>
      }
    >
      {children}
    </Notification>
  );
};

export default EntityBanner;
