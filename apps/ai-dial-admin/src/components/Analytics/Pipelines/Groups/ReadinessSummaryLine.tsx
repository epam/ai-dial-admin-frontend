'use client';

import { FC } from 'react';

import { CONDITION_META } from '@/src/components/Analytics/Pipelines/Groups/constants';
import { GroupCondition, ReadinessItem } from '@/src/components/Analytics/Pipelines/Groups/models';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { formatDuration, parseDuration } from '@/src/utils/analytics/duration';

interface Props {
  item: ReadinessItem;
}

/** A declared duration in the editor's short spelling where it has one, as written where it does not. */
const durationLabel = (value?: string): string => {
  const parsed = parseDuration(value);
  return parsed ? formatDuration(parsed) : (value ?? '');
};

/** One condition of the readiness rule, stated from the declaration alone, with its value set apart. */
const ReadinessSummaryLine: FC<Props> = ({ item }) => {
  const t = useI18n();
  const label = t(CONDITION_META[item.condition].summaryKey);

  switch (item.condition) {
    case GroupCondition.Idle:
    case GroupCondition.MaxStaleness:
      return (
        <span>
          {label} <strong className="font-semibold text-primary">{durationLabel(item.value)}</strong>
        </span>
      );
    // The predicate is shown as written: it is an expression over the source's columns, and paraphrasing it
    // would be a second grammar.
    case GroupCondition.Signal:
      return (
        <span>
          {label} <code className="font-mono text-accent-secondary">{item.value}</code>
        </span>
      );
    case GroupCondition.CostCeiling:
      return (
        <span>
          {label} <strong className="font-semibold text-primary">{item.value}</strong>{' '}
          {t(AnalyticsPipelinesI18nKey.GroupsConditionCeilingSuffix)}
        </span>
      );
    case GroupCondition.DefaultIdle:
      return <span>{label}</span>;
  }
};

export default ReadinessSummaryLine;
