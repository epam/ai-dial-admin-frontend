import { ColDef, ITextFilterParams } from 'ag-grid-community';

import { GridFilterType } from '@/src/types/grid-filter';

const stringFilter: Partial<ColDef> = {
  filterParams: {
    maxNumConditions: 1,
    buttons: ['reset', 'apply'],
    closeOnApply: true,
  } as ITextFilterParams,
};

export const auditStringFilter: Partial<ColDef> = {
  filterParams: {
    ...stringFilter.filterParams,
    filterOptions: [
      GridFilterType.CONTAINS,
      GridFilterType.NOT_CONTAINS,
      GridFilterType.EQUALS,
      GridFilterType.NOT_EQUAL,
    ],
  } as ITextFilterParams,
};

export const evalStringFilter: Partial<ColDef> = {
  filterParams: {
    ...stringFilter.filterParams,
    filterOptions: [GridFilterType.EQUALS, GridFilterType.NOT_EQUAL, GridFilterType.CONTAINS],
  } as ITextFilterParams,
};
