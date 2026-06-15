import { FC } from 'react';

import MetricCardShell from '@/src/components/Common/MetricCard/MetricCardShell';
import { STATUS_TEXT_CLASS } from '@/src/components/Common/MetricCard/constants';
import { MetricStatus } from '@/src/components/Common/MetricCard/models';

interface Props {
  title: string;
  numerator: number | null;
  denominator: number | null;
  loading: boolean;
  status?: MetricStatus;
  emptyReason?: string;
}

const RatioBadgeCard: FC<Props> = ({
  title,
  numerator,
  denominator,
  loading,
  status = MetricStatus.Neutral,
  emptyReason,
}) => {
  const isEmpty = numerator === null || denominator === null;

  return (
    <MetricCardShell title={title} loading={loading} isEmpty={isEmpty} emptyReason={emptyReason} status={status}>
      <span
        className={`flex items-center justify-center font-semibold md:text-6xl text-3xl ${STATUS_TEXT_CLASS[status]}`}
      >
        {numerator}
        <span className="text-secondary font-extralight mx-1 md:text-3xl text-xl">/</span>
        <span className="text-secondary font-extralight md:text-3xl text-xl">{denominator}</span>
      </span>
    </MetricCardShell>
  );
};

export default RatioBadgeCard;
