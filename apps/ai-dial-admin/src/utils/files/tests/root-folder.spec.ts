import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import {
  getConfigFileEntityType,
  getRootFolder,
  isFlatPlatformView,
  isNestedPlatformView,
  isPlatformBucketPath,
  isPlatformBucketView,
  PLATFORM_ROOT_FOLDER,
} from '../root-folder';

describe('Root Folder Utils :: getRootFolder', () => {
  test.each([
    ApplicationRoute.PlatformModels,
    ApplicationRoute.PlatformAppRunners,
    ApplicationRoute.PlatformCatalogSchemas,
    ApplicationRoute.PlatformInterceptors,
    ApplicationRoute.PlatformRoutes,
    ApplicationRoute.PlatformRoles,
  ])('Should return "platform" for %s view', (view) => {
    expect(getRootFolder(view)).toEqual('platform');
    expect(getRootFolder(view)).toEqual(PLATFORM_ROOT_FOLDER);
  });

  test.each([
    ApplicationRoute.AssetsApplications,
    ApplicationRoute.AssetsToolsets,
    ApplicationRoute.Prompts,
    ApplicationRoute.Conversations,
    ApplicationRoute.Files,
  ])('Should return "public" for %s view', (view) => {
    expect(getRootFolder(view)).toEqual('public');
  });
});

describe('Root Folder Utils :: isFlatPlatformView', () => {
  test.each([
    ApplicationRoute.PlatformModels,
    ApplicationRoute.PlatformAppRunners,
    ApplicationRoute.PlatformCatalogSchemas,
    ApplicationRoute.PlatformInterceptors,
    ApplicationRoute.PlatformRoutes,
    ApplicationRoute.PlatformRoles,
  ])('Should treat %s as flat, since Core stores it in one fixed bucket with no folder concept', (view) => {
    expect(isFlatPlatformView(view)).toBe(true);
  });

  test.each([
    ApplicationRoute.AssetsApplications,
    ApplicationRoute.AssetsToolsets,
    ApplicationRoute.Prompts,
    ApplicationRoute.Conversations,
    ApplicationRoute.Files,
  ])('Should treat %s as foldered', (view) => {
    expect(isFlatPlatformView(view)).toBe(false);
  });

  test.each([ApplicationRoute.PlatformPolicies, ApplicationRoute.PlatformPolicyAssignments])(
    'Should not treat %s as flat, since it nests one folder level',
    (view) => {
      expect(isFlatPlatformView(view)).toBe(false);
    },
  );

  test('Should agree with isPlatformBucketView on the root, so the two cannot drift apart', () => {
    const views = Object.values(ApplicationRoute);

    views.forEach((view) => {
      expect(isPlatformBucketView(view)).toBe(getRootFolder(view) === PLATFORM_ROOT_FOLDER);
    });
  });
});

describe('Root Folder Utils :: isNestedPlatformView', () => {
  test.each([ApplicationRoute.PlatformPolicies, ApplicationRoute.PlatformPolicyAssignments])(
    'Should treat %s as nested, with the platform root',
    (view) => {
      expect(isNestedPlatformView(view)).toBe(true);
      expect(isPlatformBucketView(view)).toBe(true);
      expect(getRootFolder(view)).toBe(PLATFORM_ROOT_FOLDER);
    },
  );

  test.each([
    ApplicationRoute.PlatformModels,
    ApplicationRoute.PlatformRoutes,
    ApplicationRoute.PlatformRoles,
    ApplicationRoute.Prompts,
    ApplicationRoute.AssetsApplications,
    undefined,
  ])('Should not treat %s as nested', (view) => {
    expect(isNestedPlatformView(view)).toBe(false);
  });
});

describe('Root Folder Utils :: config-file entity types', () => {
  test('maps supported views to Core config-file types and excludes Keys', () => {
    expect(getConfigFileEntityType(ApplicationRoute.PlatformTranslators)).toBe('translators');
    expect(getConfigFileEntityType(ApplicationRoute.PlatformCatalogSchemas)).toBe('catalog_schemas');
    expect(getConfigFileEntityType(ApplicationRoute.PlatformKeys)).toBeUndefined();
  });
});

describe('Root Folder Utils :: isPlatformBucketPath', () => {
  test.each(['platform/', 'platform/my-app', 'platform/nested/name'])(
    'Should return true for a platform-prefixed path (%s)',
    (path) => {
      expect(isPlatformBucketPath(path)).toBe(true);
    },
  );

  test.each(['public/', 'public/my-app', 'platformist/x', ''])(
    'Should return false for a non-platform path (%s)',
    (path) => {
      expect(isPlatformBucketPath(path)).toBe(false);
    },
  );

  test.each([undefined, null])('Should return false for %s', (path) => {
    expect(isPlatformBucketPath(path)).toBe(false);
  });
});
