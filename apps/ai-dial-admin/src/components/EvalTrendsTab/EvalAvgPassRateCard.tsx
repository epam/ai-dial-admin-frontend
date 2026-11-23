'use client';

import { FC, useMemo } from 'react';

import { Spinner } from '@epam/ai-dial-ui-kit';

import { formatPassRatePercent } from '@/src/components/Common/PassRateBar/utils';
import EvalPassRateTrendBadge from '@/src/components/EvalTrendsTab/EvalPassRateTrendBadge';
import { getPassRateTrend } from '@/src/components/EvalTrendsTab/suite-pass-rate';
import { useSuitePassRate } from '@/src/components/EvalTrendsTab/use-suite-pass-rate';
import KpiCardFrame from '@/src/components/TestSuites/Trends/Kpi/KpiCardFrame';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  suiteIds: string[];
  suiteCount: number;
}

const MISSING_RATE = '—';

const EvalAvgPassRateCard: FC<Props> = ({ suiteIds, suiteCount }) => {
  const t = useI18n();
  const { summary, isLoading } = useSuitePassRate(suiteIds);
  const title = t(TestSuitesI18nKey.EvalTrendsAvgPassRateTitle);
  const trend = useMemo(
    () => getPassRateTrend(summary.passRate, summary.previousPassRate),
    [summary.passRate, summary.previousPassRate],
  );

  return (
    <KpiCardFrame className="w-full max-w-[24.625rem]" ariaLabel={title} title={title}>
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1">
          {isLoading ? (
            <Spinner size={24} />
          ) : summary.passRate == null ? (
            <p className="dial-display2-text text-secondary">{MISSING_RATE}</p>
          ) : (
            <>
              <p className="dial-display2-text text-primary">{formatPassRatePercent(summary.passRate)}</p>
              {trend != null && <EvalPassRateTrendBadge trend={trend} />}
            </>
          )}
        </div>
        <p className="dial-tiny-text text-secondary">
          {t(TestSuitesI18nKey.EvalTrendsBasedOnAllSuites, { count: suiteCount })}
        </p>
      </div>
    </KpiCardFrame>
  );
};

export default EvalAvgPassRateCard;
