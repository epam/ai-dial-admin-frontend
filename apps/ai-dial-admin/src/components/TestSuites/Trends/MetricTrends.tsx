'use client';

import { FC, useEffect, useState } from 'react';

import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import MetricStatisticControl from '@/src/components/Common/MetricStatistics/MetricStatisticControl';
import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import MetricTrendCard from '@/src/components/TestSuites/Trends/MetricTrendCard';
import { MetricTrendGroup, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  runOrder: TrendsRunPoint[];
  runCount: number;
  statistics: string[];
  byStatistic: Record<string, MetricTrendGroup[]>;
  isLoading?: boolean;
}

const MetricTrends: FC<Props> = ({ runOrder, runCount, statistics, byStatistic, isLoading }) => {
  const t = useI18n();
  const [selectedStatistic, setSelectedStatistic] = useState<string | null>(statistics[0] ?? null);

  useEffect(() => {
    if (!statistics.length) {
      setSelectedStatistic(null);
      return;
    }
    if (!selectedStatistic || !statistics.includes(selectedStatistic)) {
      setSelectedStatistic(statistics[0]);
    }
  }, [selectedStatistic, statistics]);

  const groups = selectedStatistic ? (byStatistic[selectedStatistic] ?? []) : [];

  return (
    <SummarySection
      isFillHeight={false}
      title={
        <>
          {t(TestSuitesI18nKey.MetricTrends)}{' '}
          <span className="font-normal text-secondary">
            · {t(TestSuitesI18nKey.TrendsRunsCount, { count: runCount })}
          </span>
        </>
      }
      control={
        <MetricStatisticControl
          statistics={statistics}
          value={selectedStatistic}
          onChange={setSelectedStatistic}
          ariaLabel={t(TestSuitesI18nKey.MetricTrends)}
        />
      }
    >
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <DialLoader size={32} />
        </div>
      ) : !groups.length ? (
        <DialNoDataContent title={t(BasicI18nKey.NoData)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <MetricTrendCard key={group.name} group={group} runOrder={runOrder} />
          ))}
        </div>
      )}
    </SummarySection>
  );
};

export default MetricTrends;
