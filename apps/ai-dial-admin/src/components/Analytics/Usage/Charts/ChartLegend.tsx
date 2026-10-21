'use client';

import { FC } from 'react';

import classNames from 'classnames';

export interface ChartLegendEntry {
  id: string;
  label: string;
  value?: string;
  color?: string;
  /** The plotted series this row stands for; absent when the row names no band. */
  seriesIndex?: number;
}

interface Props {
  entries: ChartLegendEntry[];
  /** Previews a band while the pointer or focus rests on its row; `null` once it leaves. */
  onPreviewSeries?: (seriesIndex: number | null) => void;
  onToggleSeries?: (seriesIndex: number) => void;
  pinnedSeriesIndex?: number | null;
  className?: string;
}

const ChartLegend: FC<Props> = ({ entries, onPreviewSeries, onToggleSeries, pinnedSeriesIndex, className }) => (
  <ul className={classNames('flex flex-wrap items-center gap-x-5 gap-y-2 dial-small-text', className)}>
    {entries.map((entry) => {
      const isBand = entry.seriesIndex != null && (onPreviewSeries != null || onToggleSeries != null);
      const content = (
        <>
          {entry.color && (
            <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: entry.color }} />
          )}
          <span className="min-w-0 truncate text-secondary">{entry.label}</span>
          {entry.value && <span className="shrink-0 tabular-nums text-primary">{entry.value}</span>}
        </>
      );

      return (
        <li key={entry.id} className="flex min-w-0 items-center">
          {isBand ? (
            <button
              type="button"
              aria-pressed={pinnedSeriesIndex === entry.seriesIndex}
              className="flex min-w-0 items-center gap-2 rounded focus-visible:outline focus-visible:outline-focus"
              onMouseEnter={() => onPreviewSeries?.(entry.seriesIndex as number)}
              onMouseLeave={() => onPreviewSeries?.(null)}
              onFocus={() => onPreviewSeries?.(entry.seriesIndex as number)}
              onBlur={() => onPreviewSeries?.(null)}
              onClick={() => onToggleSeries?.(entry.seriesIndex as number)}
            >
              {content}
            </button>
          ) : (
            <span className="flex min-w-0 items-center gap-2">{content}</span>
          )}
        </li>
      );
    })}
  </ul>
);

export default ChartLegend;
