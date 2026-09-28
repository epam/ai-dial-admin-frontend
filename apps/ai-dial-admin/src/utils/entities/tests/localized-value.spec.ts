import { describe, expect, test } from 'vitest';

import { LocalizedText } from '@/src/models/dial/localized';
import { FALLBACK_LOCALE, isLocalizedMap, resolveLocalizedText } from '../localized-value';

describe('isLocalizedMap', () => {
  test('recognizes a locale map', () => {
    expect(isLocalizedMap({ en: 'Hello' })).toBe(true);
  });

  test.each([
    ['a plain string', 'Hello'],
    ['undefined', undefined],
  ])('rejects %s', (_label, value) => {
    expect(isLocalizedMap(value as LocalizedText)).toBe(false);
  });

  test('rejects an array, which is not a locale map', () => {
    expect(isLocalizedMap([] as unknown as LocalizedText)).toBe(false);
  });
});

describe('resolveLocalizedText', () => {
  test('returns a plain string unchanged', () => {
    expect(resolveLocalizedText('Hello')).toEqual('Hello');
  });

  test('returns undefined for no value', () => {
    expect(resolveLocalizedText(undefined)).toBeUndefined();
  });

  test('prefers the fallback locale', () => {
    expect(resolveLocalizedText({ fr: 'Bonjour', [FALLBACK_LOCALE]: 'Hello' })).toEqual('Hello');
  });

  test('falls back to the first entry when the fallback locale is absent', () => {
    expect(resolveLocalizedText({ fr: 'Bonjour', de: 'Hallo' })).toEqual('Bonjour');
  });

  test('returns undefined for an empty map rather than an empty object', () => {
    expect(resolveLocalizedText({})).toBeUndefined();
  });

  test('ignores a non-string entry rather than rendering it', () => {
    expect(resolveLocalizedText({ fr: 7 } as unknown as LocalizedText)).toBeUndefined();
  });
});
