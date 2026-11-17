import { describe, expect, test } from 'vitest';

import { toSelectOptions, valuesToSelectOptions } from '@/src/components/Analytics/QueryBuilder/Chips/utils/options';

describe('toSelectOptions', () => {
  test('labels an option by its display name', () => {
    expect(toSelectOptions([{ name: 'model', display_name: 'Model' }])).toEqual([{ value: 'model', label: 'Model' }]);
  });

  test('falls back to the name when the display name is missing or empty', () => {
    expect(toSelectOptions([{ name: 'model' }, { name: 'latency', display_name: '' }])).toEqual([
      { value: 'model', label: 'model' },
      { value: 'latency', label: 'latency' },
    ]);
  });

  test('returns an empty list for no options', () => {
    expect(toSelectOptions([])).toEqual([]);
  });
});

describe('valuesToSelectOptions', () => {
  test('uses each value as both the value and the label, in order', () => {
    expect(valuesToSelectOptions(['ok', 'failed'])).toEqual([
      { value: 'ok', label: 'ok' },
      { value: 'failed', label: 'failed' },
    ]);
  });

  test('returns an empty list for no values', () => {
    expect(valuesToSelectOptions([])).toEqual([]);
  });
});
