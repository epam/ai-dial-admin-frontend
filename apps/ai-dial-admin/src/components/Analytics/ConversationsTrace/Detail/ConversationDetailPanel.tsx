'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  source: string;
  children: ReactNode;
}

const ConversationDetailPanel: FC<Props> = ({ icon, iconClassName, title, source, children }) => (
  <section className="flex flex-col gap-2">
    <div className="flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-primary dial-small-semi-text">
        <span className={classNames('flex shrink-0', iconClassName)}>{icon}</span>
        {title}
      </h3>
      <span className="shrink-0 font-mono text-secondary dial-tiny-text">{source}</span>
    </div>
    <div className="rounded border border-primary bg-layer-3 p-3">{children}</div>
  </section>
);

export default ConversationDetailPanel;
