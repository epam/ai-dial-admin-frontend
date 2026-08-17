'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

interface Props {
  className: string;
  children: ReactNode;
}

const ConversationRailShell: FC<Props> = ({ className, children }) => (
  <aside
    className={classNames(
      'flex h-full w-[360px] shrink-0 overflow-y-auto border-l border-primary bg-layer-2 p-4',
      className,
    )}
  >
    {children}
  </aside>
);

export default ConversationRailShell;
