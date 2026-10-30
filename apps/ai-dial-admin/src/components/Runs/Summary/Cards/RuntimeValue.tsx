'use client';

import { FC } from 'react';

import { RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { sumRunTimeParts } from '@/src/components/Runs/Summary/utils';
import { NO_DATA_VALUE } from './constants';
import TotalBreakdownValue from './TotalBreakdownValue';
import { formatSecondsLabel } from './utils';

interface Props {
  sourceMs: number | null;
  metricsMs: number | null;
  /** The evaluated entity's kind (Model, Application, MCP, Route) or the fallback "Source". */
  sourceLabel: string;
}

/**
 * Total runtime with its source / metrics split; an absent part shows a dash and drops out of the total.
 * With no figure at all the whole value is a single dash.
 */
const RuntimeValue: FC<Props> = ({ sourceMs, metricsMs, sourceLabel }) => {
  const t = useI18n();
  const suffix = t(RunsI18nKey.Seconds);
  const total = formatSecondsLabel(sumRunTimeParts(sourceMs, metricsMs), suffix);

  if (total == null) {
    return <span className="dial-display2-text text-secondary">{NO_DATA_VALUE}</span>;
  }

  return (
    <TotalBreakdownValue
      total={total}
      parts={[
        { label: sourceLabel, value: formatSecondsLabel(sourceMs, suffix) ?? NO_DATA_VALUE },
        {
          label: t(TestSuitesI18nKey.TrendsMetricsLabel),
          value: formatSecondsLabel(metricsMs, suffix) ?? NO_DATA_VALUE,
        },
      ]}
    />
  );
};

export default RuntimeValue;
