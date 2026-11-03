'use client';

import { CSSProperties } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { Tooltip } from '@epam/ai-dial-ui-kit';

import DeltaBadge from '@/src/components/Analytics/Usage/Delta/DeltaBadge';
import { BreakdownRowModel, KpiMetric } from '@/src/components/Analytics/Usage/models';
import { getDeltaRulerKey, getFigureRulerVar } from '@/src/components/Analytics/Usage/utils/figure-width';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

/** Generic over the row, so a custom dashboard's table can draw its figures with the breakdown's own cell. */
export interface MeasureCellParams<TRow = BreakdownRowModel> {
  /** Decides which direction of change reads as welcome, the way the KPI cards decide it. */
  metric?: KpiMetric;
  /** Says it instead where there is no metric to decide from. */
  isRiseGood?: boolean;
  getDelta: (row: TRow) => number | null | undefined;
  /** Whether the row is absent from the compared window, which this column says in place of a change. */
  isNew?: (row: TRow) => boolean;
  /** The figure as the column states it; null renders the no-value dash. Absent, the grid's formatted value. */
  format?: (row: TRow) => string | null;
  /**
   * The same figure unrounded, shown on hover. A column rounds to stay readable, and the rounding
   * can hide what the change beside it is measuring: an error rate printed `0.0%` still rose by
   * half again, because it was never zero.
   */
  formatExact?: (row: TRow) => string | null;
}

const RULER_VAR = '--breakdown-figure-ruler';

const MeasureCell = <TRow = BreakdownRowModel,>({
  data,
  column,
  valueFormatted,
  metric,
  isRiseGood,
  getDelta,
  isNew,
  format,
  formatExact,
}: ICellRendererParams<TRow> & MeasureCellParams<TRow>) => {
  const t = useI18n();
  const colId = column?.getColId();

  if (!data) {
    return null;
  }

  const value = format ? format(data) : (valueFormatted ?? null);
  const delta = getDelta(data);
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
      <span className="grid items-center justify-items-end">
        {/* Sized like the column's widest badge — its text plus the arrow and padding — so every badge in
            the column takes that width and their left edges line up as the figures' right edges do. */}
        {colId && delta != null && (
          <span
            aria-hidden
            className="invisible col-start-1 row-start-1 h-0 overflow-hidden pl-[30px] pr-3 dial-tiny-semi-text tabular-nums after:content-[var(--breakdown-figure-ruler)]"
            style={{ [RULER_VAR]: `var(${getFigureRulerVar(getDeltaRulerKey(colId))}, "")` } as CSSProperties}
          />
        )}
        {delta != null && (
          <span className="col-start-1 row-start-1 flex w-full justify-end">
            <DeltaBadge ratio={delta} metric={metric} isRiseGood={isRiseGood} className="w-full" />
          </span>
        )}
        {delta == null && isNew?.(data) && (
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
