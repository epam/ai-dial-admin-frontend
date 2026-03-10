import { ErrorI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { getDisplayNameError, getVersionError } from '../utils';
import { describe, expect, test } from 'vitest';

const mockT = (key: string, params?: Record<string, number>) => {
  if (params) {
    return `${key}`;
  }
  return key;
};

describe('EntityMainProperties :: errors :: getDisplayNameError', () => {
  test('returns MinMaxLength error if name is too short', () => {
    const result = getDisplayNameError(ApplicationRoute.Models, '', ['foo'], mockT);
    expect(result).toBe(ErrorI18nKey.MinMaxLength);
  });

  test('returns DisplayNameErrorVersion if view is Models, name exists in names, and no version', () => {
    const result = getDisplayNameError(ApplicationRoute.Models, 'foo', ['foo', 'bar'], mockT, '');
    expect(result).toBe(ErrorI18nKey.DisplayNameErrorVersion);
  });

  test('returns empty string if view is Models, name exists in names, but version is present', () => {
    const result = getDisplayNameError(ApplicationRoute.Models, 'foo', ['foo', 'bar'], mockT, '1.0');
    expect(result).toBe('');
  });

  test('returns empty string if view is Models, name does not exist in names', () => {
    const result = getDisplayNameError(ApplicationRoute.Models, 'baz', ['foo', 'bar'], mockT, '');
    expect(result).toBe('');
  });

  test('returns empty string for non-Models view', () => {
    const result = getDisplayNameError('other' as unknown as ApplicationRoute, 'foo', ['foo', 'bar'], mockT, '');
    expect(result).toBe('');
  });
});

describe('EntityMainProperties :: errors :: getVersionError', () => {
  test('Should return empty if version is optional', () => {
    const result = getVersionError(true, {}, {}, mockT);
    expect(result).toBe('');
  });

  test('Should return missing version error if required but not provided', () => {
    const result = getVersionError(false, {}, {}, mockT);
    expect(result).toBe(ErrorI18nKey.Version);
  });

  test('Should return empty if version is valid', () => {
    const result = getVersionError(
      false,
      { displayVersion: '1.2.3', displayName: 'model' },
      { model: ['1.2.3'] },
      mockT,
    );
    expect(result).toBe(ErrorI18nKey.Unique);
  });
});
