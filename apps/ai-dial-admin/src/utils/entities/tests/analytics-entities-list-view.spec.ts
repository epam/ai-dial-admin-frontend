import { describe, expect, test } from 'vitest';

import { AnalyticsTable, AnalyticsTableType, TableStatus } from '@/src/models/analytics/table';
import { isExportableTable } from '@/src/utils/entities/analytics-entities-list-view';

const table = (overrides: Partial<AnalyticsTable>): AnalyticsTable => ({
  name: 'usage_sentiment',
  type: AnalyticsTableType.Enrichment,
  status: TableStatus.Active,
  ...overrides,
});

describe('isExportableTable', () => {
  test('accepts an active user table', () => {
    expect(isExportableTable(table({}))).toBe(true);
  });

  test('rejects a system table even when active', () => {
    expect(isExportableTable(table({ system: true }))).toBe(false);
  });

  test.each([TableStatus.Pending, TableStatus.Failed, undefined])('rejects a table whose status is %s', (status) => {
    expect(isExportableTable(table({ status }))).toBe(false);
  });

  test('rejects an OTLP landing table', () => {
    expect(isExportableTable(table({ name: 'otel_claude_code_logs' }))).toBe(false);
  });
});
