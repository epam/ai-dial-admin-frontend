'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

interface Props {
  title: ReactNode;
  /** Sits beside the title, outside the heading, e.g. an info control, so it does not become part of the heading's name. */
  titleSuffix?: ReactNode;
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
const SummarySection: FC<Props> = ({
  title,
  titleSuffix,
  description,
  control,
  children,
  className,
  isFillHeight = true,
}) => (
  <section
    className={classNames(
      'flex min-w-0 flex-col gap-3 rounded-lg border border-secondary bg-layer-3 p-4',
      isFillHeight ? 'h-full min-h-0' : 'shrink-0',
      className,
    )}
  >
    <div className="flex w-full shrink-0 flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
      {titleSuffix == null ? (
        <h3 className="dial-body-semi-text min-w-0 text-primary">{title}</h3>
      ) : (
        <div className="flex min-w-0 items-center gap-1">
          <h3 className="dial-body-semi-text min-w-0 text-primary">{title}</h3>
          {titleSuffix}
        </div>
      )}
      {control}
    </div>
    {!!description && <p className="dial-small-text text-secondary">{description}</p>}
    <div className={classNames(isFillHeight && 'min-h-0 flex-1 overflow-auto')}>{children}</div>
  </section>
);

export default SummarySection;
