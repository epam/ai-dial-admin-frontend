'use client';

import { FC } from 'react';

import {
  COMBO_TREND_PLOT_HEIGHT_PX,
  COMBO_TREND_Y_LABEL_WIDTH_PX,
} from '@/src/components/TestSuites/Trends/CostRuntime/utils/combo-axis';

interface Props {
  ticks: number[];
  formatTick: (value: number) => string;
}

const ComboTrendYAxis: FC<Props> = ({ ticks, formatTick }) => (
  <div
    className="flex shrink-0 flex-col justify-between dial-tiny-text text-secondary"
    style={{ width: COMBO_TREND_Y_LABEL_WIDTH_PX, height: COMBO_TREND_PLOT_HEIGHT_PX }}
    aria-hidden
  >
    {ticks.map((tick, index) => (
      <span key={`${tick}-${index}`} className="leading-4">
        {formatTick(tick)}
      </span>
    ))}
  </div>
);

export default ComboTrendYAxis;
