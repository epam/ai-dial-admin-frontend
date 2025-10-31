import { ErrorI18nKey } from '@/src/constants/i18n';
import { describe, expect, test } from 'vitest';
import { ErrorType } from '@/src/types/error-type';
import { getPromptVersionError, getVersionControlError } from '../version-error';

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

describe('getVersionControlError', () => {
  const t = (key: string) => key;
  test('returns Error if version does not exist but required', () => {
    expect(getVersionControlError('', false, false, t)).toStrictEqual({
      type: ErrorType.EMPTY,
      text: ErrorI18nKey.RequiredField,
    });

    expect(getVersionControlError('', false, false)).toStrictEqual({
      type: ErrorType.EMPTY,
      text: '',
    });
  });

  test('do not returns Error if version does not exist but required but hidden', () => {
    expect(getVersionControlError('', false, true, t)).toBe(null);
  });

  test('return Error if long value in field', () => {
    expect(getVersionControlError('1'.repeat(256), false, false, t)).toStrictEqual({
      type: ErrorType.LENGTH,
      text: ErrorI18nKey.Length,
    });

    expect(getVersionControlError('1'.repeat(256), false, false)).toStrictEqual({
      type: ErrorType.LENGTH,
      text: '',
    });
  });
});
