import { exportFiles } from '@/src/app/[lang]/files/actions';
import { exportPrompts } from '@/src/app/[lang]/prompts/actions';
import { MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, it } from 'vitest';
import { getExportFunction, getJsonFileName, getNotificationType } from '../utils';

describe('getNotificationType', () => {
  it('should return MenuI18nKey.Prompts when route is Prompts', () => {
    const result = getNotificationType(ApplicationRoute.Prompts);
    expect(result).toBe(MenuI18nKey.Prompts);
  });

  it('should return MenuI18nKey.Files when route is Files', () => {
    const result = getNotificationType(ApplicationRoute.Files);
    expect(result).toBe(MenuI18nKey.Files);
  });

  it('should return MenuI18nKey.Applications when route is AssetsApplications', () => {
    const result = getNotificationType(ApplicationRoute.AssetsApplications);
    expect(result).toBe(MenuI18nKey.Applications);
  });

  it('should return MenuI18nKey.Applications when route is AssetsToolsets', () => {
    const result = getNotificationType(ApplicationRoute.AssetsToolsets);
    expect(result).toBe(MenuI18nKey.Toolsets);
  });

  it('should return an empty string when route is undefined or not matching any of the routes', () => {
    const resultWithUndefinedRoute = getNotificationType();
    const resultWithUnknownRoute = getNotificationType('SomeOtherRoute' as ApplicationRoute);

    expect(resultWithUndefinedRoute).toBe('');
    expect(resultWithUnknownRoute).toBe('');
  });
});

describe('getExportFunction', () => {
  it('should return exportPrompts when route is Prompts', () => {
    const result = getExportFunction(ApplicationRoute.Prompts);
    expect(result).toBe(exportPrompts);
  });

  it('should return exportFiles when route is Files', () => {
    const result = getExportFunction(ApplicationRoute.Files);
    expect(result).toBe(exportFiles);
  });

  it('should return null when route is undefined or does not match any known route', () => {
    const resultWithUndefinedRoute = getExportFunction();
    const resultWithUnknownRoute = getExportFunction('SomeOtherRoute' as ApplicationRoute);

    expect(resultWithUndefinedRoute).toBeNull();
    expect(resultWithUnknownRoute).toBeNull();
  });
});

describe('getJsonFileName', () => {
  it('should return "prompts" when route is Prompts', () => {
    const result = getJsonFileName(ApplicationRoute.Prompts);
    expect(result).toBe('prompts');
  });

  it('should return "files" when route is Files', () => {
    const result = getJsonFileName(ApplicationRoute.Files);
    expect(result).toBe('files');
  });

  it('should return "applications" when route is AssetsApplications', () => {
    const result = getJsonFileName(ApplicationRoute.AssetsApplications);
    expect(result).toBe('applications');
  });

  it('should return "toolsets" when route is AssetsToolsets', () => {
    const result = getJsonFileName(ApplicationRoute.AssetsToolsets);
    expect(result).toBe('toolsets');
  });

  it('should return an empty string when route is undefined or does not match any known route', () => {
    const resultWithUndefinedRoute = getJsonFileName();
    const resultWithUnknownRoute = getJsonFileName('SomeOtherRoute' as ApplicationRoute);

    expect(resultWithUndefinedRoute).toBe('');
    expect(resultWithUnknownRoute).toBe('');
  });
});
