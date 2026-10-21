'use client';

import { CSSProperties, FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { Tooltip } from '@epam/ai-dial-ui-kit';

import DeltaBadge from '@/src/components/Analytics/Usage/Delta/DeltaBadge';
import { BreakdownDeltas, BreakdownRowModel, KpiMetric } from '@/src/components/Analytics/Usage/models';
import { getFigureRulerVar } from '@/src/components/Analytics/Usage/utils/figure-width';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

export interface MeasureCellParams {
  /** Decides which direction of change reads as welcome, the way the KPI cards decide it. */
  metric: KpiMetric;
  deltaKey: keyof BreakdownDeltas;
  /** The figure as the column states it; null renders the no-value dash. */
  format: (row: BreakdownRowModel) => string | null;
  /**
   * The same figure unrounded, shown on hover. A column rounds to stay readable, and the rounding
   * can hide what the change beside it is measuring: an error rate printed `0.0%` still rose by
   * half again, because it was never zero.
   */
  formatExact?: (row: BreakdownRowModel) => string | null;
}

const RULER_VAR = '--breakdown-figure-ruler';

const MeasureCell: FC<ICellRendererParams<BreakdownRowModel> & MeasureCellParams> = ({
  data,
  column,
  metric,
  deltaKey,
  format,
  formatExact,
}) => {
  const t = useI18n();
  const colId = column?.getColId();

  if (!data) {
    return null;
  }

  const value = format(data);
  const delta = data.deltas[deltaKey];
  const exact = formatExact?.(data);
  const figure = (
    <span className="tabular-nums text-primary">
      {value ?? '—'}
      {/* The tooltip is a pointer's route to the unrounded reading; this is everyone else's. On an
          error rate printed `0.0%` beside a rise, that reading is the only route to the counts. */}
      {exact && value && <span className="sr-only">{exact}</span>}
    </span>
  );

  return (
    <span className="flex w-full items-center justify-end gap-2.5">
      <span className="flex items-center justify-end">
        {delta != null && <DeltaBadge ratio={delta} metric={metric} />}
        {delta == null && data.isNewRow && deltaKey === 'calls' && (
          <span className="dial-tiny-text text-secondary">{t(AnalyticsUsageI18nKey.RowIsNew)}</span>
        )}
      </span>
      <span className="grid shrink-0 items-center justify-items-end">
        {colId && (
          <span
            aria-hidden
            className="invisible col-start-1 row-start-1 h-0 overflow-hidden tabular-nums after:content-[var(--breakdown-figure-ruler)]"
            style={{ [RULER_VAR]: `var(${getFigureRulerVar(colId)}, "")` } as CSSProperties}
          />
        )}
        <span className="col-start-1 row-start-1">
          {exact && value ? <Tooltip tooltip={exact}>{figure}</Tooltip> : figure}
        </span>
      </span>
    </span>
  );
};

export default MeasureCell;
