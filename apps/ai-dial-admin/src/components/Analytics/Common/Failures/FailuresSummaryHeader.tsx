import { FC } from 'react';

interface Props {
  total: number;
  unitLabel: string;
  lastFailureLabel?: string;
}

const FailuresSummaryHeader: FC<Props> = ({ total, unitLabel, lastFailureLabel }) => (
  <div className="flex flex-row flex-wrap items-baseline gap-x-2">
    <span className="dial-display3-text text-error">{total}</span>
    <span className="dial-small-text text-secondary">{unitLabel}</span>
    {lastFailureLabel && <span className="dial-small-text text-secondary">{lastFailureLabel}</span>}
  </div>
);

export default FailuresSummaryHeader;
