'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { PASS_RATE_BAND_CLASS } from '@/src/components/Common/PassRateBar/constants';
import { formatPassRatePercent, getPassRateBand } from '@/src/components/Common/PassRateBar/utils';

interface Props {
  /** Rate as a 0–1 fraction. */
  rate: number;
  /** Accessible name — the card title the bar belongs to. */
  label: string;
  className?: string;
}

const PassRateBar: FC<Props> = ({ rate, label, className }) => {
  const percent = Math.min(100, Math.max(0, rate * 100));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={formatPassRatePercent(rate)}
      className={classNames('h-1 w-full overflow-hidden rounded-sm bg-layer-1', className)}
    >
      <div
        className={classNames('h-full rounded-sm', PASS_RATE_BAND_CLASS[getPassRateBand(rate)])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

export default PassRateBar;
