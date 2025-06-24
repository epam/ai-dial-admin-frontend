import { isValueTruthy } from '../types';
import { describe, expect, test } from 'vitest';

describe('Utils :: isValueTruthy', () => {
  test('Should return true', () => {
    const result = isValueTruthy('true');
    expect(result).toBeTruthy();
  });

  test('Should return false', () => {
    const result = isValueTruthy('false');
    expect(result).toBeFalsy();
  });
});
