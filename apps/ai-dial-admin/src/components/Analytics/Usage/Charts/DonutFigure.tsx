'use client';

import { FC, useMemo } from 'react';

import ReactECharts from 'echarts-for-react';
import classNames from 'classnames';

import { DonutSliceView } from '@/src/components/Analytics/Usage/models';
import { buildDonutOptions } from '@/src/components/Analytics/Usage/utils/chart-options';

interface Props {
  slices: DonutSliceView[];
  /** The rows the legend lists, when that is a subset of the ring — a search narrows this, not the ring. */
  legendSlices?: DonutSliceView[];
  centerValue: string | null;
  centerCaption: string;
  size: number;
  legendClassName?: string;
}

const DonutFigure: FC<Props> = ({ slices, legendSlices, centerValue, centerCaption, size, legendClassName }) => {
  const options = useMemo(
    () =>
      buildDonutOptions(
        slices.map((slice) => ({
          name: slice.label,
          value: slice.value,
          shareLabel: slice.shareLabel ?? void 0,
          itemStyle: { color: slice.color },
        })),
      ),
    [slices],
  );

  const legend = legendSlices ?? slices;

  return (
    <div className="flex min-h-0 flex-col items-center gap-6">
      <div className="relative shrink-0" style={{ height: size, width: size }}>
        <ReactECharts option={options} style={{ height: size, width: size }} opts={{ renderer: 'svg' }} notMerge />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="dial-display2-text text-primary">{centerValue ?? '—'}</span>
          <span className="dial-small-text text-secondary">{centerCaption}</span>
        </div>
      </div>
      <ul className={classNames('flex w-full flex-col gap-4', legendClassName)}>
        {legend.map((slice) => (
          <li key={slice.id} className="flex items-center gap-3 dial-small-text">
            <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
            <span className="min-w-0 flex-1 truncate text-primary">{slice.label}</span>
            <span className="shrink-0 tabular-nums text-secondary">{slice.valueLabel}</span>
            <span className="w-10 shrink-0 text-right tabular-nums text-primary">{slice.shareLabel ?? '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DonutFigure;
