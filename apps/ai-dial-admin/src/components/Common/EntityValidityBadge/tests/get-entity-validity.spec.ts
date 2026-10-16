import { describe, expect, test } from 'vitest';

import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { getEntityValidity } from '../get-entity-validity';

describe('Common components :: EntityValidityBadge :: getEntityValidity', () => {
  test('Should return null for a missing entity or one reporting no validity', () => {
    expect(getEntityValidity(undefined)).toBeNull();
    expect(getEntityValidity({})).toBeNull();
    expect(getEntityValidity({ _metadata: {} })).toBeNull();
  });

  test('Should return null for an unrecognised metadata status when no other source applies', () => {
    expect(getEntityValidity({ _metadata: { status: 'pending' as DialModelResourceStatus } })).toBeNull();
  });

  test('Should map a valid metadata status without a hint, even with warnings', () => {
    expect(
      getEntityValidity({
        _metadata: { status: DialModelResourceStatus.Valid, validationWarnings: [{ field: 'a', message: 'x' }] },
      }),
    ).toEqual({ isValid: true });
  });

  test('Should map an invalid metadata status with the field: message hint', () => {
    expect(
      getEntityValidity({
        _metadata: { status: DialModelResourceStatus.Invalid, validationWarnings: [{ field: 'a', message: 'x' }] },
      }),
    ).toEqual({ isValid: false, hint: 'a: x' });
  });

  test('Should omit the hint for an invalid metadata status without usable warnings', () => {
    expect(getEntityValidity({ _metadata: { status: DialModelResourceStatus.Invalid } })).toEqual({
      isValid: false,
      hint: undefined,
    });
    expect(
      getEntityValidity({ _metadata: { status: DialModelResourceStatus.Invalid, validationWarnings: [{}] } })?.hint,
    ).toBeUndefined();
  });

  test('Should map validityState and use its message as the hint when invalid', () => {
    expect(getEntityValidity({ validityState: { valid: true, message: 'ignored' } })).toEqual({ isValid: true });
    expect(getEntityValidity({ validityState: { valid: false, message: 'Missing deployment' } })).toEqual({
      isValid: false,
      hint: 'Missing deployment',
    });
    expect(getEntityValidity({ validityState: { valid: false, message: '' } })?.hint).toBeUndefined();
  });

  test('Should map a test suite valid flag and use code: message warnings as the hint', () => {
    expect(getEntityValidity({ valid: true })).toEqual({ isValid: true });
    expect(
      getEntityValidity({
        valid: false,
        validationWarnings: [{ code: 'MISSING_DATASET', message: 'Dataset is required', path: '', fieldName: '' }],
      }),
    ).toEqual({ isValid: false, hint: 'MISSING_DATASET: Dataset is required' });
  });

  test('Should prefer the metadata status over the other sources', () => {
    expect(
      getEntityValidity({
        _metadata: { status: DialModelResourceStatus.Valid },
        validityState: { valid: false, message: 'x' },
      }),
    ).toEqual({ isValid: true });
  });
});
