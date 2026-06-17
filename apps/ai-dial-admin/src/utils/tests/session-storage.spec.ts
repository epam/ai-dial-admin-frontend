import { describe, expect, test, vi } from 'vitest';
import { getFromSessionStorage, setToSessionStorage } from '../session-storage';

describe('Utils :: Session Storage', () => {
  global.sessionStorage = {
    getItem: () => 'ss-value',
    setItem: vi.fn(),
    clear: vi.fn(),
    removeItem: vi.fn(),
    key: vi.fn(),
    length: 0,
  };

  describe('getFromSessionStorage', () => {
    test('returns empty string when key is undefined', () => {
      expect(getFromSessionStorage()).toBe('');
    });

    test('returns value from sessionStorage for a given key', () => {
      setToSessionStorage('ss-key', 'ss-value');

      expect(getFromSessionStorage('ss-key')).toBe('ss-value');
    });
  });

});
