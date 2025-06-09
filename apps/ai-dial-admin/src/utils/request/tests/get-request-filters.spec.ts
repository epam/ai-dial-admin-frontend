import { getRequestFilters } from '../get-request-filters';
import { FilterOperatorDto, GridFilter, FilterDto } from '@/src/types/request';
import { GridFilterType } from '@/src/types/grid-filter';

describe('getRequestFilters', () => {
  it('converts grid filters to request filters correctly', () => {
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

  it('ignores filters with unknown types', () => {
    const gridFilters: Record<string, GridFilter> = {
      name: { type: 'invalid' as GridFilterType, filter: 'test' },
      age: { type: GridFilterType.EQUALS, filter: '25' },
    };

    const expected: FilterDto[] = [{ column: 'age', value: '25', operator: FilterOperatorDto.EQUALS }];

    expect(getRequestFilters(gridFilters)).toEqual(expected);
  });

  it('returns empty array for empty input', () => {
    expect(getRequestFilters({})).toEqual([]);
  });
});
