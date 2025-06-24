import { GridFilterType } from '@/src/types/grid-filter';
import { FilterDto, FilterOperatorDto, GridFilter } from '@/src/types/request';
import { describe, expect, test } from 'vitest';
import { getRequestFilters } from '../get-request-filters';

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
