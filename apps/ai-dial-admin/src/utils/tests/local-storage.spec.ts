import { describe, expect, test, vi } from 'vitest';
import { getFromLocalStorage, setToLocalStorage } from '../local-storage';

describe('Utils :: Local Storage settings and getters', () => {
  global.localStorage = {
    getItem: () => 'ls-value',
    setItem: vi.fn(),
    clear: vi.fn(),
    removeItem: vi.fn(),
    key: vi.fn(),
    length: 0,
  };

  test('Should check empty key', () => {
    const res = getFromLocalStorage();

    expect(res).toBe('');
  });

  test('Should check set and get to local storage', () => {
    setToLocalStorage('ls-key', 'ls-value');

    expect(getFromLocalStorage('ls-key')).toBe('ls-value');
  });
});
