import { describe, expect, test } from 'vitest';

import { getMetricFieldInfo } from '@/src/components/Runs/Details/RowDetails/utils/metric-field-info';

describe('Runs :: getMetricFieldInfo', () => {
  test('Should read reason and logs from the leaf entry', () => {
    const infoGroup = { f1: { reason: 'Low overlap', verbose_logs: 'details...' } };

    expect(getMetricFieldInfo(infoGroup, 'f1')).toEqual({ reason: 'Low overlap', logs: 'details...', error: null });
  });

  test('Should read the group-level error for any leaf', () => {
    const infoGroup = { error: '422 Unprocessable Content' };

    expect(getMetricFieldInfo(infoGroup, 'error')).toEqual({
      reason: null,
      logs: null,
      error: '422 Unprocessable Content',
    });
    expect(getMetricFieldInfo(infoGroup, 'score')?.error).toBe('422 Unprocessable Content');
  });

  test('Should read the error from the leaf entry, where the eval service writes a failed metric', () => {
    const infoGroup = { score: { error: '422 Unprocessable Content: bad evaluation_params' } };

    expect(getMetricFieldInfo(infoGroup, 'score')).toEqual({
      reason: null,
      logs: null,
      error: '422 Unprocessable Content: bad evaluation_params',
    });
  });

  test('Should not give one leaf the error of another leaf', () => {
    const infoGroup = { score: { error: 'boom' }, other: { reason: 'fine' } };

    expect(getMetricFieldInfo(infoGroup, 'other')).toEqual({ reason: 'fine', logs: null, error: null });
  });

  test('Should prefer the leaf error over the group-level one', () => {
    const infoGroup = { error: 'group failure', score: { error: 'leaf failure' } };

    expect(getMetricFieldInfo(infoGroup, 'score')?.error).toBe('leaf failure');
    expect(getMetricFieldInfo(infoGroup, 'other')?.error).toBe('group failure');
  });

  test('Should fall back to the group-level error when the leaf error is blank', () => {
    const infoGroup = { error: 'group failure', score: { error: '  ' } };

    expect(getMetricFieldInfo(infoGroup, 'score')?.error).toBe('group failure');
  });

  test('Should serialize non-string values', () => {
    const infoGroup = { f1: { reason: { why: 'x' }, verbose_logs: 3 } };

    expect(getMetricFieldInfo(infoGroup, 'f1')).toEqual({
      reason: JSON.stringify({ why: 'x' }, null, 2),
      logs: '3',
      error: null,
    });
  });

  test('Should ignore entries other than reason and logs', () => {
    const infoGroup = { f1: { highlight: 'h', json_explanation: 'j' } };

    expect(getMetricFieldInfo(infoGroup, 'f1')).toBeUndefined();
  });

  test('Should treat blank and null values as absent', () => {
    const infoGroup = { f1: { reason: '  ', verbose_logs: null }, error: null };

    expect(getMetricFieldInfo(infoGroup, 'f1')).toBeUndefined();
  });

  test('Should ignore a leaf entry that is not an object', () => {
    expect(getMetricFieldInfo({ f1: 'some info' }, 'f1')).toBeUndefined();
    expect(getMetricFieldInfo({ f1: ['a'] }, 'f1')).toBeUndefined();
  });

  test('Should return undefined without an info group or for an unknown leaf', () => {
    expect(getMetricFieldInfo(undefined, 'f1')).toBeUndefined();
    expect(getMetricFieldInfo({ f1: { reason: 'r' } }, 'other')).toBeUndefined();
  });
});
