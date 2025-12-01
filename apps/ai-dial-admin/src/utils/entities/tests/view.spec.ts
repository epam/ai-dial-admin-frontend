import { describe, test, expect } from 'vitest';
import { getViewHeaderClassName } from '../view';

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
});
