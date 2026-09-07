import { describe, expect, test } from 'vitest';
import { createMeasureRow, toMeasureRows, toMeasures } from '@/src/components/Analytics/Pipelines/Aggregate/measures';
describe('Pipelines :: measures', () => {
  test('emits a complete measure', () => {
    const rows = [{ id: 'a', name: 'turn_count', fn: 'count', column: 'trace_id', distinct: true }];
    expect(toMeasures(rows)).toEqual([{ name: 'turn_count', fn: 'count', column: 'trace_id', distinct: true }]);
  });
  test('omits the optional qualifiers rather than sending them empty', () => {
    const rows = [{ id: 'a', name: 'hops', fn: 'count', column: '', where: '', distinct: false }];
    const [measure] = toMeasures(rows);
    expect(measure).toEqual({ name: 'hops', fn: 'count' });
  });
  test('carries a per-measure predicate', () => {
    const rows = [{ id: 'a', name: 'failed', fn: 'count', where: 'success = false' }];
    expect(toMeasures(rows)[0].where).toBe('success = false');
  });
  test('drops a row missing its name or its function', () => {
    const rows = [
      { id: 'a', name: '', fn: 'count' },
      { id: 'b', name: 'x', fn: '' },
    ];
    expect(toMeasures(rows)).toEqual([]);
  });
  test('round-trips a stored measure back into a row', () => {
    const rows = toMeasureRows([{ name: 'total', fn: 'sum', column: 'total_price' }]);
    expect(rows[0]).toMatchObject({ name: 'total', fn: 'sum', column: 'total_price' });
    expect(rows[0].id).toBeTruthy();
  });
  test('issues distinct ids for new rows', () => {
    expect(createMeasureRow().id).not.toBe(createMeasureRow().id);
  });
});
