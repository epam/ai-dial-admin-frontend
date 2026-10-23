'use client';

import { FC } from 'react';

import {
  TREND_SCORE_Y_LABEL_WIDTH_PX,
  TREND_SCORE_Y_TICKS,
  formatTrendScoreYTick,
} from '@/src/components/TestSuites/Trends/utils/score-axis';

interface Props {
  height?: number | string;
}

const TrendScoreAxis: FC<Props> = ({ height }) => (
  <div
    className="flex shrink-0 flex-col justify-between dial-tiny-text text-secondary"
    style={{ width: TREND_SCORE_Y_LABEL_WIDTH_PX, height }}
    aria-hidden
  >
    {TREND_SCORE_Y_TICKS.map((tick) => (
      <span key={tick} className="leading-4">
        {formatTrendScoreYTick(tick)}
      </span>
    ))}
  </div>
);

export default TrendScoreAxis;
