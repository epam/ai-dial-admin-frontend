'use client';

import classNames from 'classnames';
import { FC } from 'react';

interface Props {
  swatchClass: string;
  label: string;
  count: number;
}

const LatestRunLegendRow: FC<Props> = ({ swatchClass, label, count }) => (
  <div className="flex w-full items-center justify-between gap-2">
    <span className="flex min-w-0 items-center gap-2">
      <span className={classNames('size-2 shrink-0 rounded-[2px]', swatchClass)} aria-hidden />
      <span className="dial-small-text text-secondary whitespace-nowrap truncate">{label}</span>
    </span>
    <span className="dial-small-text shrink-0 tabular-nums text-primary">{count}</span>
  </div>
);

export default LatestRunLegendRow;
