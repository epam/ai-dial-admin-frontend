import { describe, expect, test } from 'vitest';

import { buildSqlCompletions } from '@/src/components/Analytics/QueryBuilder/utils/sql-completions';
import { SQL_FUNCTIONS, SQL_KEYWORDS } from '@/src/constants/analytics/sql';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { SqlCompletionKind } from '@/src/models/analytics/sql';

const FIELDS: AnalyticsEntityField[] = [
  { name: 'event_id', type: AnalyticsFieldType.Uuid, source: 'event_id' },
  { name: 'total_tokens', type: AnalyticsFieldType.Long, source: 'total_tokens' },
];

describe('buildSqlCompletions', () => {
  test('emits one field item per schema field with the type as detail', () => {
    const items = buildSqlCompletions(FIELDS, 'dial_usage_log');
    const fields = items.filter((i) => i.kind === SqlCompletionKind.Field);

    expect(fields).toEqual([
      { label: 'event_id', kind: SqlCompletionKind.Field, insertText: 'event_id', detail: AnalyticsFieldType.Uuid },
      {
        label: 'total_tokens',
        kind: SqlCompletionKind.Field,
        insertText: 'total_tokens',
        detail: AnalyticsFieldType.Long,
      },
    ]);
  });

  test('emits the entity name as the FROM target', () => {
    const items = buildSqlCompletions(FIELDS, 'dial_usage_log');
    const entity = items.filter((i) => i.kind === SqlCompletionKind.Entity);

    expect(entity).toEqual([
      { label: 'dial_usage_log', kind: SqlCompletionKind.Entity, insertText: 'dial_usage_log', detail: 'table' },
    ]);
  });

  test('omits the entity item when no entity is selected', () => {
    const items = buildSqlCompletions(FIELDS, '');
    expect(items.some((i) => i.kind === SqlCompletionKind.Entity)).toBe(false);
  });

  test('includes every keyword and function from the catalog', () => {
    const items = buildSqlCompletions([], 'dial_usage_log');
    const keywords = items.filter((i) => i.kind === SqlCompletionKind.Keyword).map((i) => i.label);
    const fns = items.filter((i) => i.kind === SqlCompletionKind.Function).map((i) => i.label);

    expect(keywords).toEqual(SQL_KEYWORDS);
    expect(fns).toEqual(SQL_FUNCTIONS);
  });
});
