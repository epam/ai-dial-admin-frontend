'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';
import { DialTooltip } from '@epam/ai-dial-ui-kit';

interface Props {
  name: string;
  poolId?: string | null;
  caption?: ReactNode;
  isError?: boolean;
  className?: string;
}

const NodePoolInfo: FC<Props> = ({ name, poolId, caption, isError, className }) => (
  <div className={classNames('flex flex-col gap-0.5 min-w-0', className)}>
    <DialTooltip tooltip={name} triggerClassName="min-w-0">
      <span className={classNames('dial-small-semi-text truncate block', isError ? 'text-error' : 'text-primary')}>
        {name}
      </span>
    </DialTooltip>
    {poolId && (
      <DialTooltip tooltip={poolId} triggerClassName="min-w-0">
        <span className="font-mono dial-tiny-text text-secondary truncate block">{poolId}</span>
      </DialTooltip>
    )}
    {caption && <span className="dial-tiny-text text-secondary truncate">{caption}</span>}
  </div>
);

export default NodePoolInfo;
