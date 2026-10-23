'use client';

import { FC, useCallback } from 'react';

import { DialAnalyticsBarGroup, Spinner } from '@epam/ai-dial-ui-kit';

import MetricStatisticControl from '@/src/components/Common/MetricStatistics/MetricStatisticControl';
import { getMetricStatisticDescriptionKey } from '@/src/components/Common/MetricStatistics/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import { METRIC_SCORES_GRID_CLASS } from './constants';
import MetricGroupTitle from './MetricGroupTitle';
import { MetricScoresData } from './models';
import SummarySection from './SummarySection';

interface Props {
  /** Parsed metric scores from the parent; `null` while loading. */
  data: MetricScoresData | null;
  selectedStatistic: string | null;
  onSelectStatistic: (statistic: string) => void;
  /** Selects a metric (shared with the Distribution section) when a bar is clicked. */
  onSelectMetric: (name: string) => void;
}

const MetricScoresSection: FC<Props> = ({ data, selectedStatistic, onSelectStatistic, onSelectMetric }) => {
  const t = useI18n();

  const onStatisticChange = useCallback((value: string) => onSelectStatistic(value), [onSelectStatistic]);

  const groups = selectedStatistic ? (data?.byStatistic[selectedStatistic] ?? []) : [];

  const descriptionKey = getMetricStatisticDescriptionKey(selectedStatistic);

  const renderContent = () => {
    if (!data) {
      return (
        <div className="flex h-full items-center justify-center">
          <Spinner size={32} fullWidth />
        </div>
      );
    }
    if (groups.length === 0) {
      return <p className="dial-small-text text-secondary">{t(RunsI18nKey.NoMetricScores)}</p>;
    }
    return (
      <div className={METRIC_SCORES_GRID_CLASS}>
        {groups.map((group) => (
          <DialAnalyticsBarGroup
            key={group.name}
            title={<MetricGroupTitle name={group.name} description={group.description} />}
            data={group.bars}
            maxValue={Math.max(1, ...Object.values(group.bars).filter((value): value is number => value != null))}
            onBarClick={(bar) => onSelectMetric(`${group.name}.${bar}`)}
            inline
            nonCollapsible
            defaultExpanded
            className="min-w-0 overflow-hidden bg-layer-2"
            barDescriptions={group.barDescriptions}
            barClassName="hover:bg-accent-primary-alpha hover:cursor-pointer rounded-xs px-1"
            barTitleClassName="block min-w-0 truncate text-secondary"
          />
        ))}
      </div>
    );
  };

  return (
    <SummarySection
      title={t(RunsI18nKey.MetricScoresTitle)}
      description={descriptionKey ? t(descriptionKey) : undefined}
      control={
        <MetricStatisticControl
          statistics={data?.statistics ?? []}
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
