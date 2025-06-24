import { CreateI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { getDisplayNameErrorKeyPerView, getVersionErrorKeyPerView } from './error-title';
import { describe, expect, test } from 'vitest';

describe('EntityMainProperties :: errors :: getDisplayNameErrorKeyPerView', () => {
  test('Should return key for model', () => {
    const res = getDisplayNameErrorKeyPerView(ApplicationRoute.Models);

    expect(res).toBe(CreateI18nKey.DisplayNameErrorModel);
  });

  test('Should return key for application', () => {
    const res = getDisplayNameErrorKeyPerView(ApplicationRoute.Applications);

    expect(res).toBe(CreateI18nKey.DisplayNameErrorApplication);
  });

  test('Should return key for addon', () => {
    const res = getDisplayNameErrorKeyPerView(ApplicationRoute.Addons);

    expect(res).toBe(CreateI18nKey.DisplayNameErrorAddon);
  });

  test('Should return empty string', () => {
    const res = getDisplayNameErrorKeyPerView(ApplicationRoute.Keys);

    expect(res).toBe('');
  });
});

describe('EntityMainProperties :: errors :: getVersionErrorKeyPerView', () => {
  test('Should return key for model', () => {
    const res = getVersionErrorKeyPerView(ApplicationRoute.Models);

    expect(res).toBe(CreateI18nKey.VersionErrorModel);
  });

  test('Should return key for application', () => {
    const res = getVersionErrorKeyPerView(ApplicationRoute.Applications);

    expect(res).toBe(CreateI18nKey.VersionErrorApplication);
  });

  test('Should return key for addon', () => {
    const res = getVersionErrorKeyPerView(ApplicationRoute.Addons);

    expect(res).toBe(CreateI18nKey.VersionErrorAddon);
  });

  test('Should return empty string', () => {
    const res = getVersionErrorKeyPerView(ApplicationRoute.Keys);

    expect(res).toBe('');
  });
});
