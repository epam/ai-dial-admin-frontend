import { ErrorI18nKey } from '@/src/constants/i18n';
import { describe, expect, test } from 'vitest';
import { getPromptVersionError } from '../version-error';

describe('getPromptVersionError', () => {
  const t = (key: string) => key;

  test('returns NameVersionCombination if version exists in versionsMap for name', () => {
    const versionsMap = { foo: ['1.0', '2.0'] };
    const entity = { name: 'foo' };
    expect(getPromptVersionError(versionsMap, entity as any, t, '1.0')).toBe(ErrorI18nKey.NameVersionCombination);
  });

  test('returns NameVersionCombination if versionsMap is undefined', () => {
    const entity = { name: 'foo' };
    expect(getPromptVersionError(undefined, entity as any, t, '1.0')).toBe(ErrorI18nKey.NameVersionCombination);
  });

  test('returns NameVersionCombination if name is missing', () => {
    const versionsMap = { foo: ['1.0'] };
    const entity = { name: 'foo' };
    expect(getPromptVersionError(versionsMap, entity as any, t, '1.0')).toBe(ErrorI18nKey.NameVersionCombination);
  });

  test('returns EmptyField if version is not provided and versionsMap is valid', () => {
    const versionsMap = { foo: ['1.0'] };
    const entity = { name: 'foo' };
    expect(getPromptVersionError(versionsMap, entity as any, t, '')).toBe(ErrorI18nKey.EmptyField);
    expect(getPromptVersionError(versionsMap, entity as any, t)).toBe(ErrorI18nKey.EmptyField);
  });

  test('returns undefined if version is provided and not in versionsMap', () => {
    const versionsMap = { foo: ['1.0'] };
    const entity = { name: 'foo' };
    expect(getPromptVersionError(versionsMap, entity as any, t, '2.0')).toBeUndefined();
  });
});
