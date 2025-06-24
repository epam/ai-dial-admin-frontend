import { CreateI18nKey, ForwardTokenI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getAlertTitlePerView,
  getDisplayNamePerView,
  isForwardTokenFalse,
  isForwardTokenTrue,
  NONE_ID,
  USE_ID,
} from './forward-token';
import { describe, expect, test } from 'vitest';

describe('EntityProperties :: ForwardAuthToken :: getAlertTitlePerView', () => {
  test('Should return key for model', () => {
    const res = getAlertTitlePerView(ApplicationRoute.Models);

    expect(res).toBe(ForwardTokenI18nKey.UseForThisModel);
  });

  test('Should return key for application', () => {
    const res = getAlertTitlePerView(ApplicationRoute.Applications);

    expect(res).toBe(ForwardTokenI18nKey.UseForThisApplication);
  });

  test('Should return key for addon', () => {
    const res = getAlertTitlePerView(ApplicationRoute.Addons);

    expect(res).toBe(ForwardTokenI18nKey.UseForThisAddon);
  });

  test('Should return key for Interceptor', () => {
    const res = getAlertTitlePerView(ApplicationRoute.Interceptors);

    expect(res).toBe(ForwardTokenI18nKey.UseForThisInterceptor);
  });

  test('Should return empty string', () => {
    const res = getAlertTitlePerView(ApplicationRoute.Keys);

    expect(res).toBe('');
  });
});

describe('EntityProperties :: ForwardAuthToken :: getDisplayNamePerView', () => {
  test('Should return key for model', () => {
    const res = getDisplayNamePerView(ApplicationRoute.Models);

    expect(res).toBe(CreateI18nKey.ModelDisplayName);
  });

  test('Should return key for application', () => {
    const res = getDisplayNamePerView(ApplicationRoute.Applications);

    expect(res).toBe(CreateI18nKey.ApplicationDisplayName);
  });

  test('Should return key for addon', () => {
    const res = getDisplayNamePerView(ApplicationRoute.Addons);

    expect(res).toBe(CreateI18nKey.AddonsDisplayName);
  });

  test('Should return key for interceptor', () => {
    const res = getDisplayNamePerView(ApplicationRoute.Interceptors);

    expect(res).toBe(CreateI18nKey.InterceptorName);
  });

  test('Should return empty string', () => {
    const res = getDisplayNamePerView(ApplicationRoute.Keys);

    expect(res).toBe('');
  });
});

describe('EntityProperties :: ForwardAuthToken :: isForwardToken', () => {
  test('Should return true', () => {
    const res = isForwardTokenFalse(NONE_ID);

    expect(res).toBeTruthy();
  });

  test('Should return true', () => {
    const res = isForwardTokenTrue(USE_ID);

    expect(res).toBeTruthy();
  });
});
