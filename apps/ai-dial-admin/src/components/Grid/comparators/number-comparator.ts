import { IRowNode } from 'ag-grid-community';
import Big from 'big.js';

export const numberValueComparator = (
  a: string | number | undefined,
  b: string | number | undefined,
  _nodeA: IRowNode,
  _nodeB: IRowNode,
  isInverted: boolean,
): number => {
  const aNumber = typeof a === 'string' ? new Big(a).toNumber() : a;
  const bNumber = typeof b === 'string' ? new Big(b).toNumber() : b;
  if (aNumber === bNumber) {
    return 0;
  }

  if (aNumber === undefined) {
    return !isInverted ? 1 : -1;
  }

  if (bNumber === undefined) {
    return !isInverted ? -1 : 1;
  }

  return aNumber > bNumber ? 1 : -1;
};
