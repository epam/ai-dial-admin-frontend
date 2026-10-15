'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  source: string;
  // A control that belongs to the panel as a whole, beside its heading.
  action?: ReactNode;
  // Off where the content draws a frame of its own, so the two do not nest.
  isFramed?: boolean;
  children: ReactNode;
}

const SessionDetailPanel: FC<Props> = ({ icon, iconClassName, title, source, action, isFramed = true, children }) => (
  <section className="flex flex-col gap-2">
    <div className="flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-primary dial-small-semi-text">
        <span className={classNames('flex shrink-0', iconClassName)}>{icon}</span>
        {title}
      </h3>
      <span className="flex shrink-0 items-center gap-1">
        <span className="font-mono text-secondary dial-tiny-text">{source}</span>
        {action}
      </span>
    </div>
    {isFramed ? <div className="rounded border border-primary bg-layer-3 p-3">{children}</div> : children}
  </section>
);

export default SessionDetailPanel;
