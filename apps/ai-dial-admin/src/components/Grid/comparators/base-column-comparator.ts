import { ColDef, IRowNode } from 'ag-grid-community';

export const baseColumnComparator = (
  a: string | number | undefined,
  b: string | number | undefined,
  _nodeA: IRowNode,
  _nodeB: IRowNode,
  isInverted: boolean,
): number => {
  const aLower = typeof a === 'string' ? a.toLowerCase() : a;
  const bLower = typeof b === 'string' ? b.toLowerCase() : b;
  if (aLower === bLower) {
    return 0;
  }

  if (!aLower) {
    return !isInverted ? 1 : -1;
  }

  if (!bLower) {
    return !isInverted ? -1 : 1;
  }

  return aLower > bLower ? 1 : -1;
};

export const checkColDefsChanges = (cols: ColDef[], initialCols: ColDef[]) => {
  return cols.some((col, index) => {
    if (col.field !== initialCols[index].field) {
      return true;
    }
    return col.hide !== initialCols[index].hide;
  });
};
