import { ColumnState } from 'ag-grid-community';

const COMPARED_COL_ID_PREFIX = 'cmp_';

/**
 * Swaps the slot of every primary/compared column pair, so a flip carries the user's column order,
 * widths, sort and visibility over instead of snapping the grid back to its default layout.
 */
export const swapComparePairColumnState = (state: ColumnState[]): ColumnState[] => {
  const indexByColId = new Map(state.map((column, index) => [column.colId, index]));
  const swapped = [...state];

  state.forEach((column, index) => {
    const comparedIndex = indexByColId.get(`${COMPARED_COL_ID_PREFIX}${column.colId}`);
    if (comparedIndex == null) return;

    swapped[index] = state[comparedIndex];
    swapped[comparedIndex] = column;
  });

  return swapped;
};
