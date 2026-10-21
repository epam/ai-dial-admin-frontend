import { describe, expect, test } from 'vitest';

import { ModelViewI18nKey } from '@/src/constants/i18n';
import { PricingOperator, PricingRate } from '@/src/models/dial/model';

import { formatPricingRate, getMultipliedRate, getRealRate } from '../utils';

const t = (key: string) => key;

const flatRate = '0.000003';

const oneLevelTree: PricingRate = {
  test: { field: 'ttl', operator: PricingOperator.EQ, value: '1h' },
  ifTrue: '0.000006',
  ifFalse: '0.00000375',
};

const nestedTree: PricingRate = {
  test: { field: 'cachedReadTokens', operator: PricingOperator.GT, value: '1024' },
  ifTrue: {
    test: { field: 'promptTokens', operator: PricingOperator.LT, value: '2048' },
    ifTrue: '0.000006',
    ifFalse: '0.000004',
  },
  ifFalse: '0.00000375',
};

describe('getMultipliedRate', () => {
  test('multiplies a flat rate per million under the token unit', () => {
    expect(getMultipliedRate(flatRate, true)).toEqual('3');
  });

  test('leaves a flat rate unscaled outside the token unit', () => {
    expect(getMultipliedRate(flatRate, false)).toEqual('0.000003');
  });

  test('multiplies every leaf of a one-level tree', () => {
    expect(getMultipliedRate(oneLevelTree, true)).toEqual({
      test: { field: 'ttl', operator: PricingOperator.EQ, value: '1h' },
      ifTrue: '6',
      ifFalse: '3.75',
    });
  });

  test('multiplies every leaf of a nested tree', () => {
    expect(getMultipliedRate(nestedTree, true)).toEqual({
      test: { field: 'cachedReadTokens', operator: PricingOperator.GT, value: '1024' },
      ifTrue: {
        test: { field: 'promptTokens', operator: PricingOperator.LT, value: '2048' },
        ifTrue: '6',
        ifFalse: '4',
      },
      ifFalse: '3.75',
    });
  });

  test('keeps an empty leaf as an empty string so the input renders empty', () => {
    expect(getMultipliedRate({ test: oneLevelTree.test, ifTrue: '0.000006', ifFalse: '' }, true)).toEqual({
      test: { field: 'ttl', operator: PricingOperator.EQ, value: '1h' },
      ifTrue: '6',
      ifFalse: '',
    });
  });

  test('returns undefined for an undefined rate', () => {
    expect(getMultipliedRate(undefined, true)).toBeUndefined();
  });
});

describe('getRealRate', () => {
  test('divides a flat rate back to per token', () => {
    expect(getRealRate('3', true)).toEqual('0.000003');
  });

  test('round-trips a flat rate through display and back', () => {
    expect(getRealRate(getMultipliedRate(flatRate, true), true)).toEqual(flatRate);
  });

  test('round-trips a nested tree through display and back', () => {
    expect(getRealRate(getMultipliedRate(nestedTree, true), true)).toEqual(nestedTree);
  });

  test('preserves an explicit zero leaf as zero', () => {
    expect(getRealRate({ test: oneLevelTree.test, ifTrue: '0', ifFalse: '3' }, true)).toEqual({
      test: { field: 'ttl', operator: PricingOperator.EQ, value: '1h' },
      ifTrue: '0',
      ifFalse: '0.000003',
    });
  });

  test('omits a branch left empty so it is not persisted', () => {
    expect(getRealRate({ test: oneLevelTree.test, ifTrue: '6', ifFalse: '' }, true)).toEqual({
      test: { field: 'ttl', operator: PricingOperator.EQ, value: '1h' },
      ifTrue: '0.000006',
    });
  });

  test('returns undefined for an empty flat rate', () => {
    expect(getRealRate('', true)).toBeUndefined();
  });
});

describe('formatPricingRate', () => {
  test('formats a flat rate scaled per million', () => {
    expect(formatPricingRate('0.000006', true, t)).toEqual('6');
  });

  test('formats a one-level tree as a conditional expression', () => {
    expect(formatPricingRate(oneLevelTree, true, t)).toEqual('ttl == 1h ? 6 : 3.75');
  });

  test('parenthesises a nested branch', () => {
    expect(formatPricingRate(nestedTree, true, t)).toEqual(
      'cachedReadTokens > 1024 ? (promptTokens < 2048 ? 6 : 4) : 3.75',
    );
  });

  test('shows the prompt-rate fallback for an omitted branch', () => {
    expect(formatPricingRate({ test: oneLevelTree.test, ifTrue: '0.000006' }, true, t)).toEqual(
      `ttl == 1h ? 6 : ${t(ModelViewI18nKey.PromptRate)}`,
    );
  });

  test('returns an empty string for an undefined rate', () => {
    expect(formatPricingRate(undefined, true, t)).toEqual('');
  });
});
