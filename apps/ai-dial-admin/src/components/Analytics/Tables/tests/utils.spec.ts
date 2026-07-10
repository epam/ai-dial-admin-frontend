import { describe, expect, test } from 'vitest';

import { createColumnRow, toTableColumns } from '@/src/components/Analytics/Tables/utils';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';

describe('createColumnRow', () => {
  test('creates a blank row with a unique id and string default type', () => {
    const a = createColumnRow();
    const b = createColumnRow();
    expect(a.id).not.toBe(b.id);
    expect(a).toMatchObject({ source_name: '', name: '', type: AnalyticsFieldType.String, tag: '', nullable: false });
  });
});

describe('toTableColumns', () => {
  test('keeps only rows with both source_name and name, trims, and omits empty tag', () => {
    const rows = [
      {
        id: '1',
        source_name: ' event_id ',
        name: ' event ',
        type: AnalyticsFieldType.Uuid,
        tag: ' identity ',
        nullable: true,
      },
      { id: '2', source_name: '', name: 'skip', type: AnalyticsFieldType.String, tag: '', nullable: false },
      { id: '3', source_name: 'x', name: 'x', type: AnalyticsFieldType.Long, tag: '', nullable: false },
    ];
    expect(toTableColumns(rows)).toEqual([
      { source_name: 'event_id', name: 'event', type: AnalyticsFieldType.Uuid, nullable: true, tag: 'identity' },
      { source_name: 'x', name: 'x', type: AnalyticsFieldType.Long, nullable: false },
    ]);
  });
});
