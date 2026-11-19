import { describe, expect, test } from 'vitest';

import { stepDown, stepUp } from '../utils';

describe('NumberStepper utils', () => {
  describe('stepUp', () => {
    test('increments a finite value', () => {
      expect(stepUp(1, 1)).toBe(2);
      expect(stepUp('3', 1)).toBe(4);
    });

    test('falls back to min when empty or invalid', () => {
      expect(stepUp(undefined, 1)).toBe(1);
      expect(stepUp('', 1)).toBe(1);
      expect(stepUp('abc', 1)).toBe(1);
    });

    test('caps at max when provided', () => {
      expect(stepUp(5, 1, 5)).toBe(5);
      expect(stepUp(4, 1, 5)).toBe(5);
    });
  });

  describe('stepDown', () => {
    test('decrements above min', () => {
      expect(stepDown(3, 1)).toBe(2);
    });

    test('stops at min', () => {
      expect(stepDown(1, 1)).toBe(1);
      expect(stepDown(0, 1)).toBe(1);
    });

    test('falls back to min when empty or invalid', () => {
      expect(stepDown(undefined, 1)).toBe(1);
      expect(stepDown('', 1)).toBe(1);
    });
  });
});
