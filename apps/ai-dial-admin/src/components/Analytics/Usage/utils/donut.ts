import { DONUT_SLICE_COUNT } from '@/src/components/Analytics/Usage/constants';
import { BreakdownRow } from '@/src/components/Analytics/Usage/models';

export interface DonutSliceModel {
  id: string;
  label: string;
  value: number;
  isOther: boolean;
  isFallbackLabel: boolean;
}

/**
 * Top slices by value plus the window's own remainder. Ties are broken by label so repeated renders
 * of one window name the same entities — including at the cut, which is where a tie actually changes
 * the picture.
 *
 * The residual is `windowTotal` minus the named slices, not the sum of the rows that did not make
 * the cut: the response is one page of a ranked query, so folding what it happens to carry would
 * make the slices add up to a page rather than to the window.
 */
export const getSliceCalls = (row: BreakdownRow): number => row.measures.calls;

export const getSliceSpend = (row: BreakdownRow): number => row.measures.spend ?? 0;

export const buildDonutSlices = (
  rows: BreakdownRow[],
  otherLabel: string,
  windowTotal: number | null,
  sliceCount: number = DONUT_SLICE_COUNT,
  getValue: (row: BreakdownRow) => number = getSliceCalls,
): DonutSliceModel[] => {
  const ranked = rows
    .map((row) => ({ row, value: getValue(row) }))
    .sort((left, right) => right.value - left.value || left.row.label.localeCompare(right.row.label));

  const named = ranked.slice(0, sliceCount).map(({ row, value }) => ({
    id: row.id,
    label: row.label,
    value,
    isOther: false,
    isFallbackLabel: row.isFallbackLabel,
  }));

  if (windowTotal == null) {
    return named;
  }

  const residual = windowTotal - named.reduce((acc, slice) => acc + slice.value, 0);

  if (residual <= 0) {
    return named;
  }

  return [
    ...named,
    {
      id: 'other',
      label: otherLabel,
      value: residual,
      isOther: true,
      isFallbackLabel: false,
    },
  ];
};

/**
 * The denominator is the window total, which includes rows the table never showed — a share against
 * the shown rows alone would rescale silently as the reader pages.
 */
export const getSliceShare = (slice: DonutSliceModel, windowTotal: number | null): number | null => {
  if (!windowTotal) {
    return null;
  }

  return slice.value / windowTotal;
};
