import { ErrorI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import {  getDisplayNameError, getVersionError } from '../utils';
import { describe, expect, test } from 'vitest';

const mockT = (key: string, params?: Record<string, number>) => {
  if (params) {
    return `${key}`;
  }
  return key;
};


describe('EntityMainProperties :: errors :: getDisplayNameError', () => {
  test('Should return no error if valid display name', () => {
    const result = getDisplayNameError(ApplicationRoute.Models, true, 'ValidName', mockT);
    expect(result).toBe('');
  });

  test('Should return min/max length error for wrong length display name', () => {
    const result = getDisplayNameError(ApplicationRoute.Models, false, 'a', mockT);
    expect(result).toBe(ErrorI18nKey.MinMaxLength);
  });

  test('Should return view-specific error if not wrong length', () => {
    const longValidName = 'ValidDisplayNameWithinLength';
    const result = getDisplayNameError(ApplicationRoute.Applications, false, longValidName, mockT);
    expect(result).toBe(ErrorI18nKey.Unique);
  });
});

describe('EntityMainProperties :: errors :: getVersionError', () => {
  test('Should return empty if version is optional', () => {
    const result = getVersionError(ApplicationRoute.Models, true, '', mockT);
    expect(result).toBe('');
  });

  test('Should return missing version error if required but not provided', () => {
    const result = getVersionError(ApplicationRoute.Models, false, '', mockT);
    expect(result).toBe(ErrorI18nKey.Version);
  });

  test('Should return min/max length error if version is too short/long', () => {
    const result = getVersionError(ApplicationRoute.Models, false, 'x', mockT);
    expect(result).toBe(ErrorI18nKey.MinMaxLength);
  });

  test('Should return empty if version is valid', () => {
    const result = getVersionError(ApplicationRoute.Models, false, '1.2.3', mockT);
    expect(result).toBe('');
  });
});
