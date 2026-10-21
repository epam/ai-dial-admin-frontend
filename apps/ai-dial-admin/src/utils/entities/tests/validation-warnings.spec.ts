import { describe, expect, test } from 'vitest';

import { formatTestSuiteWarnings, formatValidationWarnings } from '../validation-warnings';

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

describe('Utils :: entities :: formatTestSuiteWarnings', () => {
  test('Should join code and message of each warning with a semicolon', () => {
    expect(
      formatTestSuiteWarnings([
        { code: 'MISSING_DATASET', message: 'Dataset is required', path: 'dataset', fieldName: 'dataset' },
        { code: 'EMPTY', message: '', path: '', fieldName: '' },
      ]),
    ).toBe('MISSING_DATASET: Dataset is required; EMPTY');
  });

  test('Should return an empty string for missing warnings', () => {
    expect(formatTestSuiteWarnings()).toBe('');
  });
});
