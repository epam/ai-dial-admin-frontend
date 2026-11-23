import { describe, expect, test } from 'vitest';

import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { canCopyFieldValue } from '@/src/components/Runs/Details/RowDetails/utils/can-copy-field-value';

const field = (overrides: Partial<RowDetailField> = {}): RowDetailField => ({
  fieldKey: 'answer',
  label: 'answer',
  primaryRaw: 'text',
  secondaryRaw: null,
  diffKind: MetricDeltaKind.Empty,
  isNumeric: false,
  isScoreIndicator: false,
  isMetric: false,
  ...overrides,
});

describe('canCopyFieldValue', () => {
  test('allows a non-empty text value', () => {
    expect(canCopyFieldValue(field(), 'text', false)).toBe(true);
  });

  test('allows a numeric string in an extracted field', () => {
    expect(canCopyFieldValue(field({ fieldKey: 'y_true' }), '1', false)).toBe(true);
  });

  test('refuses a metric', () => {
    expect(canCopyFieldValue(field({ isMetric: true }), 'text', false)).toBe(false);
  });

  test('refuses a score the cell renders as a filled score', () => {
    expect(canCopyFieldValue(field({ isScoreIndicator: true }), '0.8', false)).toBe(false);
  });

  test.each(['runNumber', 'overallScore', 'httpStatusCode', 'execDurationMs'])(
    'refuses the short right-aligned run figure %s',
    (fieldKey) => {
      expect(canCopyFieldValue(field({ fieldKey }), '1', false)).toBe(false);
    },
  );

  test('refuses the execution status badge', () => {
    expect(canCopyFieldValue(field({ fieldKey: 'executionStatus' }), 'COMPLETED', false)).toBe(false);
  });

  test('refuses a failed value', () => {
    expect(canCopyFieldValue(field(), 'text', true)).toBe(false);
  });

  test('refuses a null or empty value', () => {
    expect(canCopyFieldValue(field(), null, false)).toBe(false);
    expect(canCopyFieldValue(field(), '', false)).toBe(false);
  });
});
