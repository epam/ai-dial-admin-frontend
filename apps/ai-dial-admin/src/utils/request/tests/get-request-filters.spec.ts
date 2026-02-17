import { GridFilter } from '@/src/models/grid-filter';
import { FilterDto } from '@/src/models/request';
import { GridFilterType } from '@/src/types/grid-filter';
import { FilterOperatorDto } from '@/src/types/request';
import { describe, expect, test } from 'vitest';
import { getRequestFilters, getRequestFiltersStr } from '../get-request-filters';

describe('getRequestFilters', () => {
  test('converts grid filters to request filters correctly', () => {
    const gridFilters: Record<string, GridFilter> = {
      name: { type: GridFilterType.CONTAINS, filter: 'John' },
      surname: { type: GridFilterType.NOT_CONTAINS, filter: 'Smith' },
      age: { type: GridFilterType.EQUALS, filter: '30' },
      children: { type: GridFilterType.NOT_EQUAL, filter: '2' },
    };

    const expected: FilterDto[] = [
      { column: 'name', value: 'John', operator: FilterOperatorDto.CONTAINS },
      { column: 'surname', value: 'Smith', operator: FilterOperatorDto.NOT_CONTAINS },
      { column: 'age', value: '30', operator: FilterOperatorDto.EQUALS },
      { column: 'children', value: '2', operator: FilterOperatorDto.NOT_EQUAL },
    ];

    expect(getRequestFilters(gridFilters)).toEqual(expected);
  });

  test('ignores filters with unknown types', () => {
    const gridFilters: Record<string, GridFilter> = {
      name: { type: 'invalid' as GridFilterType, filter: 'test' },
      age: { type: GridFilterType.EQUALS, filter: '25' },
    };

    const expected: FilterDto[] = [{ column: 'age', value: '25', operator: FilterOperatorDto.EQUALS }];

    expect(getRequestFilters(gridFilters)).toEqual(expected);
  });

  test('returns empty array for empty input', () => {
    expect(getRequestFilters({})).toEqual([]);
  });
});

describe('getRequestFiltersStr', () => {
  test('converts a single filter to query string', () => {
    const filters: FilterDto[] = [{ column: 'name', value: 'John', operator: FilterOperatorDto.CONTAINS }];

    expect(getRequestFiltersStr(filters)).toBe('name=John');
  });

  test('converts multiple filters to query string with & separator', () => {
    const filters: FilterDto[] = [
      { column: 'name', value: 'John', operator: FilterOperatorDto.CONTAINS },
      { column: 'age', value: '30', operator: FilterOperatorDto.EQUALS },
      { column: 'city', value: 'New York', operator: FilterOperatorDto.CONTAINS },
    ];

    expect(getRequestFiltersStr(filters)).toBe('name=John&age=30&city=New%20York');
  });

  test('properly encodes special characters in filter values', () => {
    const filters: FilterDto[] = [
      { column: 'query', value: 'test & query=value', operator: FilterOperatorDto.CONTAINS },
      { column: 'email', value: 'user@example.com', operator: FilterOperatorDto.EQUALS },
    ];

    expect(getRequestFiltersStr(filters)).toBe('query=test%20%26%20query%3Dvalue&email=user%40example.com');
  });

  test('returns empty string for empty filters array', () => {
    expect(getRequestFiltersStr([])).toBe('');
  });
});
