'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

interface Props {
  title: string;
  value?: ReactNode;
  description?: ReactNode;
  isError?: boolean;
  className?: string;
}

/**
 * Trends KPI card matching Figma: title + value grouped at top, description pinned to the bottom.
 */
const TrendsKpiCard: FC<Props> = ({ title, value, description, isError, className }) => {
  return (
    <div
      className={classNames(
        'flex flex-col justify-between gap-3 rounded-lg border border-secondary bg-layer-3 p-4',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="dial-small-text text-secondary">{title}</p>
        {isError ? (
          <p className="dial-display2-text text-secondary">—</p>
        ) : (
          <p className="dial-display2-text text-primary">{value}</p>
        )}
      </div>
      {description != null && <p className="dial-tiny-text text-secondary">{description}</p>}
    </div>
  );
};

export default TrendsKpiCard;
