import { describe, expect, test } from 'vitest';
import { getControlClassName, getHeaderClassName, getViewHeaderClassName } from '../view';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

describe('getViewHeaderClassName', () => {
  test('returns justify-end when isJsonEditorEnabled is true', () => {
    const result = getViewHeaderClassName(true);
    expect(result).toContain('justify-end');
    expect(result).toContain('flex');
    expect(result).toContain('flex-row');
    expect(result).toContain('min-h-[34px]');
    expect(result).not.toContain('justify-between');
  });

  test('returns justify-between when isJsonEditorEnabled is false', () => {
    const result = getViewHeaderClassName(false);
    expect(result).toContain('justify-between');
    expect(result).toContain('flex');
    expect(result).toContain('flex-row');
    expect(result).toContain('min-h-[34px]');
    expect(result).not.toContain('justify-end');
  });

  test('returns justify-between when isJsonEditorEnabled is undefined', () => {
    const result = getViewHeaderClassName();
    expect(result).toContain('justify-between');
    expect(result).toContain('flex');
    expect(result).toContain('flex-row');
    expect(result).toContain('min-h-[34px]');
    expect(result).not.toContain('justify-end');
  });

  describe('getHeaderClassName', () => {
    test('should return classes with justify-between when isJsonEditorEnabled is false', () => {
      const result = getHeaderClassName(false);

      expect(result).toContain('flex');
      expect(result).toContain('flex-row');
      expect(result).toContain('min-h-[34px]');
      expect(result).toContain('gap-x-4');
      expect(result).toContain('justify-between');
      expect(result).not.toContain('justify-end');
    });

    test('should return classes with justify-end when isJsonEditorEnabled is true', () => {
      const result = getHeaderClassName(true);

      expect(result).toContain('flex');
      expect(result).toContain('flex-row');
      expect(result).toContain('min-h-[34px]');
      expect(result).toContain('gap-x-4');
      expect(result).toContain('justify-end');
      expect(result).not.toContain('justify-between');
    });

    test('should return classes with justify-between when isJsonEditorEnabled is undefined', () => {
      const result = getHeaderClassName();

      expect(result).toContain('flex');
      expect(result).toContain('flex-row');
      expect(result).toContain('min-h-[34px]');
      expect(result).toContain('gap-x-4');
      expect(result).toContain('justify-between');
      expect(result).not.toContain('justify-end');
    });

    test('should always include base classes regardless of isJsonEditorEnabled', () => {
      const resultTrue = getHeaderClassName(true);
      const resultFalse = getHeaderClassName(false);
      const resultUndefined = getHeaderClassName();

      const baseClasses = ['flex', 'flex-row', 'min-h-[34px]', 'gap-x-4'];

      baseClasses.forEach((baseClass) => {
        expect(resultTrue).toContain(baseClass);
        expect(resultFalse).toContain(baseClass);
        expect(resultUndefined).toContain(baseClass);
      });
    });

    test('should return a non-empty string', () => {
      expect(getHeaderClassName(true)).toBeTruthy();
      expect(getHeaderClassName(false)).toBeTruthy();
      expect(getHeaderClassName()).toBeTruthy();
    });
  });

  describe('getControlClassName', () => {
    test('should return "w-full" when isFullWidth is true', () => {
      const result = getControlClassName(true);

      expect(result).toBe('w-full');
    });

    test('should return STANDARD_CONTROL_WIDTH when isFullWidth is false', () => {
      const result = getControlClassName(false);

      expect(result).toBe(STANDARD_CONTROL_WIDTH);
    });

    test('should return STANDARD_CONTROL_WIDTH when isFullWidth is undefined', () => {
      const result = getControlClassName();

      expect(result).toBe(STANDARD_CONTROL_WIDTH);
    });

    test('should return different values for true vs false/undefined', () => {
      const fullWidth = getControlClassName(true);
      const standardWidth = getControlClassName(false);
      const undefinedWidth = getControlClassName();

      expect(fullWidth).not.toBe(standardWidth);
      expect(standardWidth).toBe(undefinedWidth);
    });

    test('should return a non-empty string', () => {
      expect(getControlClassName(true)).toBeTruthy();
      expect(getControlClassName(false)).toBeTruthy();
      expect(getControlClassName()).toBeTruthy();
    });

    test('should handle boolean edge cases', () => {
      expect(getControlClassName(true)).toBe('w-full');
      expect(getControlClassName(false)).toBe(STANDARD_CONTROL_WIDTH);
      // Test truthy/falsy values
      expect(getControlClassName(undefined)).toBe(STANDARD_CONTROL_WIDTH);
    });
  });

  describe('Integration tests', () => {
    test('should handle multiple calls with different parameters consistently', () => {
      const header1 = getHeaderClassName(true);
      const header2 = getHeaderClassName(true);
      const header3 = getHeaderClassName(false);
      const header4 = getHeaderClassName(false);

      expect(header1).toBe(header2);
      expect(header3).toBe(header4);
      expect(header1).not.toBe(header3);
    });

    test('should handle multiple calls for control class consistently', () => {
      const control1 = getControlClassName(true);
      const control2 = getControlClassName(true);
      const control3 = getControlClassName(false);
      const control4 = getControlClassName(false);

      expect(control1).toBe(control2);
      expect(control3).toBe(control4);
      expect(control1).not.toBe(control3);
    });

    test('should return valid CSS class strings', () => {
      const headerClass = getHeaderClassName(true);
      const controlClass = getControlClassName(true);

      // Should not contain invalid characters for CSS classes
      expect(headerClass).toMatch(/^[\w\s\-\[\]:]+$/);
      expect(controlClass).toMatch(/^[\w\-]+$/);
    });
  });
});
