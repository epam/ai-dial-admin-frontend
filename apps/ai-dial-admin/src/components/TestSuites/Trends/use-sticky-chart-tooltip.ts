'use client';

import { useCallback, useEffect, useRef } from 'react';
import type ReactECharts from 'echarts-for-react';
import type { EChartsType } from 'echarts';

import { OVERALL_SCORE_TREND_TOOLTIP_CLASS } from '@/src/components/TestSuites/Trends/constants';
import {
  resolveCategoryDataIndexFromLayout,
  resolveCategoryDataIndexFromPixel,
} from '@/src/components/TestSuites/Trends/utils/chart-options';

type ZrHandler = (params: { offsetX: number; offsetY: number }) => void;

type ZrEventTarget = {
  on: (eventName: 'click', handler: ZrHandler) => void;
  off: (eventName: 'click', handler: ZrHandler) => void;
};

/**
 * Sticky Overall Score tooltip:
 * - Built-in `triggerOn: 'click'` shows the tip when ECharts hit-tests succeed
 * - Extra zrender click → layout/pixel showTip recovers low-point / axis-label misses
 * - Outside pointerdown / Escape dismisses
 */
export const useStickyChartTooltip = (isEnabled: boolean, categoryCount = 0) => {
  const chartRef = useRef<ReactECharts>(null);
  const zrRef = useRef<ZrEventTarget | null>(null);
  const onZrClickRef = useRef<ZrHandler | null>(null);

  const onChartReady = useCallback(
    (chart: EChartsType) => {
      if (!isEnabled || categoryCount <= 0) {
        return;
      }

      const prevZr = zrRef.current;
      const prevHandler = onZrClickRef.current;
      if (prevZr && prevHandler) {
        prevZr.off('click', prevHandler);
      }

      const onZrClick: ZrHandler = (params) => {
        const convert = (finder: unknown, value: number | number[]) =>
          chart.convertFromPixel(finder as never, value as never);

        const chartWidth = chart.getWidth();
        const chartHeight = chart.getHeight();
        const dataIndex =
          resolveCategoryDataIndexFromPixel(
            convert,
            params.offsetX,
            params.offsetY,
            categoryCount,
            chartWidth,
            chartHeight,
          ) ?? resolveCategoryDataIndexFromLayout(params.offsetX, chartWidth, categoryCount);

        if (dataIndex == null) {
          return;
        }

        chart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex });
      };

      const zr = chart.getZr() as ZrEventTarget;
      zr.on('click', onZrClick);
      zrRef.current = zr;
      onZrClickRef.current = onZrClick;
    },
    [isEnabled, categoryCount],
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
      const tooltipEl = document.querySelector(`.${OVERALL_SCORE_TREND_TOOLTIP_CLASS}`);
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
  }, [isEnabled]);

  return { chartRef, onChartReady };
};
