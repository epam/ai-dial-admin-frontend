import { describe, expect, test } from 'vitest';

import { getInfoEntries, groupInfoEntries } from '../metric-info';

describe('getInfoEntries', () => {
  test('flattens a nested object value into sub-entries', () => {
    const infos = {
      accuracy: { precision: 0.9, recall: 0.8 },
    };
    const result = getInfoEntries(infos);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ metricKey: 'accuracy', entryKey: 'precision', value: '0.9' });
    expect(result[1]).toEqual({ metricKey: 'accuracy', entryKey: 'recall', value: '0.8' });
  });

  test('wraps a scalar value in a single entry with entryKey "value"', () => {
    const infos = { score: 42 };
    const result = getInfoEntries(infos);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ metricKey: 'score', entryKey: 'value', value: '42' });
  });

  test('wraps an array value in a single entry with entryKey "value"', () => {
    const arr = [1, 2, 3];
    const infos = { items: arr };
    const result = getInfoEntries(infos);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      metricKey: 'items',
      entryKey: 'value',
      value: JSON.stringify(arr, null, 2),
    });
  });

  test('handles null value as a scalar entry', () => {
    const infos = { empty: null };
    const result = getInfoEntries(infos);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ metricKey: 'empty', entryKey: 'value', value: 'null' });
  });

  test('handles a string value containing JSON object as pretty-printed', () => {
    const inner = { x: 1 };
    const infos = { meta: JSON.stringify(inner) };
    const result = getInfoEntries(infos);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(JSON.stringify(inner, null, 2));
  });

  test('returns empty array for empty infos', () => {
    expect(getInfoEntries({})).toEqual([]);
  });

  test('handles multiple metric keys', () => {
    const infos = { a: 1, b: 2 };
    const result = getInfoEntries(infos);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.metricKey)).toEqual(['a', 'b']);
  });
});

describe('groupInfoEntries', () => {
  test('groups entries by metricKey preserving insertion order', () => {
    const entries = [
      { metricKey: 'accuracy', entryKey: 'precision', value: '0.9' },
      { metricKey: 'accuracy', entryKey: 'recall', value: '0.8' },
      { metricKey: 'loss', entryKey: 'value', value: '0.1' },
    ];
    const result = groupInfoEntries(entries);
    expect(result).toHaveLength(2);
    const [accKey, accEntries] = result[0];
    expect(accKey).toBe('accuracy');
    expect(accEntries).toHaveLength(2);
    const [lossKey, lossEntries] = result[1];
    expect(lossKey).toBe('loss');
    expect(lossEntries).toHaveLength(1);
  });

  test('returns empty array for empty entries', () => {
    expect(groupInfoEntries([])).toEqual([]);
  });

  test('handles a single entry', () => {
    const entries = [{ metricKey: 'x', entryKey: 'value', value: '1' }];
    const result = groupInfoEntries(entries);
    expect(result).toHaveLength(1);
    expect(result[0][0]).toBe('x');
    expect(result[0][1]).toHaveLength(1);
  });

  test('maintains order of entries within each group', () => {
    const entries = [
      { metricKey: 'g', entryKey: 'first', value: '1' },
      { metricKey: 'g', entryKey: 'second', value: '2' },
      { metricKey: 'g', entryKey: 'third', value: '3' },
    ];
    const [, groupEntries] = groupInfoEntries(entries)[0];
    expect(groupEntries.map((e) => e.entryKey)).toEqual(['first', 'second', 'third']);
  });
});
