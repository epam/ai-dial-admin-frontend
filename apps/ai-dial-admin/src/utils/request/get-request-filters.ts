import { FilterDto } from '@/src/models/request';
import { GridFilter } from '@/src/models/grid-filter';
import { FilterOperatorDto } from '@/src/types/request';
import { GridFilterType } from '@/src/types/grid-filter';

export const getRequestFilters = (gridFilter: Record<string, GridFilter>): FilterDto[] => {
  const requestFilter: FilterDto[] = [];

  Object.entries(gridFilter).forEach(([filterKey, filter]) => {
    const operator = getFilter(filter.type);
    if (operator) {
      requestFilter.push({ column: filterKey, value: filter.filter, operator });
    }
  });

  return requestFilter;
};

export const getFilter = (type: GridFilterType): FilterOperatorDto | null => {
  switch (type) {
    case GridFilterType.CONTAINS:
      return FilterOperatorDto.CONTAINS;
    case GridFilterType.NOT_CONTAINS:
      return FilterOperatorDto.NOT_CONTAINS;
    case GridFilterType.EQUALS:
      return FilterOperatorDto.EQUALS;
    case GridFilterType.NOT_EQUAL:
      return FilterOperatorDto.NOT_EQUAL;
    default:
      return null;
  }
};
