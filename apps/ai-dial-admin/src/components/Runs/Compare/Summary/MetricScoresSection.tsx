'use client';

import { FC, useCallback, useMemo } from 'react';

import { DialAnalyticsBarGroup, DialLoader, DialSegmentedControl, SegmentedControlOption } from '@epam/ai-dial-ui-kit';

import { getCompareBarGroups, intersectStatistics, maxBarValue } from '@/src/components/Runs/Compare/Summary/utils';
import { METRIC_STATISTIC_DESCRIPTIONS } from '@/src/components/Runs/Summary/constants';
import { MetricScoresData, MetricStatistic } from '@/src/components/Runs/Summary/models';
import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  primaryData: MetricScoresData | null;
  comparedData: MetricScoresData | null;
  primaryRunName: string;
  comparedRunName: string;
  selectedStatistic: string | null;
  onSelectStatistic: (statistic: string) => void;
}

const MetricScoresSection: FC<Props> = ({
  primaryData,
  comparedData,
  primaryRunName,
  comparedRunName,
  selectedStatistic,
  onSelectStatistic,
}) => {
  const t = useI18n();

  const statistics = useMemo(
    () => intersectStatistics(primaryData?.statistics ?? [], comparedData?.statistics ?? []),
    [primaryData?.statistics, comparedData?.statistics],
  );

  const options = useMemo<SegmentedControlOption[]>(
    () => statistics.map((statistic) => ({ value: statistic, label: statistic })),
    [statistics],
  );

  const onStatisticChange = useCallback((value: string) => onSelectStatistic(value), [onSelectStatistic]);

  const groups = useMemo(
    () => getCompareBarGroups(primaryData, comparedData, selectedStatistic),
    [primaryData, comparedData, selectedStatistic],
  );

  const descriptionKey = selectedStatistic
    ? METRIC_STATISTIC_DESCRIPTIONS[selectedStatistic as MetricStatistic]
    : undefined;

  const compareLabels: [string, string] = [primaryRunName, comparedRunName];

  const control =
    options.length > 0 && selectedStatistic ? (
      <DialSegmentedControl
        ariaLabel={t(RunsI18nKey.MetricScoresTitle)}
        options={options}
        value={selectedStatistic}
        onChange={onStatisticChange}
      />
    ) : undefined;

  const isLoading = !primaryData || !comparedData;

  const renderContent = () => {
    if (isLoading) {
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <DialAnalyticsBarGroup
            key={group.name}
            title={group.name}
            data={group.data}
            compareData={group.compareData}
            compareLabels={compareLabels}
            maxValue={maxBarValue(group.data, group.compareData)}
            inline
            nonCollapsible
            defaultExpanded
            className="bg-layer-2"
            titleTooltip={group.description}
            barTitleClassName="text-secondary"
          />
        ))}
      </div>
    );
  };

  return (
    <SummarySection
      title={t(RunsI18nKey.MetricScoresTitle)}
      description={descriptionKey ? t(descriptionKey) : undefined}
      control={control}
    >
      {renderContent()}
    </SummarySection>
  );
};

export default MetricScoresSection;
