import { FilterDto } from '@/src/models/request';
import { GridFilter } from '@/src/models/grid-filter';
import { FilterOperatorDto } from '@/src/types/request';
import { GridFilterType } from '@/src/types/grid-filter';

export const getRequestFilters = (gridFilter: Record<string, GridFilter>): FilterDto[] => {
  const requestFilter: FilterDto[] = [];
  Object.entries(gridFilter).forEach(([filterKey, filter]) => {
    const operator = getFilter(filter.type);
    const timestamp = filter.dateFrom ? new Date(filter.dateFrom).getTime() : null;
    if (operator) {
      requestFilter.push({ column: filterKey, value: timestamp ?? filter.filter, operator });
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
    case GridFilterType.GREATER_THAN:
      return FilterOperatorDto.GREATER_THAN;
    case GridFilterType.GREATER_THAN_OR_EQUAL:
      return FilterOperatorDto.GREATER_THAN_OR_EQUAL;
    case GridFilterType.LESS_THAN:
      return FilterOperatorDto.LESS_THAN;
    case GridFilterType.LESS_THAN_OR_EQUAL:
      return FilterOperatorDto.LESS_THAN_OR_EQUAL;
    default:
      return null;
  }
};

export const getRequestFiltersStr = (filters: FilterDto[]): string => {
  return filters
    .map((filter) => `filter=${filter.column}:${filter.operator}:${encodeURIComponent(filter.value)}`)
    .join('&');
};
