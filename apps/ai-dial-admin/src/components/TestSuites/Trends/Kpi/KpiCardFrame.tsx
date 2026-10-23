'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const KpiCardFrame: FC<Props> = ({ children, className, ariaLabel, title }) => (
  <div
    className={classNames('flex flex-col gap-3 rounded-lg border border-secondary bg-layer-3 p-4', className)}
    role={ariaLabel ? 'region' : undefined}
    aria-label={ariaLabel}
  >
    <p className="dial-small-text text-secondary">{title}</p>
    {children}
  </div>
);

export default KpiCardFrame;
