'use client';

import { useCallback, useEffect, useRef } from 'react';
import type ReactECharts from 'echarts-for-react';
import type { EChartsType } from 'echarts';

type ZrHandler = (params: { offsetX: number; offsetY: number }) => void;

type ZrEventTarget = {
  on: (eventName: 'click', handler: ZrHandler) => void;
  off: (eventName: 'click', handler: ZrHandler) => void;
};

export type ResolveStickyCategoryIndex = (
  convertFromPixel: (finder: unknown, value: number | number[]) => unknown,
  offsetX: number,
  offsetY: number,
  runCount: number,
  chartWidth: number,
  chartHeight: number,
) => number | null;

export type ResolveStickyTipTarget = (
  chart: EChartsType,
  offsetX: number,
  offsetY: number,
) => { seriesIndex: number; dataIndex: number } | null;

/**
 * Keeps an enterable ECharts tooltip open until Escape or an outside pointerdown.
 * Pair with `triggerOn: 'click'` + `enterable: true` so run links stay clickable.
 * Optional `resolveCategoryIndex` recovers first/last-run misses via zrender click → showTip
 * (Metric Trends). Optional `resolveTipTarget` supplies series/data indices directly
 * (Overall Score Trend nearest-point mapping).
 */
export const useStickyEchartsTooltip = (
  tooltipClassName: string,
  isEnabled: boolean,
  options?: {
    runCount?: number;
    resolveCategoryIndex?: ResolveStickyCategoryIndex;
    resolveTipTarget?: ResolveStickyTipTarget;
  },
) => {
  const chartRef = useRef<ReactECharts>(null);
  const zrRef = useRef<ZrEventTarget | null>(null);
  const onZrClickRef = useRef<ZrHandler | null>(null);
  const runCount = options?.runCount ?? 0;
  const resolveCategoryIndex = options?.resolveCategoryIndex;
  const resolveTipTarget = options?.resolveTipTarget;

  const onChartReady = useCallback(
    (chart: EChartsType) => {
      const hasCategoryResolver = resolveCategoryIndex != null && runCount > 0;
      const hasTipResolver = resolveTipTarget != null;
      if (!isEnabled || (!hasCategoryResolver && !hasTipResolver)) {
        return;
      }

      const prevZr = zrRef.current;
      const prevHandler = onZrClickRef.current;
      if (prevZr && prevHandler) {
        prevZr.off('click', prevHandler);
      }

      const onZrClick: ZrHandler = (params) => {
        if (resolveTipTarget != null) {
          const target = resolveTipTarget(chart, params.offsetX, params.offsetY);
          if (target == null) {
            return;
          }
          chart.dispatchAction({
            type: 'showTip',
            seriesIndex: target.seriesIndex,
            dataIndex: target.dataIndex,
          });
          return;
        }

        const convertFromPixel = (finder: unknown, value: number | number[]) =>
          chart.convertFromPixel(finder as never, value as never);

        const dataIndex = resolveCategoryIndex!(
          convertFromPixel,
          params.offsetX,
          params.offsetY,
          runCount,
          chart.getWidth(),
          chart.getHeight(),
        );

        if (dataIndex == null) {
          return;
        }

        // Pick the series whose point at this category is nearest the click in Y.
        // Hardcoding seriesIndex 0 fails for later metric lines when series 0 is null there.
        const seriesList =
          (chart.getOption() as { series?: { data?: ({ value: number | null } | number | null)[] }[] }).series ?? [];
        const datumValue = (datum: { value: number | null } | number | null | undefined): number | null => {
          if (datum == null) {
            return null;
          }
          if (typeof datum === 'object' && 'value' in datum) {
            return datum.value;
          }
          return typeof datum === 'number' ? datum : null;
        };

        let seriesIndex = -1;
        let bestDist = Infinity;
        for (let i = 0; i < seriesList.length; i += 1) {
          const value = datumValue(seriesList[i]?.data?.[dataIndex]);
          if (value == null) {
            continue;
          }
          const pixel = chart.convertToPixel('grid', [dataIndex, value] as never) as unknown;
          const py = Array.isArray(pixel) && typeof pixel[1] === 'number' ? pixel[1] : null;
          if (py == null) {
            if (seriesIndex < 0) {
              seriesIndex = i;
            }
            continue;
          }
          const dist = Math.abs(py - params.offsetY);
          if (dist < bestDist) {
            bestDist = dist;
            seriesIndex = i;
          }
        }

        if (seriesIndex >= 0) {
          chart.dispatchAction({ type: 'showTip', seriesIndex, dataIndex });
        } else {
          chart.dispatchAction({ type: 'showTip', x: params.offsetX, y: params.offsetY });
        }
      };

      const zr = chart.getZr() as ZrEventTarget;
      zr.on('click', onZrClick);
      zrRef.current = zr;
      onZrClickRef.current = onZrClick;
    },
    [isEnabled, runCount, resolveCategoryIndex, resolveTipTarget],
  );

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const hideTip = () => {
      chartRef.current?.getEchartsInstance()?.dispatchAction({ type: 'hideTip' });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideTip();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      const chartDom = chartRef.current?.getEchartsInstance()?.getDom();
      const tooltipEl = document.querySelector(`.${tooltipClassName}`);
      if (chartDom?.contains(target) || tooltipEl?.contains(target)) {
        return;
      }

      hideTip();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
      const zr = zrRef.current;
      const handler = onZrClickRef.current;
      if (zr && handler) {
        zr.off('click', handler);
      }
      zrRef.current = null;
      onZrClickRef.current = null;
    };
  }, [isEnabled, tooltipClassName]);

  return { chartRef, onChartReady };
};
