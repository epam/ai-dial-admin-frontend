import { getBreadcrumbs } from '@/src/components/Breadcrumbs/Breadcrumbs.utils';
import { MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

describe('Breadcrumbs :: getBreadcrumbConfig with language in path', () => {
  it('Should correctly return Breadcrumbs config', () => {
    const config = getBreadcrumbs('/en/models', 'en');
    expect(config.length).toEqual(1);
    expect(config[0].href).toEqual('/en/models');
    expect(config[0].key).toEqual(MenuI18nKey.Models);
    expect(config[0].name).toEqual('models');
  });

  it('Should correctly return Breadcrumbs config without language in path', () => {
    const config = getBreadcrumbs('/models', 'en');
    expect(config.length).toEqual(1);
    expect(config[0].href).toEqual('/models');
    expect(config[0].key).toEqual(MenuI18nKey.Models);
    expect(config[0].name).toEqual('models');
  });

  it('Should correctly return correct config with unknown route', () => {
    const config = getBreadcrumbs('/unknown', 'en');
    expect(config.length).toEqual(1);
    expect(config[0].href).toEqual('/unknown');
    expect(config[0].key).toBeFalsy();
    expect(config[0].name).toEqual('unknown');
  });

  it('Should return empty array for home page', () => {
    const config = getBreadcrumbs('/home', 'en');
    expect(config.length).toEqual(0);
  });

  it('Should correctly return config with no href items', () => {
    const config = getBreadcrumbs('/en/applications/applicationId', 'en');
    expect(config.length).toEqual(2);
    expect(config[1].href).toBeFalsy();
    expect(config[1].key).toBeFalsy();
    expect(config[1].name).toEqual('applicationId');
  });
});
