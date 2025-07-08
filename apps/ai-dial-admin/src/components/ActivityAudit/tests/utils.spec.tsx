import { ActivityAuditRevision } from '@/src/components/ActivityAudit/models';
import { getActivityAuditColumns, getGridFilters, groupByDay } from '@/src/components/ActivityAudit/utils';
import { GridFilterType } from '@/src/types/grid-filter';
import { FilterOperatorDto } from '@/src/types/request';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/src/constants/ag-grid', () => ({
  ACTION_COLUMN: vi.fn((actions) => ({ colId: 'actions', actions })),
}));

vi.mock('@/src/constants/grid-columns/actions', () => ({
  getOpenInNewTabOperation: vi.fn((cb) => ({ type: 'open', cb })),
  getResourceRollbackOperation: vi.fn((cb) => ({ type: 'rollback', cb })),
}));

vi.mock('@/src/constants/grid-columns/grid-columns', () => ({
  ACTIVITY_AUDIT_COLUMNS: [{ colId: 'a' }, { colId: 'b' }],
}));

describe('Activity Audit List utils :: getActivityAuditColumns', () => {
  test('returns columns with action column at the end', () => {
    const openMock = vi.fn();
    const rollbackMock = vi.fn();

    const cols = getActivityAuditColumns(openMock, rollbackMock);

    expect(cols).toHaveLength(3);
    expect(cols[0]).toEqual({ colId: 'a' });
    expect(cols[1]).toEqual({ colId: 'b' });
    expect(cols[2].colId).toBe('actions');
    expect((cols[2] as { actions: { type: string }[] }).actions).toHaveLength(2);
    expect((cols[2] as { actions: { type: string }[] }).actions[0].type).toBe('open');
    expect((cols[2] as { actions: { type: string }[] }).actions[1].type).toBe('rollback');
  });
});

describe('Activity Audit List utils :: getGridFilters', () => {
  const mockStartDate = new Date('2024-01-01T00:00:00.000Z');
  const mockEndDate = new Date('2024-01-02T00:00:00.000Z');

  const timeRange = {
    startDate: mockStartDate,
    endDate: mockEndDate,
  };

  test('returns combined filters from gridFilter and timeRange', () => {
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

  test('ignores filters with unknown types', () => {
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

describe('Activity Audit List utils :: groupByDay', () => {
  test('groups revisions correctly and uses "Today" for current date', () => {
    const mockToday = new Date('2024-06-25T12:00:00');
    const clonedDate = new Date(mockToday.getTime());
    clonedDate.setDate(mockToday.getDate() - 1); // Set to yesterday for testing
    vi.useFakeTimers();
    vi.setSystemTime(mockToday);

    const revisions: ActivityAuditRevision[] = [
      { id: 1, author: 'author', timestamp: new Date('2024-06-25T09:00:00').getTime() },
      { id: 2, author: 'author', timestamp: new Date('2024-06-24T18:30:00').getTime() },
      { id: 3, author: 'author', timestamp: new Date('2024-06-25T15:45:00').getTime() },
    ];

    const grouped = groupByDay(revisions);

    expect(Object.keys(grouped)).toContain('Today');
    expect(Object.keys(grouped)).toContain(clonedDate.toLocaleDateString());
    expect(grouped['Today']).toHaveLength(2);
    expect(grouped[clonedDate.toLocaleDateString()]).toHaveLength(1);

    vi.useRealTimers();
  });
});
