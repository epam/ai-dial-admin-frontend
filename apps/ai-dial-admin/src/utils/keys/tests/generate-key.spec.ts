import { describe, expect, test } from 'vitest';

import { generateKey } from '../generate-key';

describe('generateKey', () => {
  test('Returns a 64-character lowercase hex string', () => {
    const key = generateKey();

    expect(key).toHaveLength(64);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  test('Returns a different value on each call', () => {
    const key1 = generateKey();
    const key2 = generateKey();

    expect(key1).not.toBe(key2);
  });

  test('Never returns an empty string', () => {
    const key = generateKey();

    expect(key.length).toBeGreaterThan(0);
  });
});
