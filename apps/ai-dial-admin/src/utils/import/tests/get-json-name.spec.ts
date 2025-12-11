import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { getJsonFileName } from '../get-json-name';

describe('getJsonFileName', () => {
  test('should return "prompts" when route is Prompts', () => {
    const result = getJsonFileName(ApplicationRoute.Prompts);
    expect(result).toBe('prompts');
  });

  test('should return "files" when route is Files', () => {
    const result = getJsonFileName(ApplicationRoute.Files);
    expect(result).toBe('files');
  });

  test('should return "applications" when route is AssetsApplications', () => {
    const result = getJsonFileName(ApplicationRoute.AssetsApplications);
    expect(result).toBe('applications');
  });

  test('should return "toolsets" when route is AssetsToolsets', () => {
    const result = getJsonFileName(ApplicationRoute.AssetsToolsets);
    expect(result).toBe('toolSets');
  });

  test('should return an empty string when route is undefined or does not match any known route', () => {
    const resultWithUndefinedRoute = getJsonFileName();
    const resultWithUnknownRoute = getJsonFileName('SomeOtherRoute' as ApplicationRoute);

    expect(resultWithUndefinedRoute).toBe('');
    expect(resultWithUnknownRoute).toBe('');
  });
});
