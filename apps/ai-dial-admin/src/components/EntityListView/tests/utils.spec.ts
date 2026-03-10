import { exportFiles } from '@/src/app/[lang]/files/actions';
import { exportPrompts } from '@/src/app/[lang]/prompts/actions';
import { MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { getExportFunction, getNotificationType } from '../utils';
import { exportApps } from '@/src/app/[lang]/assets-applications/actions';
import { exportToolsets } from '@/src/app/[lang]/assets-toolsets/actions';

describe('getNotificationType', () => {
  test('should return MenuI18nKey.Prompts when route is Prompts', () => {
    const result = getNotificationType(ApplicationRoute.Prompts);
    expect(result).toBe(MenuI18nKey.Prompts);
  });

  test('should return MenuI18nKey.Files when route is Files', () => {
    const result = getNotificationType(ApplicationRoute.Files);
    expect(result).toBe(MenuI18nKey.Files);
  });

  test('should return MenuI18nKey.Applications when route is AssetsApplications', () => {
    const result = getNotificationType(ApplicationRoute.AssetsApplications);
    expect(result).toBe(MenuI18nKey.Applications);
  });

  test('should return MenuI18nKey.Applications when route is AssetsToolsets', () => {
    const result = getNotificationType(ApplicationRoute.AssetsToolsets);
    expect(result).toBe(MenuI18nKey.Toolsets);
  });

  test('should return an empty string when route is undefined or not matching any of the routes', () => {
    const resultWithUndefinedRoute = getNotificationType();
    const resultWithUnknownRoute = getNotificationType('SomeOtherRoute' as ApplicationRoute);

    expect(resultWithUndefinedRoute).toBe('');
    expect(resultWithUnknownRoute).toBe('');
  });
});

describe('getExportFunction', () => {
  test('should return exportPrompts when route is Prompts', () => {
    const result = getExportFunction(ApplicationRoute.Prompts);
    expect(result).toBe(exportPrompts);
  });

  test('should return exportFiles when route is Files', () => {
    const result = getExportFunction(ApplicationRoute.Files);
    expect(result).toBe(exportFiles);
  });

  test('should return exportApps when route is AssetsApplications', () => {
    const result = getExportFunction(ApplicationRoute.AssetsApplications);
    expect(result).toBe(exportApps);
  });

  test('should return exportToolsets when route is AssetsApplications', () => {
    const result = getExportFunction(ApplicationRoute.AssetsToolsets);
    expect(result).toBe(exportToolsets);
  });

  test('should return null when route is undefined or does not match any known route', () => {
    const resultWithUndefinedRoute = getExportFunction();
    const resultWithUnknownRoute = getExportFunction('SomeOtherRoute' as ApplicationRoute);

    expect(resultWithUndefinedRoute).toBeNull();
    expect(resultWithUnknownRoute).toBeNull();
  });
});
