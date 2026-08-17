'use client';

import { useEffect, useRef } from 'react';
import type ReactECharts from 'echarts-for-react';

import { OVERALL_SCORE_TREND_TOOLTIP_CLASS } from '@/src/components/TestSuites/Trends/constants';

/** Hides an ECharts click/enterable tooltip on outside pointerdown or Escape. */
export const useStickyChartTooltip = (isEnabled: boolean) => {
  const chartRef = useRef<ReactECharts>(null);

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
    };
  }, [isEnabled]);

  return chartRef;
};
