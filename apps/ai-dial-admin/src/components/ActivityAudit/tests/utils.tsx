import { GridFilterType } from '@/src/types/grid-filter';
import { FilterOperatorDto } from '@/src/types/request';
import { getGridFilters } from '../utils';

describe('Activity Audit List utils :: getGridFilters', () => {
  const mockStartDate = new Date('2024-01-01T00:00:00.000Z');
  const mockEndDate = new Date('2024-01-02T00:00:00.000Z');

  const timeRange = {
    startDate: mockStartDate,
    endDate: mockEndDate,
  };

  it('returns combined filters from gridFilter and timeRange', () => {
    const gridFilter = {
      name: { filter: 'Alice', type: GridFilterType.EQUALS, filterType: 'text' },
      age: { filter: '30', type: GridFilterType.EQUALS, filterType: 'text' },
    };

    const result = getGridFilters(gridFilter, timeRange);

    expect(result).toEqual([
      { column: 'name', value: 'Alice', operator: FilterOperatorDto.EQUALS },
      { column: 'age', value: '30', operator: FilterOperatorDto.EQUALS },
      {
        column: 'epochTimestampMs',
        operator: FilterOperatorDto.GREATER_THEN_OR_EQUAL,
        value: mockStartDate.getTime().toString(),
      },
      {
        column: 'epochTimestampMs',
        operator: FilterOperatorDto.LESS_THEN_OR_EQUAL,
        value: mockEndDate.getTime().toString(),
      },
    ]);
  });

  it('ignores filters with unknown types', () => {
    const result = getGridFilters({}, timeRange);

    expect(result).toEqual([
      {
        column: 'epochTimestampMs',
        operator: FilterOperatorDto.GREATER_THEN_OR_EQUAL,
        value: mockStartDate.getTime().toString(),
      },
      {
        column: 'epochTimestampMs',
        operator: FilterOperatorDto.LESS_THEN_OR_EQUAL,
        value: mockEndDate.getTime().toString(),
      },
    ]);
  });
});
