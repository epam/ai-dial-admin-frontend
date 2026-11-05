import { describe, expect, test } from 'vitest';

import { PoliciesI18nKey, PolicyAssignmentsI18nKey } from '@/src/constants/i18n';
import {
  getAmountError,
  getExpiresAtError,
  getPolicyFormErrors,
  hasCostWindow,
  isIntegerValue,
  isOffsetDateTime,
  isPositiveAmount,
} from '@/src/utils/policies/validation';

const VALID_POLICY = { name: 'cap', priority: 10, object: '*', cost: { day: 5 } };

describe('getPolicyFormErrors', () => {
  test('reports nothing for a valid policy', () => {
    expect(getPolicyFormErrors(VALID_POLICY)).toEqual({});
  });

  test.each([[undefined], [10.5], ['10' as never]])('rejects a priority of %s', (priority) => {
    expect(getPolicyFormErrors({ ...VALID_POLICY, priority }).priority).toBe(PoliciesI18nKey.PriorityInvalid);
  });

  test('requires at least one deployment in list mode', () => {
    expect(getPolicyFormErrors({ ...VALID_POLICY, object: [] }).object).toBe(PoliciesI18nKey.ObjectListRequired);
    expect(getPolicyFormErrors({ ...VALID_POLICY, object: ['gpt'] }).object).toBeUndefined();
  });

  test('requires an object to be chosen', () => {
    expect(getPolicyFormErrors({ ...VALID_POLICY, object: undefined }).object).toBe(PoliciesI18nKey.ObjectListRequired);
  });

  test('requires a cost window', () => {
    expect(getPolicyFormErrors({ ...VALID_POLICY, cost: {} }).costWindow).toBe(PoliciesI18nKey.CostWindowRequired);
    expect(getPolicyFormErrors({ ...VALID_POLICY, cost: undefined }).costWindow).toBe(
      PoliciesI18nKey.CostWindowRequired,
    );
  });

  test('rejects a zero or negative amount in either window', () => {
    const errors = getPolicyFormErrors({ ...VALID_POLICY, cost: { day: 0, month: -1 } });

    expect(errors.costDay).toBe(PoliciesI18nKey.AmountInvalid);
    expect(errors.costMonth).toBe(PoliciesI18nKey.AmountInvalid);
  });

  test('accepts a single window', () => {
    expect(getPolicyFormErrors({ ...VALID_POLICY, cost: { month: 100 } })).toEqual({});
  });
});

describe('amount and integer helpers', () => {
  test('isIntegerValue accepts whole numbers only', () => {
    expect(isIntegerValue(3)).toBe(true);
    expect(isIntegerValue(3.5)).toBe(false);
    expect(isIntegerValue('3')).toBe(false);
    expect(isIntegerValue(undefined)).toBe(false);
  });

  test('isPositiveAmount accepts numbers above zero only', () => {
    expect(isPositiveAmount(0.01)).toBe(true);
    expect(isPositiveAmount(0)).toBe(false);
    expect(isPositiveAmount(-1)).toBe(false);
    expect(isPositiveAmount('1')).toBe(false);
  });

  test('hasCostWindow is true when either window is set', () => {
    expect(hasCostWindow({ day: 1 })).toBe(true);
    expect(hasCostWindow({ month: 1 })).toBe(true);
    expect(hasCostWindow({})).toBe(false);
    expect(hasCostWindow(undefined)).toBe(false);
  });

  test('getAmountError ignores an unset window and flags a bad one', () => {
    expect(getAmountError(undefined)).toBeUndefined();
    expect(getAmountError(5)).toBeUndefined();
    expect(getAmountError(0)).toBe(PoliciesI18nKey.AmountInvalid);
  });
});

describe('expiresAt', () => {
  test.each(['2027-01-01T00:00:00Z', '2027-01-01T00:00:00+02:00', '2027-01-01T00:00Z', '2027-01-01T00:00:00.5-05:30'])(
    'accepts %s',
    (value) => {
      expect(isOffsetDateTime(value)).toBe(true);
    },
  );

  test.each(['2027-01-01T00:00:00', '2027-01-01', 'tomorrow', '2027-13-45T00:00:00Z', ''])('rejects %s', (value) => {
    expect(isOffsetDateTime(value)).toBe(false);
  });

  test('getExpiresAtError allows an empty value and flags a bad one', () => {
    expect(getExpiresAtError(undefined)).toBeUndefined();
    expect(getExpiresAtError('')).toBeUndefined();
    expect(getExpiresAtError('2027-01-01T00:00:00Z')).toBeUndefined();
    expect(getExpiresAtError('2027-01-01T00:00:00')).toBe(PolicyAssignmentsI18nKey.ExpiresAtInvalid);
  });
});
