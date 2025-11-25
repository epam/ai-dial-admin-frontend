import { describe, test, expect } from 'vitest';
import { getViewHeaderClassNames } from '../view';

describe('getViewHeaderClassNames', () => {
  test('returns justify-end when jsonEditorEnabled is true', () => {
    const result = getViewHeaderClassNames(true);
    expect(result).toContain('justify-end');
    expect(result).toContain('flex');
    expect(result).toContain('flex-row');
    expect(result).toContain('min-h-[34px]');
    expect(result).not.toContain('justify-between');
  });

  test('returns justify-between when jsonEditorEnabled is false', () => {
    const result = getViewHeaderClassNames(false);
    expect(result).toContain('justify-between');
    expect(result).toContain('flex');
    expect(result).toContain('flex-row');
    expect(result).toContain('min-h-[34px]');
    expect(result).not.toContain('justify-end');
  });

  test('returns justify-between when jsonEditorEnabled is undefined', () => {
    const result = getViewHeaderClassNames();
    expect(result).toContain('justify-between');
    expect(result).toContain('flex');
    expect(result).toContain('flex-row');
    expect(result).toContain('min-h-[34px]');
    expect(result).not.toContain('justify-end');
  });
});
