'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  /** Pinned to the card's bottom edge, so footers line up across a row of cards of different content height. */
  footer?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const KpiCardFrame: FC<Props> = ({ children, footer, className, ariaLabel, title }) => (
  <div
    className={classNames('flex flex-col gap-3 rounded-lg border border-secondary bg-layer-3 p-4', className)}
    role={ariaLabel ? 'region' : undefined}
    aria-label={ariaLabel}
  >
    <p className="dial-small-text text-secondary">{title}</p>
    {children}
    {footer != null && footer !== false && <div className="mt-auto flex min-h-4 items-center">{footer}</div>}
  </div>
);

export default KpiCardFrame;
