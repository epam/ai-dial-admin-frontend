import { describe, expect, test } from 'vitest';

import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import {
  getRowDetailRunInfo,
  getRowDetailRunValue,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/run-field-values';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';

const field: RowDetailField = {
  fieldKey: 'score',
  label: 'score',
  primaryRaw: '0',
  secondaryRaw: '1',
  secondaryFailed: true,
  primaryInfo: { reason: 'primary', logs: null, error: null },
  secondaryInfo: { reason: 'secondary', logs: null, error: null },
  diffKind: MetricDeltaKind.Changed,
  isNumeric: true,
  isScoreIndicator: true,
  isMetric: true,
};

describe('Runs :: getRowDetailRunValue', () => {
  test('Should read the primary slot from the primary fields', () => {
    expect(getRowDetailRunValue(field, CompareRunSlot.Primary)).toEqual({ raw: '0', isFailed: false });
  });

  test('Should read the secondary slot from the secondary fields', () => {
    expect(getRowDetailRunValue(field, CompareRunSlot.Secondary)).toEqual({ raw: '1', isFailed: true });
  });
});

describe('Runs :: getRowDetailRunInfo', () => {
  test('Should read each slot’s own info', () => {
    expect(getRowDetailRunInfo(field, CompareRunSlot.Primary)?.reason).toBe('primary');
    expect(getRowDetailRunInfo(field, CompareRunSlot.Secondary)?.reason).toBe('secondary');
  });

  test('Should return undefined for a field without info', () => {
    const bare: RowDetailField = { ...field, primaryInfo: undefined, secondaryInfo: undefined };

    expect(getRowDetailRunInfo(bare, CompareRunSlot.Primary)).toBeUndefined();
    expect(getRowDetailRunInfo(bare, CompareRunSlot.Secondary)).toBeUndefined();
  });
});
