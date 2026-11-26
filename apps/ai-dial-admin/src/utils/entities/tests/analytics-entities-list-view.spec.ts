import { describe, expect, test } from 'vitest';

import { AnalyticsTable, AnalyticsTableType, TableStatus } from '@/src/models/analytics/table';
import { getTablesForExportGrid, isExportableTable } from '@/src/utils/entities/analytics-entities-list-view';

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

describe('isExportableTable — access included', () => {
  test('accepts an active system source table', () => {
    expect(isExportableTable(table({ system: true, type: AnalyticsTableType.Source }), true)).toBe(true);
  });

  test('rejects a system enrichment table', () => {
    expect(isExportableTable(table({ system: true }), true)).toBe(false);
  });

  test('still rejects an inactive system source table', () => {
    expect(
      isExportableTable(table({ system: true, type: AnalyticsTableType.Source, status: TableStatus.Pending }), true),
    ).toBe(false);
  });
});

describe('getTablesForExportGrid', () => {
  test('marks system rows so they can be dropped when access is turned off', () => {
    const rows = getTablesForExportGrid(
      [table({}), table({ name: 'dial_usage_log', system: true, type: AnalyticsTableType.Source })],
      true,
    );

    expect(rows.map(({ name, isSystem }) => [name, isSystem])).toEqual([
      ['usage_sentiment', undefined],
      ['dial_usage_log', true],
    ]);
  });
});
