import { describe, expect, test } from 'vitest';

import { BreakdownTab } from '@/src/components/Analytics/Usage/models';
import { SORTABLE_DIALOG_COLUMNS, toTabSort } from '@/src/components/Analytics/Usage/utils/dialog-sort';
import { QuerySortDirection } from '@/src/models/analytics/query';

describe('toTabSort', () => {
  test.each([
    ['share', 'calls'],
    ['calls', 'calls'],
    ['errors', 'error_rate'],
    ['latency', 'avg_latency'],
    ['cost', 'spend'],
  ])('orders the %s column by %s on the backend', (colId, orderBy) => {
    expect(toTabSort(BreakdownTab.Models, [{ colId, sort: 'asc' }])).toEqual({
      orderBy,
      orderDir: QuerySortDirection.Asc,
    });
  });

  test("orders the dimension column by the tab's own column", () => {
    expect(toTabSort(BreakdownTab.Applications, [{ colId: 'dimension', sort: 'desc' }])).toEqual({
      orderBy: 'parent_deployment',
      orderDir: QuerySortDirection.Desc,
    });
  });

  test("leaves the ranking's own order where the grid sorts nothing, or by a column with no key", () => {
    expect(toTabSort(BreakdownTab.Models, [])).toEqual({});
    expect(toTabSort(BreakdownTab.Models, void 0)).toEqual({});
    expect(toTabSort(BreakdownTab.Models, [{ colId: 'calls', sort: null }])).toEqual({});
    expect(toTabSort(BreakdownTab.Owners, [{ colId: 'routeKind', sort: 'asc' }])).toEqual({});
  });

  test('offers no sort on the kind column, which has no key to order by', () => {
    expect(SORTABLE_DIALOG_COLUMNS).not.toContain('routeKind');
  });
});
