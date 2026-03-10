'use client';

import { ColDef } from 'ag-grid-community';

import { numberValueComparator } from '@/src/components/Grid/comparators/number-comparator';
import { numberValueFormatter, priceValueFormatter } from '@/src/constants/grid-columns/formatters';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

import HeaderWithHintButton from '@/src/components/Grid/HeaderComponents/HeaderWithHintButton';

export const dateTimeColumn: Partial<ColDef> = {
  valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
  tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
  filterValueGetter: (params) => formatDateTimeToLocalString(params.data[params.colDef.field || '']),
};

export const numericColumn: Partial<ColDef> = {
  cellClass: 'align-right',
  headerClass: 'align-right',
  comparator: numberValueComparator,
  valueFormatter: ({ value }) => numberValueFormatter(value),
  filterValueGetter: (params) => numberValueFormatter(params.data[params.colDef.field || '']),
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
    valueFormatter: ({ value }) => `$${priceValueFormatter(value)}`,
    filterValueGetter: (params) => priceValueFormatter(params.data[params.colDef.field || '']),
  };
};
