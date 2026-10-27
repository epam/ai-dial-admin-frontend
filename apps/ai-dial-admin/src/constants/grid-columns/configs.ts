'use client';

import { ColDef } from 'ag-grid-community';

import { numberValueComparator } from '@/src/components/Grid/comparators/number-comparator';
import { currencyValueFormatter, numberValueFormatter, toNumberOrNull } from '@/src/constants/grid-columns/formatters';
import { GridColumnType } from '@/src/types/grid-column';
import { formatDateTimeToLocalString, toDateOrNull } from '@/src/utils/formatting/date';

import HeaderWithHintButton from '@/src/components/Grid/HeaderComponents/HeaderWithHintButton';

export const dateTimeColumn: Partial<ColDef> = {
  valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
  filterValueGetter: (params) => toDateOrNull(params.data?.[params.colDef.field || '']),
};

/** Wider default for a name/ID column. Deliberately `width` and not `flex`: AG Grid lets `flex` win over `width`,
 * which would stop `AgGridWrapper` restoring a width the operator dragged. */
export const nameColumnSizing: Partial<ColDef> = { width: 400, minWidth: 260 };

/** Right-aligns cell and header content. Split out of `numericColumn` so a column with its own
 * `valueGetter`/comparator/filter can opt into alignment alone. */
export const rightAlignedColumn: Partial<ColDef> = {
  cellClass: 'align-right',
  headerClass: 'align-right',
  type: GridColumnType.RightAligned,
};

export const numericColumn: Partial<ColDef> = {
  ...rightAlignedColumn,
  comparator: numberValueComparator,
  valueFormatter: ({ value }) => numberValueFormatter(value),
  filterValueGetter: ({ data, colDef }) => toNumberOrNull(data?.[colDef.field || '']),
};

export const priceColumn = (title: string): Partial<ColDef> => {
  return {
    ...numericColumn,
    headerComponentParams: {
      innerHeaderComponent: HeaderWithHintButton,
      innerHeaderComponentParams: {
        hintText:
          'The calculated price is an approximation. Since different models, applications, and configurations may have varying token usage and processing costs, it’s not possible to determine the exact final price in advance. \n' +
          'The estimate gives you a general idea of expected costs, but the actual price may differ depending on how the chat unfolds (e.g., message length, complexity, model type, or additional features used).',
        hintTitle: title,
      },
    },
    valueFormatter: ({ value }) => currencyValueFormatter(value),
  };
};
