'use client';

import { FC } from 'react';

import { Spinner } from '@epam/ai-dial-ui-kit';

import { comboTrendTotal } from '@/src/components/TestSuites/Trends/CostRuntime/utils/fold-combo-points';
import KpiCardFrame from '@/src/components/TestSuites/Trends/Kpi/KpiCardFrame';
import KpiDeltaBadge from '@/src/components/TestSuites/Trends/Kpi/KpiDeltaBadge';
import { ComboTrendPoint } from '@/src/components/TestSuites/Trends/models';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  points: ComboTrendPoint[];
  sourceLabel: string;
  title: string;
  isLoading?: boolean;
  className?: string;
  formatValue: (value: number | null) => string;
  formatDelta: (latest: number | null, previous: number | null) => string | null;
}

const LatestComboTotalCard: FC<Props> = ({
  points,
  sourceLabel,
  title,
  isLoading,
  className,
  formatValue,
  formatDelta,
}) => {
  const t = useI18n();
  const latest = points.length > 0 ? points[points.length - 1] : null;
  const previous = points.length > 1 ? points[points.length - 2] : null;
  const total = latest != null ? comboTrendTotal(latest) : null;
  const previousTotal = previous != null ? comboTrendTotal(previous) : null;
  const deltaLabel = formatDelta(total, previousTotal);

  return (
    <KpiCardFrame className={className} ariaLabel={title} title={title}>
      <div className="flex items-center gap-1">
        {isLoading && points.length === 0 ? (
          <Spinner size={24} />
        ) : total == null ? (
          <p className="dial-display2-text text-secondary">—</p>
        ) : (
          <>
            <p className="dial-display2-text text-primary">{formatValue(total)}</p>
            {deltaLabel != null && <KpiDeltaBadge label={deltaLabel} higherIsBetter={false} />}
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-4 dial-tiny-text">
        <div className="flex gap-1">
          <span className="text-secondary">{sourceLabel}:</span>
          <span className="text-primary">{formatValue(latest?.source ?? null)}</span>
        </div>
        <div className="flex gap-1">
          <span className="text-secondary">{t(TestSuitesI18nKey.TrendsMetricsLabel)}:</span>
          <span className="text-primary">{formatValue(latest?.metrics ?? null)}</span>
        </div>
      </div>
    </KpiCardFrame>
  );
};

export default LatestComboTotalCard;
