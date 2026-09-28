'use client';

import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { DialTooltip } from '@epam/ai-dial-ui-kit';

import DeltaValue from '@/src/components/Analytics/Usage/Delta/DeltaValue';
import { BreakdownDeltas, BreakdownRowModel, KpiMetric } from '@/src/components/Analytics/Usage/models';
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

/** The pill the KPI cards put their own change in, so one change reads the same way page-wide. */
const DELTA_PILL_CLASS = 'dial-tiny-semi-text rounded bg-layer-4 px-1.5 py-0.5';

/**
 * A measure and how it moved.
 *
 * The change sits beside the figure it belongs to rather than in a column of its own: one `Δ`
 * column could only ever compare one measure, and next to `Cost` it read as a change in money
 * while it was counting calls.
 */
const MeasureCell: FC<ICellRendererParams<BreakdownRowModel> & MeasureCellParams> = ({
  data,
  metric,
  deltaKey,
  format,
  formatExact,
}) => {
  const t = useI18n();

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
    /* The figure ends on the cell's right edge, like every other number in the table, and the change
       sits in a track of its own — right-aligned, so the pills end on one line too and each still
       reads as belonging to the figure it touches. Letting the pill's width push the number around
       left both columns ragged. */
    <span className="flex w-full items-center justify-end gap-1.5">
      <span className="flex w-[86px] shrink-0 justify-end">
        {delta != null && <DeltaValue ratio={delta} metric={metric} className={DELTA_PILL_CLASS} />}
        {/* A row the previous window never held has nothing to divide by, so it says that instead
            of a change — once, on the column the ranking is built from. */}
        {delta == null && data.isNewRow && deltaKey === 'calls' && (
          <span className="dial-tiny-text text-secondary">{t(AnalyticsUsageI18nKey.RowIsNew)}</span>
        )}
      </span>
      {exact && value ? <DialTooltip tooltip={exact}>{figure}</DialTooltip> : figure}
    </span>
  );
};

export default MeasureCell;
