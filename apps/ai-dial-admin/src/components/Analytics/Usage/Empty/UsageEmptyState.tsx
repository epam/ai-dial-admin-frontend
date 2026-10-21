'use client';

import { FC, ReactNode } from 'react';

import classNames from 'classnames';

interface Props {
  pill?: string;
  title?: string;
  lines?: string[];
  figure?: ReactNode;
  className?: string;
}

/**
 * What a widget shows when its window holds nothing. It states that the window was empty rather
 * than that the request failed, and keeps the widget's own frame — an empty chart collapsing to a
 * line of text reads as a broken panel.
 */
const UsageEmptyState: FC<Props> = ({ pill, title, lines, figure, className }) => (
  <div className={classNames('flex flex-col items-center justify-center gap-3 text-center', className)}>
    {figure}
    {pill && (
      <span className="flex items-center gap-2 rounded-full border border-secondary bg-layer-0 px-3 py-1.5 dial-small-text text-primary">
        <span aria-hidden className="size-1.5 rounded-full bg-controls-disable" />
        {pill}
      </span>
    )}
    {title && <span className="dial-body-semi-text text-primary">{title}</span>}
    {lines && lines.length > 0 && (
      <div className="flex flex-col gap-0.5 dial-small-text text-secondary">
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
    )}
  </div>
);

export default UsageEmptyState;
