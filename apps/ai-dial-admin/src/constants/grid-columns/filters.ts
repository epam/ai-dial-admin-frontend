import { ColDef, ITextFilterParams } from 'ag-grid-community';

import { GridFilterType } from '@/src/types/grid-filter';

export const dateFilter: Partial<ColDef> = {
  filter: 'agDateColumnFilter',
  filterParams: {
    maxNumConditions: 1,
    buttons: ['reset', 'apply'],
    closeOnApply: true,
    filterOptions: [
      GridFilterType.GREATER_THAN,
      GridFilterType.GREATER_THAN_OR_EQUAL,
      GridFilterType.LESS_THAN,
      GridFilterType.LESS_THAN_OR_EQUAL,
    ],
  } as ITextFilterParams,
};

const baseFilterParams: Partial<ColDef> = {
  filterParams: {
    maxNumConditions: 1,
    buttons: ['reset', 'apply'],
    closeOnApply: true,
  } as ITextFilterParams,
};

export const baseStringFilter: Partial<ColDef> = {
  filterParams: {
    ...baseFilterParams.filterParams,
    filterOptions: [
      GridFilterType.CONTAINS,
      GridFilterType.NOT_CONTAINS,
      GridFilterType.EQUALS,
      GridFilterType.NOT_EQUAL,
    ],
  } as ITextFilterParams,
};

export const baseNumberFilter: Partial<ColDef> = {
  filter: 'agNumberColumnFilter',
  filterParams: {
    ...baseFilterParams.filterParams,
    filterOptions: [
      GridFilterType.GREATER_THAN,
      GridFilterType.GREATER_THAN_OR_EQUAL,
      GridFilterType.LESS_THAN,
      GridFilterType.LESS_THAN_OR_EQUAL,
      GridFilterType.EQUALS,
      GridFilterType.NOT_EQUAL,
    ],
  } as ITextFilterParams,
};

export const evalStringFilter = (options: GridFilterType[]): Partial<ColDef> => ({
  filterParams: {
    ...baseFilterParams.filterParams,
    filterOptions: options,
  } as ITextFilterParams,
});
