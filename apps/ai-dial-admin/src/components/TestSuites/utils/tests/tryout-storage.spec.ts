import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  TEST_SUITES_TRYOUT_STORAGE_KEY,
  getTryoutResponseFromStorage,
  removeTryoutResponseFromStorage,
  saveTryoutResponseToStorage,
} from '../tryout-storage';

describe('saveTryoutResponseToStorage', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should store response under testSuiteId in new map', () => {
    saveTryoutResponseToStorage('suite-1', { statusCode: 200, data: 'ok' });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      TEST_SUITES_TRYOUT_STORAGE_KEY,
      JSON.stringify({ 'suite-1': { statusCode: 200, data: 'ok' } }),
    );
    expect(localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY]).toBe(
      JSON.stringify({ 'suite-1': { statusCode: 200, data: 'ok' } }),
    );
  });

  test('should store undefined response (key omitted in JSON)', () => {
    saveTryoutResponseToStorage('suite-2', undefined);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      TEST_SUITES_TRYOUT_STORAGE_KEY,
      JSON.stringify({}),
    );
  });

  test('should merge with existing map when key already exists in storage', () => {
    localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY] = JSON.stringify({
      'suite-a': { statusCode: 201 },
    });

    saveTryoutResponseToStorage('suite-b', { statusCode: 200 });

    expect(localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY]).toBe(
      JSON.stringify({
        'suite-a': { statusCode: 201 },
        'suite-b': { statusCode: 200 },
      }),
    );
  });

  test('should overwrite existing entry for same testSuiteId', () => {
    localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY] = JSON.stringify({
      'suite-1': { statusCode: 500, error: 'old' },
    });

    saveTryoutResponseToStorage('suite-1', { statusCode: 200, data: 'new' });

    expect(localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY]).toBe(
      JSON.stringify({ 'suite-1': { statusCode: 200, data: 'new' } }),
    );
  });

  test('should not throw when getItem returns invalid JSON', () => {
    localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY] = 'not valid json';

    expect(() => {
      saveTryoutResponseToStorage('suite-1', { statusCode: 200 });
    }).not.toThrow();
  });

  test('should not throw when setItem throws', () => {
    vi.mocked(localStorage.setItem).mockImplementationOnce(() => {
      throw new Error('QuotaExceeded');
    });

    expect(() => {
      saveTryoutResponseToStorage('suite-1', { statusCode: 200 });
    }).not.toThrow();
  });
});

describe('getTryoutResponseFromStorage', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should return stored response for existing testSuiteId', () => {
    const response = { statusCode: 200, data: 'ok' };
    localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY] = JSON.stringify({
      'suite-1': response,
    });

    const result = getTryoutResponseFromStorage('suite-1');

    expect(result).toEqual(response);
  });

  test('should return undefined when testSuiteId is not in storage', () => {
    localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY] = JSON.stringify({
      'other-suite': { statusCode: 201 },
    });

    const result = getTryoutResponseFromStorage('suite-1');

    expect(result).toBeUndefined();
  });

  test('should return undefined when storage key is missing', () => {
    const result = getTryoutResponseFromStorage('suite-1');

    expect(result).toBeUndefined();
  });

  test('should return undefined when stored value for testSuiteId is null', () => {
    localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY] = JSON.stringify({
      'suite-1': null,
    });

    const result = getTryoutResponseFromStorage('suite-1');

    expect(result).toBeUndefined();
  });

  test('should return correct response when map has multiple entries', () => {
    const responseB = { statusCode: 200, id: 'b' };
    localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY] = JSON.stringify({
      'suite-a': { statusCode: 201, id: 'a' },
      'suite-b': responseB,
      'suite-c': { statusCode: 500 },
    });

    const result = getTryoutResponseFromStorage('suite-b');

    expect(result).toEqual(responseB);
  });

  test('should return undefined when getItem returns invalid JSON', () => {
    localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY] = 'not valid json';

    const result = getTryoutResponseFromStorage('suite-1');

    expect(result).toBeUndefined();
  });

  test('should return undefined when getItem throws', () => {
    vi.mocked(localStorage.getItem).mockImplementationOnce(() => {
      throw new Error('Storage unavailable');
    });

    const result = getTryoutResponseFromStorage('suite-1');

    expect(result).toBeUndefined();
  });
});

describe('removeTryoutResponseFromStorage', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should remove entry for testSuiteId from storage', () => {
    localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY] = JSON.stringify({
      'suite-1': { statusCode: 200 },
      'suite-2': { statusCode: 201 },
    });

    removeTryoutResponseFromStorage('suite-1');

    expect(localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY]).toBe(JSON.stringify({ 'suite-2': { statusCode: 201 } }));
  });

  test('should leave other entries when removing one', () => {
    localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY] = JSON.stringify({
      'suite-a': { statusCode: 200 },
      'suite-b': { statusCode: 201 },
    });

    removeTryoutResponseFromStorage('suite-a');

    expect(JSON.parse(localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY])).toEqual({
      'suite-b': { statusCode: 201 },
    });
  });

  test('should not throw when storage is empty or key missing', () => {
    expect(() => removeTryoutResponseFromStorage('suite-1')).not.toThrow();
  });

  test('should not throw when getItem returns invalid JSON', () => {
    localStorageMock[TEST_SUITES_TRYOUT_STORAGE_KEY] = 'not valid json';

    expect(() => removeTryoutResponseFromStorage('suite-1')).not.toThrow();
  });
});
