'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

interface Props {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned control in the header (e.g. a SegmentedControl). */
  control?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A titled dashboard panel: header (title + optional right control), optional description, and a
 * scrollable content area that fills the remaining height. Used for the run Summary sections.
 */
const SummarySection: FC<Props> = ({ title, description, control, children, className }) => (
  <section
    className={classNames('flex min-h-0 flex-col gap-3 rounded-lg border border-secondary bg-layer-3 p-4', className)}
  >
    <div className="flex items-center justify-between gap-2">
      <h3 className="dial-body-semi-text text-primary">{title}</h3>
      {control}
    </div>
    {!!description && <p className="dial-body-text text-primary">{description}</p>}
    <div className="min-h-0 flex-1 overflow-auto">{children}</div>
  </section>
);

export default SummarySection;
