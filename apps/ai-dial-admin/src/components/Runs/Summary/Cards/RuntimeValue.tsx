'use client';

import { FC } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { sumRunTimeParts } from '@/src/components/Runs/Summary/utils';
import { formatRunDuration } from '@/src/components/Runs/utils/run-list-values';
import { NO_DATA_VALUE } from './constants';
import { CardValueSection } from './models';
import TotalBreakdownValue from './TotalBreakdownValue';

interface Props {
  sourceMs: number | null;
  metricsMs: number | null;
  /** The evaluated entity's kind (Model, Application, MCP, Route) or the fallback "Source". */
  sourceLabel: string;
  section?: CardValueSection;
}

/**
 * Total runtime with its source / metrics split; an absent part shows a dash and drops out of the total.
 * With no figure at all the whole value is a single dash.
 */
const RuntimeValue: FC<Props> = ({ sourceMs, metricsMs, sourceLabel, section }) => {
  const t = useI18n();
  const total = formatRunDuration(sumRunTimeParts(sourceMs, metricsMs));

  if (total == null) {
    if (section === CardValueSection.Footer) {
      return null;
    }

    return <span className="dial-display2-text text-secondary">{NO_DATA_VALUE}</span>;
  }

  return (
    <TotalBreakdownValue
      section={section}
      total={total}
      parts={[
        { label: sourceLabel, value: formatRunDuration(sourceMs) ?? NO_DATA_VALUE },
        {
          label: t(TestSuitesI18nKey.TrendsMetricsLabel),
          value: formatRunDuration(metricsMs) ?? NO_DATA_VALUE,
        },
      ]}
    />
  );
};

export default RuntimeValue;
