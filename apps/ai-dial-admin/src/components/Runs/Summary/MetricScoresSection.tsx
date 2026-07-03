'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialAnalyticsBarGroup, DialLoader, DialSegmentedControl, SegmentedControlOption } from '@epam/ai-dial-ui-kit';

import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { MetricScoresData } from './models';
import SummarySection from './SummarySection';

interface Props {
  /** Parsed metric scores from the parent; `null` while loading. */
  data: MetricScoresData | null;
  /** Number of test cases the metric scores are averaged across. */
  testCaseCount: number;
}

const MetricScoresSection: FC<Props> = ({ data, testCaseCount }) => {
  const t = useI18n();
  const [selectedStatistic, setSelectedStatistic] = useState<string | null>(null);

  useEffect(() => {
    setSelectedStatistic(data?.statistics[0] ?? null);
  }, [data]);

  const options = useMemo<SegmentedControlOption[]>(
    () => (data?.statistics ?? []).map((statistic) => ({ value: statistic, label: statistic })),
    [data?.statistics],
  );

  const onSelectStatistic = useCallback((value: string) => setSelectedStatistic(value), []);

  const groups = selectedStatistic ? (data?.byStatistic[selectedStatistic] ?? []) : [];

  const control =
    options.length > 0 && selectedStatistic ? (
      <DialSegmentedControl
        ariaLabel={t(RunsI18nKey.MetricScoresTitle)}
        options={options}
        value={selectedStatistic}
        onChange={onSelectStatistic}
      />
    ) : undefined;

  const renderContent = () => {
    if (!data) {
      return (
        <div className="flex h-full items-center justify-center">
          <DialLoader size={32} />
        </div>
      );
    }
    if (groups.length === 0) {
      return <p className="dial-small-text text-secondary">{t(RunsI18nKey.NoMetricScores)}</p>;
    }
    return (
      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <DialAnalyticsBarGroup
            key={group.name}
            title={group.name}
            data={group.bars}
            maxValue={Math.max(1, ...Object.values(group.bars))}
          />
        ))}
      </div>
    );
  };

  return (
    <SummarySection
      title={t(RunsI18nKey.MetricScoresTitle)}
      description={t(RunsI18nKey.MetricScoresDescription, { count: testCaseCount })}
      control={control}
    >
      {renderContent()}
    </SummarySection>
  );
};

export default MetricScoresSection;
