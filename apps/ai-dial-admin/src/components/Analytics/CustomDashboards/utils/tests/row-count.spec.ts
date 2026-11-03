import { describe, expect, test } from 'vitest';

import { getInitialRowLimit, parseRowCount } from '@/src/components/Analytics/CustomDashboards/utils/row-count';
import { QueryMode, QueryPageType } from '@/src/models/analytics/query';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';

describe('parseRowCount', () => {
  test.each([
    ['1', 1],
    ['250', 250],
    ['1000', 1000],
    [' 42 ', 42],
  ])('reads %s as %d', (text, expected) => {
    expect(parseRowCount(text)).toBe(expected);
  });

  test('falls back to the default for an emptied field', () => {
    expect(parseRowCount('')).toBe(100);
    expect(parseRowCount('   ')).toBe(100);
  });

  test.each(['0', '1001', '-3', '2.5', 'abc'])('refuses %s', (text) => {
    expect(parseRowCount(text)).toBeNull();
  });
});

describe('getInitialRowLimit', () => {
  const withLimit = (limit?: number): SavedQuery => ({
    id: 'q1',
    name: 'Calls',
    scope: SavedQueryScope.Personal,
    result_view: QueryResultView.Table,
    generation: 1,
    created_at: '',
    updated_at: '',
    query: {
      entity: 'dial_usage_log',
      mode: QueryMode.Row,
      page: limit == null ? undefined : { type: QueryPageType.Offset, offset: 0, limit, include_total: false },
    },
  });

  test('takes the page limit the query was saved with', () => {
    expect(getInitialRowLimit(withLimit(10))).toBe(10);
  });

  test('caps a larger saved limit at the widget maximum', () => {
    expect(getInitialRowLimit(withLimit(5000))).toBe(1000);
  });

  test('falls back to the default without a usable saved limit', () => {
    expect(getInitialRowLimit(withLimit())).toBe(100);
    expect(getInitialRowLimit(withLimit(0))).toBe(100);
    expect(getInitialRowLimit({ ...withLimit(), query: undefined, sql: 'SELECT 1' })).toBe(100);
    expect(getInitialRowLimit()).toBe(100);
  });
});
