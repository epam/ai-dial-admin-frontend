'use client';

import { FC } from 'react';

import TrendRunNameLabel, {
  TREND_RUN_AXIS_LABEL_HEIGHT_PX,
} from '@/src/components/TestSuites/Trends/TrendRunNameLabel';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';

interface Props {
  runOrder: TrendsRunPoint[];
  paddingLeft?: number;
  paddingRight?: number;
}

const TrendRunAxisLabels: FC<Props> = ({ runOrder, paddingLeft = 0, paddingRight = 0 }) => {
  if (runOrder.length === 0) {
    return null;
  }

  return (
    // Padding wraps an inner track so absolute `left:%` is relative to the plot content box
    // (padding on a relative parent does not inset absolutely positioned children).
    // Always center each label on its equal-slot anchor so first/last gaps match the middle.
    <div className="w-full overflow-visible" style={{ paddingLeft, paddingRight }}>
      <div className="relative w-full overflow-visible" style={{ height: TREND_RUN_AXIS_LABEL_HEIGHT_PX }}>
        {runOrder.map((point, index) => {
          const leftPct = runOrder.length === 1 ? 50 : (index / (runOrder.length - 1)) * 100;
          return (
            <span
              key={point.runId}
              className="absolute top-0"
              style={{
                left: `${leftPct}%`,
                transform: 'translateX(-50%)',
                height: TREND_RUN_AXIS_LABEL_HEIGHT_PX,
              }}
            >
              <TrendRunNameLabel name={point.runName} />
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default TrendRunAxisLabels;
