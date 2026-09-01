'use client';

import classNames from 'classnames';
import { FC } from 'react';

import PassFailFraction from '@/src/components/Common/PassFailStatus/PassFailFraction';
import PassFailStatusBreakdown from '@/src/components/Common/PassFailStatus/PassFailStatusBreakdown';
import { PassFailErrorCounts } from '@/src/components/Common/PassFailStatus/models';
import { TRENDS_RUN_WINDOW } from '@/src/components/TestSuites/Trends/constants';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  stats: PassFailErrorCounts;
  className?: string;
}

const RunsPassedThresholdCard: FC<Props> = ({ stats, className }) => {
  const t = useI18n();
  const title = `${t(TestSuitesI18nKey.RunsPassedThreshold)} · ${t(TestSuitesI18nKey.TrendsLastNRuns, {
    count: TRENDS_RUN_WINDOW,
  })}`;

  return (
    <div
      className={classNames(
        'flex flex-col justify-between gap-3 rounded-lg border border-secondary bg-layer-3 p-4',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="dial-small-text text-secondary">{title}</p>
        <PassFailFraction counts={stats} />
      </div>
      <PassFailStatusBreakdown counts={stats} />
    </div>
  );
};

export default RunsPassedThresholdCard;
