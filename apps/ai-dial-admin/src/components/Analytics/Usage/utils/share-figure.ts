import { renderCell } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { DonutSliceView } from '@/src/components/Analytics/Usage/models';
import { formatChartNumber, getSliceColor } from '@/src/components/Analytics/Usage/utils/chart-options';
import { toNumber } from '@/src/components/Analytics/Usage/utils/folds';
import { formatPercent } from '@/src/components/Analytics/Usage/utils/format';
import { ChartColors } from '@/src/components/Common/MetricCard/models';

type ResultRows = Array<Record<string, unknown>>;

export interface ShareFigure {
  slices: DonutSliceView[];
  total: number;
}

export interface ShareFigureOptions {
  otherLabel: string;
  sliceCount: number;
  formatValue?: (value: number) => string;
  emptyLabel?: string;
}

/**
 * The largest values by name, the rest summed into one grey slice, labelled the way the usage dashboard's
 * share legend is: the figure and its share of the total.
 */
export const buildShareFigure = (
  colors: ChartColors,
  rows: ResultRows,
  dimensionColumn: string,
  valueColumn: string,
  { otherLabel, sliceCount, formatValue = formatChartNumber, emptyLabel = '' }: ShareFigureOptions,
): ShareFigure => {
  const ranked = rows
    .map((row) => ({ name: renderCell(row[dimensionColumn]) || emptyLabel, value: toNumber(row[valueColumn]) ?? 0 }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = ranked.reduce((sum, entry) => sum + entry.value, 0);

  const shown = ranked.slice(0, sliceCount).map((entry) => ({ ...entry, isOther: false }));
  const rest = ranked.slice(sliceCount).reduce((sum, entry) => sum + entry.value, 0);
  const entries = rest > 0 ? [...shown, { name: otherLabel, value: rest, isOther: true }] : shown;

  return {
    total,
    slices: entries.map((entry, index) => ({
      id: entry.isOther ? '__other' : entry.name,
      label: entry.name,
      value: entry.value,
      isOther: entry.isOther,
      valueLabel: formatValue(entry.value),
      shareLabel: total ? formatPercent(entry.value / total, 0) : null,
      color: getSliceColor(colors, index, entry.isOther),
    })),
  };
};
