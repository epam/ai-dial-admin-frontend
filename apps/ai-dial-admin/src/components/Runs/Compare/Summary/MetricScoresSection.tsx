'use client';

import { FC, useCallback, useMemo } from 'react';

import { DialAnalyticsBarGroup, DialLoader } from '@epam/ai-dial-ui-kit';

import MetricStatisticControl from '@/src/components/Common/MetricStatistics/MetricStatisticControl';
import { getMetricStatisticDescriptionKey } from '@/src/components/Common/MetricStatistics/utils';
import { getCompareBarGroups, unionStatistics, maxBarValue } from '@/src/components/Runs/Compare/Summary/utils';
import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import { METRIC_SCORES_GRID_CLASS } from '@/src/components/Runs/Summary/constants';
import { MetricScoresData } from '@/src/components/Runs/Summary/models';
import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  primaryData: MetricScoresData | null;
  comparedData: MetricScoresData | null;
  runs: CompareRun[];
  selectedStatistic: string | null;
  onSelectStatistic: (statistic: string) => void;
  onSelectMetric: (name: string) => void;
}

const MetricScoresSection: FC<Props> = ({
  primaryData,
  comparedData,
  runs,
  selectedStatistic,
  onSelectStatistic,
  onSelectMetric,
}) => {
  const t = useI18n();

  const statistics = useMemo(
    () => unionStatistics(primaryData?.statistics ?? [], comparedData?.statistics ?? []),
    [primaryData?.statistics, comparedData?.statistics],
  );

  const onStatisticChange = useCallback((value: string) => onSelectStatistic(value), [onSelectStatistic]);

  const groups = useMemo(
    () => getCompareBarGroups(primaryData, comparedData, selectedStatistic),
    [primaryData, comparedData, selectedStatistic],
  );

  const descriptionKey = getMetricStatisticDescriptionKey(selectedStatistic);

  const [firstLabel, secondLabel] = runs.map((run) => run.name);

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
      <div className={METRIC_SCORES_GRID_CLASS}>
        {groups.map((group) => {
          const barsBySlot = { [CompareRunSlot.Primary]: group.data, [CompareRunSlot.Secondary]: group.compareData };
          const [data, compareData] = runs.map((run) => barsBySlot[run.slot]);

          return (
            <DialAnalyticsBarGroup
              key={group.name}
              title={group.name}
              data={data}
              compareData={compareData}
              compareLabels={[firstLabel, secondLabel]}
              maxValue={maxBarValue(group.data, group.compareData)}
              onBarClick={(bar) => onSelectMetric(`${group.name}.${bar}`)}
              inline
              nonCollapsible
              defaultExpanded
              className="min-w-0 overflow-hidden bg-layer-2"
              barDescriptions={group.barDescriptions}
              barClassName="hover:bg-accent-primary-alpha hover:cursor-pointer rounded-xs px-1"
              titleTooltip={group.description}
              barTitleClassName="block min-w-0 truncate text-secondary"
            />
          );
        })}
      </div>
    );
  };

  return (
    <SummarySection
      title={t(RunsI18nKey.MetricScoresTitle)}
      description={descriptionKey ? t(descriptionKey) : undefined}
      control={
        <MetricStatisticControl
          statistics={statistics}
          value={selectedStatistic}
          onChange={onStatisticChange}
          ariaLabel={t(RunsI18nKey.MetricScoresTitle)}
        />
      }
    >
      {renderContent()}
    </SummarySection>
  );
};

export default MetricScoresSection;
