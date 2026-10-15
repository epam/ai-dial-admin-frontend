import { describe, expect, test } from 'vitest';

import { StatusBadgeVariant } from '@/src/components/Common/StatusBadge/models';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { formatValidationWarnings, getOverallStatusBadgeProps } from '../overall-status';

const labels = { valid: 'Valid', invalid: 'Invalid' };

describe('Utils :: entities :: formatValidationWarnings', () => {
  test('Should join field and message of a warning', () => {
    expect(formatValidationWarnings([{ field: 'endpoint', message: 'must not be empty' }])).toBe(
      'endpoint: must not be empty',
    );
  });

  test('Should join several warnings with a semicolon', () => {
    expect(
      formatValidationWarnings([
        { field: 'a', message: 'x' },
        { field: 'b', message: 'y' },
      ]),
    ).toBe('a: x; b: y');
  });

  test('Should keep the single present part of a partial warning and drop empty ones', () => {
    expect(formatValidationWarnings([{ message: 'only message' }, { field: 'only-field' }, {}])).toBe(
      'only message; only-field',
    );
  });

  test('Should return an empty string for missing or empty warnings', () => {
    expect(formatValidationWarnings()).toBe('');
    expect(formatValidationWarnings([])).toBe('');
  });
});

describe('Utils :: entities :: getOverallStatusBadgeProps', () => {
  test('Should map valid to the valid variant without a hint, even with warnings', () => {
    expect(
      getOverallStatusBadgeProps(
        { status: DialModelResourceStatus.Valid, validationWarnings: [{ field: 'a', message: 'x' }] },
        labels,
      ),
    ).toEqual({ variant: StatusBadgeVariant.Valid, label: 'Valid' });
  });

  test('Should map invalid with warnings to the invalid variant with a hint', () => {
    expect(
      getOverallStatusBadgeProps(
        { status: DialModelResourceStatus.Invalid, validationWarnings: [{ field: 'a', message: 'x' }] },
        labels,
      ),
    ).toEqual({ variant: StatusBadgeVariant.Invalid, label: 'Invalid', hint: 'a: x' });
  });

  test('Should omit the hint for invalid without usable warnings', () => {
    expect(getOverallStatusBadgeProps({ status: DialModelResourceStatus.Invalid }, labels)?.hint).toBeUndefined();
    expect(
      getOverallStatusBadgeProps({ status: DialModelResourceStatus.Invalid, validationWarnings: [{}] }, labels)?.hint,
    ).toBeUndefined();
  });

  test('Should return null for a missing metadata, missing status or unknown status', () => {
    expect(getOverallStatusBadgeProps(undefined, labels)).toBeNull();
    expect(getOverallStatusBadgeProps({}, labels)).toBeNull();
    expect(getOverallStatusBadgeProps({ status: 'pending' as DialModelResourceStatus }, labels)).toBeNull();
  });
});
