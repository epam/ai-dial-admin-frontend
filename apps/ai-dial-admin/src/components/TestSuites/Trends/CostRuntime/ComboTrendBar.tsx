'use client';

import classNames from 'classnames';
import { forwardRef } from 'react';

import { InteractiveTooltip } from '@epam/ai-dial-ui-kit';

import ComboTrendTooltip from '@/src/components/TestSuites/Trends/CostRuntime/ComboTrendTooltip';
import { comboTrendTotal } from '@/src/components/TestSuites/Trends/CostRuntime/utils/fold-combo-points';
import { ComboTrendPoint } from '@/src/components/TestSuites/Trends/models';

interface Props {
  point: ComboTrendPoint;
  /** Pixel height of the stacked bar (0 when no total). */
  barHeightPx: number;
  /** Plot column height (same for every bar so tops align with the Y scale). */
  plotHeightPx: number;
  sourceLabel: string;
  metricsLabel: string;
  totalLabel: string;
  sourceSwatchClass: string;
  metricsSwatchClass: string;
  formatValue: (value: number | null) => string;
}

/**
 * One combo column: metrics (violet) on top of source (blue), bottom-aligned in the plot.
 * Exposes a ref on the bar stack for the total-line overlay.
 */
const ComboTrendBar = forwardRef<HTMLDivElement, Props>(
  (
    {
      point,
      barHeightPx,
      plotHeightPx,
      sourceLabel,
      metricsLabel,
      totalLabel,
      sourceSwatchClass,
      metricsSwatchClass,
      formatValue,
    },
    ref,
  ) => {
    const total = comboTrendTotal(point);
    const source = point.source != null && point.source > 0 ? point.source : 0;
    const metrics = point.metrics != null && point.metrics > 0 ? point.metrics : 0;
    const ariaLabel = `${point.runName}: ${formatValue(point.source)} ${sourceLabel}, ${formatValue(point.metrics)} ${metricsLabel}, ${formatValue(total)} ${totalLabel}`;

    const barTooltip = (
      <ComboTrendTooltip
        point={point}
        sourceLabel={sourceLabel}
        metricsLabel={metricsLabel}
        totalLabel={totalLabel}
        sourceSwatchClass={sourceSwatchClass}
        metricsSwatchClass={metricsSwatchClass}
        formatValue={formatValue}
      />
    );

    return (
      <div
        className="flex h-full min-w-px max-w-[52px] flex-1 flex-col items-center justify-end"
        style={{ height: plotHeightPx }}
      >
        <InteractiveTooltip
          content={barTooltip}
          asChild
          triggerClassName="flex w-full flex-col items-center justify-end"
        >
          <div
            ref={ref}
            className="flex w-full cursor-pointer flex-col overflow-hidden rounded"
            style={{ height: barHeightPx > 0 ? barHeightPx : 0 }}
            role="img"
            aria-label={ariaLabel}
            data-combo-bar={point.runId}
          >
            {total != null && total > 0 && (
              <>
                {/*
                  Normalize grow factors so they sum to 1. Raw sub-dollar costs (e.g. 0.29)
                  sum to < 1 and CSS flex only fills that fraction of the bar — leaving the
                  colored stack short while the container (and total line) stay correct.
                */}
                {metrics > 0 && (
                  <div
                    className={classNames('w-full min-h-0', metricsSwatchClass)}
                    style={{ flexGrow: metrics / total, flexShrink: 0, flexBasis: 0 }}
                    data-segment="metrics"
                  />
                )}
                {source > 0 && (
                  <div
                    className={classNames('w-full min-h-0', sourceSwatchClass)}
                    style={{ flexGrow: source / total, flexShrink: 0, flexBasis: 0 }}
                    data-segment="source"
                  />
                )}
              </>
            )}
          </div>
        </InteractiveTooltip>
      </div>
    );
  },
);

ComboTrendBar.displayName = 'ComboTrendBar';

export default ComboTrendBar;
