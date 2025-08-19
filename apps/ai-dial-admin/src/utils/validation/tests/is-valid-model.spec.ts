import { describe, expect, test, vi } from 'vitest';
import { isValidUpstreams } from '../is-valid-model';

describe('isValidUpstreams', () => {
  test('returns true if upstreams is void 0', () => {
    expect(isValidUpstreams(void 0)).toBe(true);
  });

  test('returns true if upstreams is empty array', () => {
    expect(isValidUpstreams([])).toBe(true);
  });

  test('returns true if all upstreams have valid endpoints', () => {
    const upstreams = [{ endpoint: 'http://valid.com' }, { endpoint: 'https://another.com' }];
    expect(isValidUpstreams(upstreams)).toBe(true);
  });

  test('returns false if any upstream has invalid endpoint', () => {
    const upstreams = [{ endpoint: 'http://valid.com' }, { endpoint: 'invalid-url' }];
    expect(isValidUpstreams(upstreams)).toBe(false);
  });

  test('returns true if endpoint is empty string or falsy', () => {
    const upstreams = [{ endpoint: '' }, { endpoint: null }, { endpoint: void 0 }];
    expect(isValidUpstreams(upstreams)).toBe(true);
  });
});
