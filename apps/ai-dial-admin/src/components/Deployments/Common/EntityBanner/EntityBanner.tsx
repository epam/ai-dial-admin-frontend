import { FC, ReactNode } from 'react';

import { AlertVariant, DialAlert } from '@epam/ai-dial-ui-kit';

interface Props {
  variant?: AlertVariant;
  title?: ReactNode;
  message: ReactNode;
  className?: string;
  children?: ReactNode;
}

const EntityBanner: FC<Props> = ({ variant, title, message, className, children }) => {
  return (
    <DialAlert
      className={className}
      variant={variant ?? AlertVariant.Warning}
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
    </DialAlert>
  );
};

export default EntityBanner;
