import { EChartsOption } from 'echarts-for-react';

import { LATEST_RUN_GAUGE_EMPTY_COLOR, TEST_CASE_SEGMENT_HEX } from '@/src/components/TestSuites/Trends/constants';
import { LatestRunGaugeSlice } from '@/src/components/TestSuites/Trends/models';

export const LATEST_RUN_GAUGE_OUTER_R_PX = 120;
export const LATEST_RUN_GAUGE_INNER_R_PX = 108;

export type { LatestRunGaugeSlice };

export const buildLatestRunGaugeOptions = (slices: LatestRunGaugeSlice[]): EChartsOption => {
  const data =
    slices.length > 0
      ? slices.map((slice) => ({
          name: slice.name,
          value: slice.value,
          itemStyle: {
            color: slice.color,
          },
        }))
      : [
          {
            name: 'empty',
            value: 1,
            itemStyle: {
              color: LATEST_RUN_GAUGE_EMPTY_COLOR,
            },
          },
        ];

  return {
    animation: false,
    legend: { show: false },
    tooltip: { show: false },
    series: [
      {
        type: 'pie',
        startAngle: 180,
        endAngle: 360,
        radius: [LATEST_RUN_GAUGE_INNER_R_PX, LATEST_RUN_GAUGE_OUTER_R_PX],
        center: ['50%', '100%'],
        label: { show: false },
        labelLine: { show: false },
        silent: true,
        emphasis: { disabled: true },
        data,
      },
    ],
  };
};

export const LATEST_RUN_SEGMENT_COLORS = TEST_CASE_SEGMENT_HEX;
