'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

interface Props {
  title: string;
  /** Sits beside the title, e.g. an info control. The title row keeps its one-line height, so a taller control does not push the card's content down. */
  titleSuffix?: ReactNode;
  children: ReactNode;
  /** Pinned to the card's bottom edge, so footers line up across a row of cards of different content height. */
  footer?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const KpiCardFrame: FC<Props> = ({ children, footer, className, ariaLabel, title, titleSuffix }) => (
  <div
    className={classNames('flex flex-col gap-3 rounded-lg border border-secondary bg-layer-3 p-4', className)}
    role={ariaLabel ? 'region' : undefined}
    aria-label={ariaLabel}
  >
    {titleSuffix == null ? (
      <p className="dial-small-text text-secondary">{title}</p>
    ) : (
      <div className="flex h-5 items-center gap-1">
        <p className="dial-small-text text-secondary">{title}</p>
        {titleSuffix}
      </div>
    )}
    {children}
    {footer != null && footer !== false && <div className="mt-auto flex min-h-4 items-center">{footer}</div>}
  </div>
);

export default KpiCardFrame;
