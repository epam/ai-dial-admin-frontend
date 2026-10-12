import { ColDef, ITextFilterParams } from 'ag-grid-community';

import FloatingFilter from '@/src/components/Grid/FloatingFilter/FloatingFilter';
import { GridFilterType } from '@/src/types/grid-filter';

export const dateFilter: Partial<ColDef> = {
  filter: 'agDateColumnFilter',
  // Text FloatingFilter passes strings via `contains`, which crashes agDateColumnFilter
  // (`date.getFullYear is not a function`). Date columns use the filter menu instead.
  floatingFilter: false,
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

// The default floating filter waits for Enter when `apply` is present; this one applies as you type,
// while the filter menu keeps its Apply button.
const textFloatingFilter: Partial<ColDef> = { floatingFilterComponent: FloatingFilter };

const baseFilterParams: Partial<ColDef> = {
  filterParams: {
    maxNumConditions: 1,
    buttons: ['reset', 'apply'],
    closeOnApply: true,
  } as ITextFilterParams,
};

export const baseStringFilter: Partial<ColDef> = {
  ...textFloatingFilter,
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

// For a column the backend accepts only exact comparison on (an enum or a UUID).
export const exactMatchFilter: Partial<ColDef> = {
  ...textFloatingFilter,
  filterParams: {
    ...baseFilterParams.filterParams,
    filterOptions: [GridFilterType.EQUALS, GridFilterType.NOT_EQUAL],
    defaultOption: GridFilterType.EQUALS,
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
  ...textFloatingFilter,
  filterParams: {
    ...baseFilterParams.filterParams,
    filterOptions: options,
  } as ITextFilterParams,
});
