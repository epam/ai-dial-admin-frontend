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
