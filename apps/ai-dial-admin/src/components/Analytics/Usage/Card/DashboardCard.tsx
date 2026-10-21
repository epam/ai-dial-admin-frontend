'use client';

import { FC, ReactNode } from 'react';

import classNames from 'classnames';

interface Props {
  title: string;
  subtitle?: string;
  /** Controls that belong to the title itself — a dimension switch, not a page-level action. */
  titleActions?: ReactNode;
  headerActions?: ReactNode;
  className?: string;
  children: ReactNode;
}

const DashboardCard: FC<Props> = ({ title, subtitle, titleActions, headerActions, className, children }) => (
  <section
    className={classNames('flex min-w-0 flex-col rounded border border-secondary bg-layer-2 shadow', className)}
    aria-label={title}
  >
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-secondary px-[18px] py-4">
      {/* Shrinkable, so the title block wraps its own controls instead of pushing the header
          actions onto a line of their own. */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="dial-body-semi-text text-primary">{title}</span>
          {subtitle && <span className="dial-small-text text-secondary">{subtitle}</span>}
        </div>
        {titleActions}
      </div>
      {headerActions}
    </header>
    <div className="flex min-h-0 min-w-0 flex-1 flex-col p-[18px]">{children}</div>
  </section>
);

export default DashboardCard;
