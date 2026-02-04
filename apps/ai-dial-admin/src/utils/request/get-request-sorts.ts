import { SortModelItem } from 'ag-grid-community';

import { SortDto } from '@/src/models/request';

export const getRequestSorts = (sortModel: SortModelItem[]): SortDto[] => {
  return sortModel.map(
    (sort) =>
      ({
        column: sort.colId,
        direction: sort.sort.toUpperCase(),
      }) as SortDto,
  );
};

export const getRequestSortsStr = (sorts: SortDto[]): string => {
  return sorts.map((sort) => `sort=${sort.column},${sort.direction}`).join('&');
};
