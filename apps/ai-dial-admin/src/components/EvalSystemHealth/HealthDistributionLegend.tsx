'use client';

import { FC } from 'react';

import ChartLegend from '@/src/components/Analytics/Usage/Charts/ChartLegend';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useChartColors } from '@/src/hooks/use-chart-colors';
import { useI18n } from '@/src/locales/client';

interface Props {
  threshold: number;
}

/** Names the two bands with the threshold the backend applied. Plain text: the bands are not filters. */
const HealthDistributionLegend: FC<Props> = ({ threshold }) => {
  const t = useI18n();
  const colors = useChartColors();

  return (
    <ChartLegend
      entries={[
        {
          id: 'healthy',
          label: t(EvalSystemHealthI18nKey.HealthDistributionLegendHealthy, { threshold }),
          color: colors.success,
        },
        {
          id: 'fail',
          label: t(EvalSystemHealthI18nKey.HealthDistributionLegendFail, { threshold }),
          color: colors.error,
        },
      ]}
    />
  );
};

export default HealthDistributionLegend;
