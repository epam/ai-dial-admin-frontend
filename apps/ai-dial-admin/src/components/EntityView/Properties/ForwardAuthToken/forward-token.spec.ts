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

describe('EntityProperties :: ForwardAuthToken :: getAlertTitlePerView', () => {
  it('Should return key for model', () => {
    const res = getAlertTitlePerView(ApplicationRoute.Models);

    expect(res).toBe(ForwardTokenI18nKey.UseForThisModel);
  });

  it('Should return key for application', () => {
    const res = getAlertTitlePerView(ApplicationRoute.Applications);

    expect(res).toBe(ForwardTokenI18nKey.UseForThisApplication);
  });

  it('Should return key for addon', () => {
    const res = getAlertTitlePerView(ApplicationRoute.Addons);

    expect(res).toBe(ForwardTokenI18nKey.UseForThisAddon);
  });

  it('Should return key for Interceptor', () => {
    const res = getAlertTitlePerView(ApplicationRoute.Interceptors);

    expect(res).toBe(ForwardTokenI18nKey.UseForThisInterceptor);
  });

  it('Should return empty string', () => {
    const res = getAlertTitlePerView(ApplicationRoute.Keys);

    expect(res).toBe('');
  });
});

describe('EntityProperties :: ForwardAuthToken :: getDisplayNamePerView', () => {
  it('Should return key for model', () => {
    const res = getDisplayNamePerView(ApplicationRoute.Models);

    expect(res).toBe(CreateI18nKey.ModelDisplayName);
  });

  it('Should return key for application', () => {
    const res = getDisplayNamePerView(ApplicationRoute.Applications);

    expect(res).toBe(CreateI18nKey.ApplicationDisplayName);
  });

  it('Should return key for addon', () => {
    const res = getDisplayNamePerView(ApplicationRoute.Addons);

    expect(res).toBe(CreateI18nKey.AddonsDisplayName);
  });

  it('Should return key for interceptor', () => {
    const res = getDisplayNamePerView(ApplicationRoute.Interceptors);

    expect(res).toBe(CreateI18nKey.InterceptorName);
  });

  it('Should return empty string', () => {
    const res = getDisplayNamePerView(ApplicationRoute.Keys);

    expect(res).toBe('');
  });
});

describe('EntityProperties :: ForwardAuthToken :: isForwardToken', () => {
  it('Should return true', () => {
    const res = isForwardTokenFalse(NONE_ID);

    expect(res).toBeTruthy();
  });

  it('Should return true', () => {
    const res = isForwardTokenTrue(USE_ID);

    expect(res).toBeTruthy();
  });
});
