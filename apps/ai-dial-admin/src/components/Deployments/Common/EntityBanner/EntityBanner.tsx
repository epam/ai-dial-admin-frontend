import { FC, ReactNode } from 'react';

import { NotificationVariant, DialNotification } from '@epam/ai-dial-ui-kit';

interface Props {
  variant?: NotificationVariant;
  title?: ReactNode;
  message: ReactNode;
  className?: string;
  children?: ReactNode;
}

const EntityBanner: FC<Props> = ({ variant, title, message, className, children }) => {
  return (
    <DialNotification
      className={className}
      variant={variant ?? NotificationVariant.Warning}
      message={
        <span className="small">
          {title && (
            <>
              <span className="small-text-semi">{title}</span>{' '}
            </>
          )}
          {message}
        </span>
      }
    >
      {children}
    </DialNotification>
  );
};

export default EntityBanner;
