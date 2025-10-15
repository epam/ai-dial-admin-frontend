import { UpdateI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, it } from 'vitest';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '../update-entity';

describe('Update :: utils', () => {
  const tWithProps = (str: string, props?:s Record<string, string>) => str + ' with props';

  it('getUpdateNotificationTitle returns a string', () => {
    expect(getUpdateNotificationTitle(ApplicationRoute.Interceptors, tWithProps)).toBe(
      `${UpdateI18nKey.NotificationTitle} with props`,
    );
  });

  it('getUpdateNotificationDescription returns a string', () => {
    expect(getUpdateNotificationDescription(ApplicationRoute.Interceptors, 'aa', tWithProps)).toBe(
      `${UpdateI18nKey.NotificationDescription} with props`,
    );

     expect(getUpdateNotificationDescription(ApplicationRoute.Interceptors, void 0, tWithProps)).toBe(
      `${UpdateI18nKey.NotificationDescription} with props`,
    );
  });
});
