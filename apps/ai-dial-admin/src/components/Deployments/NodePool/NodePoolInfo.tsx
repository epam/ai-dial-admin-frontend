'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

interface Props {
  name: string;
  poolId?: string | null;
  caption?: ReactNode;
  isError?: boolean;
  className?: string;
}

const NodePoolInfo: FC<Props> = ({ name, poolId, caption, isError, className }) => (
  <div className={classNames('flex flex-col gap-0.5 min-w-0', className)}>
    <span className={classNames('dial-small-semi-text truncate', isError ? 'text-error' : 'text-primary')} title={name}>
      {name}
    </span>
    {poolId && (
      <span className="font-mono dial-tiny-text text-secondary truncate" title={poolId}>
        {poolId}
      </span>
    )}
    {caption && <span className="dial-tiny-text text-secondary truncate">{caption}</span>}
  </div>
);

export default NodePoolInfo;
