import { describe, expect, test } from 'vitest';

import { getMetricFieldInfo } from '@/src/components/Runs/Details/RowDetails/utils/metric-field-info';

describe('Runs :: getMetricFieldInfo', () => {
  test('Should read reason and logs from the leaf entry', () => {
    const infoGroup = { f1: { reason: 'Low overlap', verbose_logs: 'details...' } };

    expect(getMetricFieldInfo(infoGroup, 'f1')).toEqual({
      reason: 'Low overlap',
      logs: 'details...',
      error: null,
      details: null,
    });
  });

  test('Should read the group-level error for any leaf', () => {
    const infoGroup = { error: '422 Unprocessable Content' };

    expect(getMetricFieldInfo(infoGroup, 'error')).toEqual({
      reason: null,
      logs: null,
      error: '422 Unprocessable Content',
      details: null,
    });
    expect(getMetricFieldInfo(infoGroup, 'score')?.error).toBe('422 Unprocessable Content');
  });

  test('Should read the error from the leaf entry, where the eval service writes a failed metric', () => {
    const infoGroup = { score: { error: '422 Unprocessable Content: bad evaluation_params' } };

    expect(getMetricFieldInfo(infoGroup, 'score')).toEqual({
      reason: null,
      logs: null,
      error: '422 Unprocessable Content: bad evaluation_params',
      details: null,
    });
  });

  test('Should not give one leaf the error of another leaf', () => {
    const infoGroup = { score: { error: 'boom' }, other: { reason: 'fine' } };

    expect(getMetricFieldInfo(infoGroup, 'other')).toEqual({ reason: 'fine', logs: null, error: null, details: null });
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
      details: null,
    });
  });

  test('Should put every other key of the leaf entry under details', () => {
    const infoGroup = { f1: { highlight: 'h', json_explanation: 'j' } };

    expect(getMetricFieldInfo(infoGroup, 'f1')).toEqual({
      reason: null,
      logs: null,
      error: null,
      details: JSON.stringify({ highlight: 'h', json_explanation: 'j' }, null, 2),
    });
  });

  test('Should keep zero counts and empty lists in the details of a Set Comparison entry', () => {
    const leaf = {
      fn: 0,
      fp: 0,
      tp: 1,
      true_positives: ['rust'],
      false_negatives: [],
      false_positives: [],
    };

    const info = getMetricFieldInfo({ recall: leaf, precision: leaf }, 'recall');

    expect(JSON.parse(info?.details ?? 'null')).toEqual(leaf);
    expect(info?.reason).toBeNull();
    expect(info?.logs).toBeNull();
  });

  test('Should keep reason, logs and error out of details', () => {
    const infoGroup = { f1: { reason: 'r', verbose_logs: 'l', error: 'e', tp: 2 } };

    expect(getMetricFieldInfo(infoGroup, 'f1')).toEqual({
      reason: 'r',
      logs: 'l',
      error: 'e',
      details: JSON.stringify({ tp: 2 }, null, 2),
    });
  });

  test('Should leave details empty when the entry holds only reserved keys', () => {
    expect(getMetricFieldInfo({ f1: { reason: 'r', verbose_logs: 'l' } }, 'f1')?.details).toBeNull();
  });

  test('Should give a leaf named like a reserved key no details of its own', () => {
    expect(getMetricFieldInfo({ error: 'group failure' }, 'error')?.details).toBeNull();
  });

  test('Should treat blank and null values as absent', () => {
    const infoGroup = { f1: { reason: '  ', verbose_logs: null }, error: null };

    expect(getMetricFieldInfo(infoGroup, 'f1')).toBeUndefined();
  });

  test('Should show a leaf entry that is not an object as the details as is', () => {
    expect(getMetricFieldInfo({ f1: 'some info' }, 'f1')?.details).toBe('some info');
    expect(getMetricFieldInfo({ f1: ['a'] }, 'f1')?.details).toBe(JSON.stringify(['a'], null, 2));
    expect(getMetricFieldInfo({ f1: 0.5 }, 'f1')?.details).toBe('0.5');
  });

  test('Should treat a blank or null leaf entry as absent', () => {
    expect(getMetricFieldInfo({ f1: '  ' }, 'f1')).toBeUndefined();
    expect(getMetricFieldInfo({ f1: null }, 'f1')).toBeUndefined();
  });

  test('Should return undefined without an info group or for an unknown leaf', () => {
    expect(getMetricFieldInfo(undefined, 'f1')).toBeUndefined();
    expect(getMetricFieldInfo({ f1: { reason: 'r' } }, 'other')).toBeUndefined();
  });
});
