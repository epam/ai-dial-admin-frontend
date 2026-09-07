import { describe, expect, test } from 'vitest';
import {
  createGroupKeyRow,
  getGroupKeyOutputName,
  getTruncUnits,
  isTruncatable,
  toGroupKeyRows,
  toGroupKeys,
} from '@/src/components/Analytics/Pipelines/Aggregate/group-keys';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { TruncUnit } from '@/src/models/analytics/pipeline';
import { GroupKeyKind } from '@/src/models/analytics/pipeline-ui';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';
const column = (name: string, type: AnalyticsFieldType): AnalyticsTableColumn => ({ name, source_name: name, type });
const columns = [
  column('chat_id', AnalyticsFieldType.String),
  column('request_time', AnalyticsFieldType.Timestamp),
  column('request_day', AnalyticsFieldType.Date),
];
describe('Pipelines :: group keys', () => {
  test('offers the hour only on a timestamp', () => {
    expect(getTruncUnits(columns, 'request_time')).toContain(TruncUnit.Hour);
    expect(getTruncUnits(columns, 'request_day')).not.toContain(TruncUnit.Hour);
  });
  test('offers the coarser units on a date as well', () => {
    expect(getTruncUnits(columns, 'request_day')).toEqual([TruncUnit.Day, TruncUnit.Week, TruncUnit.Month]);
  });
  test('offers no unit at all on a column that is neither', () => {
    expect(getTruncUnits(columns, 'chat_id')).toEqual([]);
    expect(isTruncatable(columns, 'chat_id')).toBe(false);
    expect(isTruncatable(columns, 'request_time')).toBe(true);
  });
  test('emits a plain column key', () => {
    const rows = [{ id: 'a', kind: GroupKeyKind.Column, column: 'chat_id' }];
    expect(toGroupKeys(rows)).toEqual([{ column: 'chat_id' }]);
  });
  test('emits a truncation with its unit', () => {
    const rows = [{ id: 'a', kind: GroupKeyKind.Trunc, column: 'request_time', unit: TruncUnit.Day }];
    expect(toGroupKeys(rows)).toEqual([{ trunc: { column: 'request_time', unit: TruncUnit.Day } }]);
  });
  test('carries an alias when one is given', () => {
    const rows = [{ id: 'a', kind: GroupKeyKind.Column, column: 'chat_id', as: 'conversation' }];
    expect(toGroupKeys(rows)).toEqual([{ column: 'chat_id', as: 'conversation' }]);
  });
  test('preserves the order the rows were entered in', () => {
    const rows = [
      { id: 'a', kind: GroupKeyKind.Column, column: 'chat_id' },
      { id: 'b', kind: GroupKeyKind.Trunc, column: 'request_time', unit: TruncUnit.Hour },
    ];
    expect(toGroupKeys(rows).map((key) => key.column ?? key.trunc?.column)).toEqual(['chat_id', 'request_time']);
  });
  test('drops an incomplete row rather than sending a partial key', () => {
    const rows = [
      { id: 'a', kind: GroupKeyKind.Column, column: '' },
      { id: 'b', kind: GroupKeyKind.Trunc, column: 'request_time' },
    ];
    expect(toGroupKeys(rows)).toEqual([]);
  });
  test('round-trips a stored key back into a row', () => {
    const rows = toGroupKeyRows([{ trunc: { column: 'request_time', unit: TruncUnit.Week }, as: 'week' }]);
    expect(rows[0]).toMatchObject({
      kind: GroupKeyKind.Trunc,
      column: 'request_time',
      unit: TruncUnit.Week,
      as: 'week',
    });
  });
  test('states the column name an unaliased key will be stored as', () => {
    expect(getGroupKeyOutputName({ id: 'a', kind: GroupKeyKind.Column, column: 'chat_id' })).toBe('chat_id');
    expect(getGroupKeyOutputName({ id: 'a', kind: GroupKeyKind.Column, column: 'chat_id', as: 'x' })).toBe('x');
  });
  test('issues distinct ids for new rows', () => {
    expect(createGroupKeyRow().id).not.toBe(createGroupKeyRow().id);
  });
});
