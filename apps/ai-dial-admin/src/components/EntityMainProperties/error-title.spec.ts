import { CreateI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { getDisplayNameErrorKeyPerView, getVersionErrorKeyPerView } from './error-title';

describe('EntityMainProperties :: errors :: getDisplayNameErrorKeyPerView', () => {
  it('Should return key for model', () => {
    const res = getDisplayNameErrorKeyPerView(ApplicationRoute.Models);

    expect(res).toBe(CreateI18nKey.DisplayNameErrorModel);
  });

  it('Should return key for application', () => {
    const res = getDisplayNameErrorKeyPerView(ApplicationRoute.Applications);

    expect(res).toBe(CreateI18nKey.DisplayNameErrorApplication);
  });

  it('Should return key for addon', () => {
    const res = getDisplayNameErrorKeyPerView(ApplicationRoute.Addons);

    expect(res).toBe(CreateI18nKey.DisplayNameErrorAddon);
  });

  it('Should return empty string', () => {
    const res = getDisplayNameErrorKeyPerView(ApplicationRoute.Keys);

    expect(res).toBe('');
  });
});

describe('EntityMainProperties :: errors :: getVersionErrorKeyPerView', () => {
  it('Should return key for model', () => {
    const res = getVersionErrorKeyPerView(ApplicationRoute.Models);

    expect(res).toBe(CreateI18nKey.VersionErrorModel);
  });

  it('Should return key for application', () => {
    const res = getVersionErrorKeyPerView(ApplicationRoute.Applications);

    expect(res).toBe(CreateI18nKey.VersionErrorApplication);
  });

  it('Should return key for addon', () => {
    const res = getVersionErrorKeyPerView(ApplicationRoute.Addons);

    expect(res).toBe(CreateI18nKey.VersionErrorAddon);
  });

  it('Should return empty string', () => {
    const res = getVersionErrorKeyPerView(ApplicationRoute.Keys);

    expect(res).toBe('');
  });
});
