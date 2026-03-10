import { UpdateI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '../update-entity';

describe('Update :: utils', () => {
  const tWithProps = (str: string, props?: Record<string, string>) => str + ' with props';

  test('getUpdateNotificationTitle returns a string', () => {
    expect(getUpdateNotificationTitle(ApplicationRoute.Interceptors, tWithProps)).toBe(
      `${UpdateI18nKey.NotificationTitle} with props`,
    );
  });

  test('getUpdateNotificationDescription returns a string', () => {
    expect(getUpdateNotificationDescription(ApplicationRoute.Interceptors, 'aa', tWithProps)).toBe(
      `${UpdateI18nKey.NotificationDescription} with props`,
    );

    expect(getUpdateNotificationDescription(ApplicationRoute.Interceptors, void 0, tWithProps)).toBe(
      `${UpdateI18nKey.NotificationDescription} with props`,
    );
  });

  test('getUpdateNotificationDescription returns a string', () => {
    expect(getUpdateNotificationDescription(ApplicationRoute.AssetsApplications, 'aa', tWithProps)).toBe(
      `${UpdateI18nKey.NotificationDescriptionWithoutRollback} with props`,
    );

    expect(getUpdateNotificationDescription(ApplicationRoute.AssetsApplications, void 0, tWithProps)).toBe(
      `${UpdateI18nKey.NotificationDescriptionWithoutRollback} with props`,
    );

    expect(getUpdateNotificationDescription(ApplicationRoute.TestSuites, void 0, tWithProps)).toBe(
      `${UpdateI18nKey.NotificationDescriptionWithoutRollback} with props`,
    );
  });
});
