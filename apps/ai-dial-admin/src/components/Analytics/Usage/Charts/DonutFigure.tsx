'use client';

import { FC, useMemo } from 'react';

import ReactECharts from 'echarts-for-react';
import classNames from 'classnames';
import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';

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
  /** Called once the legend has been scrolled near its end, so its owner can read the next rows. */
  onLegendEndReached?: () => void;
}

/** How close to the end counts as reaching it, so the next rows are asked for before the gap shows. */
const LEGEND_END_THRESHOLD_PX = 48;

const DonutFigure: FC<Props> = ({
  slices,
  legendSlices,
  centerValue,
  centerCaption,
  size,
  legendClassName,
  onLegendEndReached,
}) => {
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
    /*
     * Wrapping row rather than a column: the ring keeps its square and the legend takes what is
     * left, so a card with room puts the two side by side and a narrower one drops the legend
     * under the ring. The card's own width decides, not the viewport's — and the two run opposite:
     * on a wide screen this card shares its row and is the narrower of the two, while on a small
     * one the row wraps and it gets the full width. The legend's floor is set by a whole model
     * name plus its figures, since a legend that truncates them is worse than one below the ring. It
     * is a basis rather than a minimum: a minimum decides the wrap and then keeps the legend wider
     * than the card it wrapped into, which is an overflow rather than a second line.
     */
    <div className="flex min-h-0 min-w-0 flex-wrap items-center justify-center gap-6">
      <div className="relative shrink-0" style={{ height: size, width: size }}>
        <ReactECharts option={options} style={{ height: size, width: size }} opts={{ renderer: 'svg' }} notMerge />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="dial-display2-text text-primary">{centerValue ?? '—'}</span>
          <span className="dial-small-text text-secondary">{centerCaption}</span>
        </div>
      </div>
      {/*
       * `min-w-0` on both the list and its rows: the label's own `min-width: 0` lets it shrink once
       * flex layout runs, but an unbreakable name still counts in full toward the row's intrinsic
       * minimum, and without this the list refuses to go narrower than its longest label and spills
       * past the card on both sides.
       */}
      <ul
        className={classNames('flex min-w-0 flex-[1_1_400px] flex-col gap-4', legendClassName)}
        onScroll={(event) => {
          if (!onLegendEndReached) {
            return;
          }

          const list = event.currentTarget;

          if (list.scrollHeight - list.scrollTop - list.clientHeight <= LEGEND_END_THRESHOLD_PX) {
            onLegendEndReached();
          }
        }}
      >
        {legend.map((slice) => (
          <li key={slice.id} className="flex min-w-0 items-center gap-3 dial-small-text">
            <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
            <EllipsisTooltip className="text-primary" text={slice.label} />
            {/* Both measures where the caller supplied them, always calls then cost, so the columns
                do not swap with whichever measure the ring happens to be split by. */}
            {slice.callsLabel == null && slice.costLabel == null ? (
              <span className="shrink-0 tabular-nums text-secondary">{slice.valueLabel}</span>
            ) : (
              <>
                <span className="w-16 shrink-0 text-right tabular-nums text-secondary">{slice.callsLabel ?? '—'}</span>
                <span className="w-20 shrink-0 text-right tabular-nums text-secondary">{slice.costLabel ?? '—'}</span>
              </>
            )}
            <span className="w-10 shrink-0 text-right tabular-nums text-primary">{slice.shareLabel ?? '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DonutFigure;
