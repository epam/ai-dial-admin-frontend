'use client';

import { FC, useCallback, useMemo } from 'react';

import { DialAnalyticsBarGroup, DialLoader, DialSegmentedControl, SegmentedControlOption } from '@epam/ai-dial-ui-kit';

import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { METRIC_STATISTIC_DESCRIPTIONS, METRIC_STATISTIC_DESCRIPTIONS_TURNS } from './constants';
import { MetricScoresData, MetricStatistic } from './models';
import SummarySection from './SummarySection';

interface Props {
  /** Parsed metric scores from the parent; `null` while loading. */
  data: MetricScoresData | null;
  selectedStatistic: string | null;
  onSelectStatistic: (statistic: string) => void;
  /** Selects a metric (shared with the Distribution section) when a bar is clicked. */
  onSelectMetric: (name: string) => void;
  /** True when the run contains multi-turn test cases — switches the description to turn-scoped wording. */
  isMultiTurn?: boolean;
}

const MetricScoresSection: FC<Props> = ({
  data,
  selectedStatistic,
  onSelectStatistic,
  onSelectMetric,
  isMultiTurn,
}) => {
  const t = useI18n();

  const options = useMemo<SegmentedControlOption[]>(
    () => (data?.statistics ?? []).map((statistic) => ({ value: statistic, label: statistic })),
    [data?.statistics],
  );

  const onStatisticChange = useCallback((value: string) => onSelectStatistic(value), [onSelectStatistic]);

  const groups = selectedStatistic ? (data?.byStatistic[selectedStatistic] ?? []) : [];

  const descriptions = isMultiTurn ? METRIC_STATISTIC_DESCRIPTIONS_TURNS : METRIC_STATISTIC_DESCRIPTIONS;
  const descriptionKey = selectedStatistic ? descriptions[selectedStatistic as MetricStatistic] : undefined;

  const control =
    options.length > 0 && selectedStatistic ? (
      <DialSegmentedControl
        ariaLabel={t(RunsI18nKey.MetricScoresTitle)}
        options={options}
        value={selectedStatistic}
        onChange={onStatisticChange}
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <DialAnalyticsBarGroup
            key={group.name}
            title={group.name}
            data={group.bars}
            maxValue={Math.max(1, ...Object.values(group.bars))}
            onBarClick={(bar) => onSelectMetric(`${group.name}.${bar}`)}
            inline
            nonCollapsible
            defaultExpanded
            className="bg-layer-2"
            barDescriptions={group.barDescriptions}
            titleTooltip={group.description}
            barClassName="hover:bg-accent-primary-alpha hover:cursor-pointer rounded-sm px-1"
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
