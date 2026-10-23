'use client';

import { FC, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { NoDataContent, Spinner } from '@epam/ai-dial-ui-kit';

import ComboTrendBar from '@/src/components/TestSuites/Trends/CostRuntime/ComboTrendBar';
import ComboTrendLegend from '@/src/components/TestSuites/Trends/CostRuntime/ComboTrendLegend';
import ComboTrendLine, { ComboLinePoint } from '@/src/components/TestSuites/Trends/CostRuntime/ComboTrendLine';
import ComboTrendYAxis from '@/src/components/TestSuites/Trends/CostRuntime/ComboTrendYAxis';
import {
  buildComboYTicks,
  COMBO_TREND_PLOT_HEIGHT_PX,
  COMBO_TREND_Y_LABEL_WIDTH_PX,
} from '@/src/components/TestSuites/Trends/CostRuntime/utils/combo-axis';
import {
  comboTrendMaxTotal,
  comboTrendTotal,
  hasComboTrendData,
} from '@/src/components/TestSuites/Trends/CostRuntime/utils/fold-combo-points';
import { COMBO_TREND_SEGMENT_BG } from '@/src/components/TestSuites/Trends/constants';
import { ComboTrendPoint } from '@/src/components/TestSuites/Trends/models';
import TrendRunNameLabel, {
  TREND_RUN_AXIS_LABEL_HEIGHT_PX,
} from '@/src/components/TestSuites/Trends/TrendRunNameLabel';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  points: ComboTrendPoint[];
  isLoading?: boolean;
  title: string;
  sourceLabel: string;
  metricsLabel: string;
  totalLabel: string;
  totalTooltipLabel: string;
  lineColor: string;
  formatValue: (value: number | null) => string;
  formatTick: (value: number) => string;
}

const ComboTrendChart: FC<Props> = ({
  points,
  isLoading,
  title,
  sourceLabel,
  metricsLabel,
  totalLabel,
  totalTooltipLabel,
  lineColor,
  formatValue,
  formatTick,
}) => {
  const t = useI18n();
  const plotRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [linePoints, setLinePoints] = useState<(ComboLinePoint | null)[]>([]);
  const [plotSize, setPlotSize] = useState({ width: 0, height: COMBO_TREND_PLOT_HEIGHT_PX });

  const hasData = hasComboTrendData(points);
  const maxTotal = comboTrendMaxTotal(points);
  const ticks = useMemo(() => buildComboYTicks(maxTotal), [maxTotal]);
  const axisMax = ticks[0] ?? 1;

  useLayoutEffect(() => {
    const plot = plotRef.current;
    if (!plot || !hasData) {
      setLinePoints([]);
      return;
    }

    const measure = () => {
      const plotRect = plot.getBoundingClientRect();
      setPlotSize({ width: plotRect.width, height: plotRect.height });

      const next: (ComboLinePoint | null)[] = points.map((point, index) => {
        const total = comboTrendTotal(point);
        const barEl = barRefs.current[index];
        if (total == null || !barEl) {
          return null;
        }
        const barRect = barEl.getBoundingClientRect();
        // Zero-height stacks sit on the plot baseline; use the bar bottom when height is 0.
        const y = barRect.height > 0 ? barRect.top - plotRect.top : barRect.bottom - plotRect.top;
        return {
          x: barRect.left + barRect.width / 2 - plotRect.left,
          y,
        };
      });
      setLinePoints(next);
    };

    measure();

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(plot);
    return () => observer?.disconnect();
  }, [points, axisMax, hasData, isLoading]);

  return (
    <section
      className="flex min-w-0 w-full flex-1 flex-col gap-3 rounded-lg border border-secondary bg-layer-3 p-4"
      aria-label={title}
    >
      <h3 className="dial-body-semi-text text-primary">{title}</h3>
      <ComboTrendLegend
        sourceLabel={sourceLabel}
        metricsLabel={metricsLabel}
        totalLabel={totalLabel}
        sourceSwatchClass={COMBO_TREND_SEGMENT_BG.source}
        metricsSwatchClass={COMBO_TREND_SEGMENT_BG.metrics}
        lineColor={lineColor}
      />
      {isLoading && points.length === 0 ? (
        <div className="flex items-center justify-center" style={{ height: COMBO_TREND_PLOT_HEIGHT_PX }}>
          <Spinner size={32} />
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center" style={{ height: COMBO_TREND_PLOT_HEIGHT_PX }}>
          <NoDataContent title={t(BasicI18nKey.NoData)} />
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full items-start gap-[5px]">
            <ComboTrendYAxis ticks={ticks} formatTick={formatTick} />
            <div
              ref={plotRef}
              className="relative min-w-0 flex-1 overflow-hidden rounded border border-secondary"
              style={{ height: COMBO_TREND_PLOT_HEIGHT_PX }}
            >
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                {ticks.map((tick, index) => (
                  <div
                    key={`${tick}-${index}`}
                    className="absolute inset-x-0 border-t border-secondary"
                    style={{ top: `${(index / (ticks.length - 1)) * 100}%` }}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-end justify-center gap-5 px-2 pt-2">
                {points.map((point, index) => {
                  const total = comboTrendTotal(point);
                  const barHeightPx =
                    total != null && axisMax > 0
                      ? Math.max(0, (total / axisMax) * (COMBO_TREND_PLOT_HEIGHT_PX - 8))
                      : 0;
                  return (
                    <ComboTrendBar
                      key={point.runId}
                      ref={(el) => {
                        barRefs.current[index] = el;
                      }}
                      point={point}
                      barHeightPx={barHeightPx}
                      plotHeightPx={COMBO_TREND_PLOT_HEIGHT_PX - 8}
                      sourceLabel={sourceLabel}
                      metricsLabel={metricsLabel}
                      totalLabel={totalTooltipLabel}
                      sourceSwatchClass={COMBO_TREND_SEGMENT_BG.source}
                      metricsSwatchClass={COMBO_TREND_SEGMENT_BG.metrics}
                      formatValue={formatValue}
                    />
                  );
                })}
              </div>
              <ComboTrendLine points={linePoints} color={lineColor} width={plotSize.width} height={plotSize.height} />
            </div>
          </div>
          <div className="flex w-full gap-[5px]">
            <div className="shrink-0" style={{ width: COMBO_TREND_Y_LABEL_WIDTH_PX }} aria-hidden />
            <div
              className="flex min-w-0 flex-1 justify-center gap-5 px-2"
              style={{ height: TREND_RUN_AXIS_LABEL_HEIGHT_PX }}
            >
              {points.map((point) => (
                <div
                  key={point.runId}
                  className="flex min-w-px max-w-[72px] flex-1 items-end justify-center overflow-hidden"
                >
                  <TrendRunNameLabel
                    name={point.runName}
                    triggerClassName="flex h-full cursor-default items-center justify-center overflow-hidden"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ComboTrendChart;
