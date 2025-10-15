import { CreateI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, it } from 'vitest';
import { getCreateEntityTitle, getCreateNotificationDescription, getCreateNotificationTitle } from '../create-entity';

describe('Create :: utils', () => {
  const tWithProps = (str: string, props?: Record<string, string>) => str + ' with props';

  it('getCreateEntityTitle returns a string', () => {
    expect(getCreateEntityTitle(ApplicationRoute.Applications, tWithProps)).toBe(`${CreateI18nKey.Title} with props`);
  });

  it('getCreateNotificationTitle returns a string', () => {
    expect(getCreateNotificationTitle(ApplicationRoute.Interceptors, tWithProps)).toBe(
      `${CreateI18nKey.NotificationTitle} with props`,
    );
  });

  it('getCreateNotificationDescription returns a string', () => {
    expect(getCreateNotificationDescription(ApplicationRoute.Interceptors, 'aa', tWithProps)).toBe(
      `${CreateI18nKey.NotificationDescription} with props`,
    );

    expect(getCreateNotificationDescription(ApplicationRoute.Interceptors, void 0, tWithProps)).toBe(
      `${CreateI18nKey.NotificationDescription} with props`,
    );
  });
});
