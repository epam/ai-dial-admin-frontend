import { describe, expect, test } from 'vitest';

import * as i18nEnums from '@/src/constants/i18n';
import en from '@/src/locales/en';

// The enums are the inventory: a key is added there and used through `t()`, so a translation that was
// never written shows up in the console as the raw key and in no test — the mocked `t()` in a component
// spec returns the key whether or not `en.ts` carries one. Reading the enums back is what catches it.
const declaredKeys = Object.values(i18nEnums)
  .flatMap((member) => (typeof member === 'object' && member !== null ? Object.values(member) : []))
  .filter((key): key is string => typeof key === 'string');

// A pluralised key is stored as one entry per CLDR category (`Key#other`), and `t()` picks among them by
// count, so the bare key is never a member of the file.
const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'];

const read = (key: string): unknown =>
  key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], en);

const resolve = (key: string): unknown => {
  const direct = read(key);
  if (direct != null) return direct;

  const plural = PLURAL_CATEGORIES.map((category) => read(`${key}#${category}`)).find((value) => value != null);
  return plural;
};

describe('en locale', () => {
  test('carries a translation for every key the i18n enums declare', () => {
    expect(declaredKeys.filter((key) => typeof resolve(key) !== 'string')).toEqual([]);
  });

  test('declares the keys it is asked for', () => {
    expect(declaredKeys.length).toBeGreaterThan(0);
  });
});
