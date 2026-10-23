'use client';

import { FC, useEffect, useState } from 'react';

import { Spinner, NoDataContent } from '@epam/ai-dial-ui-kit';

import MetricStatisticControl from '@/src/components/Common/MetricStatistics/MetricStatisticControl';
import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import MetricTrendCard from '@/src/components/TestSuites/Trends/MetricTrends/MetricTrendCard';
import { MetricTrendGroup, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  runOrder: TrendsRunPoint[];
  statistics: string[];
  byStatistic: Record<string, MetricTrendGroup[]>;
  isLoading?: boolean;
}

const MetricTrends: FC<Props> = ({ runOrder, statistics, byStatistic, isLoading }) => {
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
      title={t(TestSuitesI18nKey.MetricTrends)}
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
          <Spinner size={32} fullWidth />
        </div>
      ) : !groups.length ? (
        <NoDataContent title={t(BasicI18nKey.NoData)} />
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
