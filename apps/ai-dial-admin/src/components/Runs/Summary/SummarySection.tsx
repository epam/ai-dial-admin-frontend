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
  /**
   * When true (default), the content area fills remaining height and scrolls — for flex layouts
   * that constrain the section. When false, the section sizes to its content (no shrink/clip).
   */
  isFillHeight?: boolean;
}

/**
 * A titled dashboard panel: header (title + optional right control), optional description, and a
 * content area. Used for run Summary and Trends sections.
 */
const SummarySection: FC<Props> = ({ title, description, control, children, className, isFillHeight = true }) => (
  <section
    className={classNames(
      'flex min-w-0 flex-col gap-3 rounded-lg border border-secondary bg-layer-3 p-4',
      isFillHeight ? 'min-h-0' : 'shrink-0',
      className,
    )}
  >
    <div className="flex w-full flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
      <h3 className="dial-body-semi-text min-w-0 text-primary">{title}</h3>
      {control}
    </div>
    {!!description && <p className="dial-body-text text-primary">{description}</p>}
    <div className={classNames(isFillHeight && 'min-h-0 flex-1 overflow-auto')}>{children}</div>
  </section>
);

export default SummarySection;
