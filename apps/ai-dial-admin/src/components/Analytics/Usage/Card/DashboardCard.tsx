'use client';

import { FC, ReactNode } from 'react';

import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

interface Props {
  title: string;
  subtitle?: string;
  /** Controls that belong to the title itself, drawn right after it — not a page-level action. */
  titleActions?: ReactNode;
  isSubtitleSingleLine?: boolean;
  headerActions?: ReactNode;
  className?: string;
  /** Added to the header: a custom dashboard widget makes it its drag handle in edit mode. */
  headerClassName?: string;
  children: ReactNode;
}

const DashboardCard: FC<Props> = ({
  title,
  subtitle,
  titleActions,
  isSubtitleSingleLine = false,
  headerActions,
  className,
  headerClassName,
  children,
}) => (
  <section
    className={classNames('flex min-w-0 flex-col rounded border border-secondary bg-layer-2 shadow-xs', className)}
    aria-label={title}
  >
    <header
      className={classNames(
        'flex flex-wrap items-center justify-between gap-4 border-b border-tertiary px-[18px] py-4',
        headerClassName,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="dial-body-semi-text text-primary">{title}</span>
          {titleActions}
        </div>
        {subtitle &&
          (isSubtitleSingleLine ? (
            <EllipsisTooltip text={subtitle} className="dial-small-text text-secondary" />
          ) : (
            <span className="dial-small-text text-secondary">{subtitle}</span>
          ))}
      </div>
      {headerActions}
    </header>
    <div className="flex min-h-0 min-w-0 flex-1 flex-col p-[18px]">{children}</div>
  </section>
);

export default DashboardCard;
