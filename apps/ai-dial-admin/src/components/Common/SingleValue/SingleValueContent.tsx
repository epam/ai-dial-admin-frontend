import classNames from 'classnames';
import { FC } from 'react';

import MetricCardShell from '@/src/components/Common/MetricCard/MetricCardShell';
import { STATUS_TEXT_CLASS } from '@/src/components/Common/MetricCard/constants';
import { MetricStatus } from '@/src/components/Common/MetricCard/models';
import { UnitPosition } from '@/src/components/Common/SingleValue/models';
import { formatNumberWithExponent } from '@/src/utils/formatting/number-formatting';

interface Props {
  title: string;
  value: number | null;
  loading: boolean;
  unit?: string;
  unitPosition?: UnitPosition;
  status?: MetricStatus;
  emptyReason?: string;
}

const SingleValueContent: FC<Props> = ({
  title,
  value,
  loading,
  unit,
  unitPosition = UnitPosition.Prefix,
  status,
  emptyReason,
}) => {
  return (
    <MetricCardShell title={title} loading={loading} isEmpty={value === null} status={status} emptyReason={emptyReason}>
      <span
        className={classNames(
          'flex items-center justify-center md:text-6xl font-semibold text-3xl nowrap',
          STATUS_TEXT_CLASS[status ?? MetricStatus.Neutral],
        )}
      >
        {unit && unitPosition === UnitPosition.Prefix && (
          <span className="text-secondary font-extralight mr-1 md:text-3xl text-xl">{unit}</span>
        )}
        {value !== null && formatNumberWithExponent(value)}
        {unit && unitPosition === UnitPosition.Suffix && (
          <span className="text-secondary font-extralight ml-1 md:text-3xl text-xl">{unit}</span>
        )}
      </span>
    </MetricCardShell>
  );
};

export default SingleValueContent;
