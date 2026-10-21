import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import {
  FILE_ROOT_FOLDER,
  getConfigFileEntityType,
  getRootFolder,
  getRootFolders,
  isFileRootPath,
  isFlatPlatformView,
  isPlatformBucketPath,
  isPlatformDualBucketView,
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

  test('Should agree with getRootFolder, so the two cannot drift apart', () => {
    const views = Object.values(ApplicationRoute);

    views.forEach((view) => {
      expect(isFlatPlatformView(view)).toBe(getRootFolder(view) === PLATFORM_ROOT_FOLDER);
    });
  });
});

describe('Root Folder Utils :: getRootFolders', () => {
  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'Should return file followed by both physical buckets for %s',
    (view) => {
      expect(getRootFolders(view)).toEqual(['file', 'platform', 'public']);
    },
  );

  test.each([
    ApplicationRoute.Prompts,
    ApplicationRoute.Conversations,
    ApplicationRoute.Files,
    ApplicationRoute.PlatformKeys,
  ])('Should return a single-element array matching getRootFolder for %s', (view) => {
    expect(getRootFolders(view)).toEqual([getRootFolder(view)]);
  });

  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'Should retain the file and public roots for %s when the platform bucket is disabled',
    (view) => {
      expect(getRootFolders(view, false)).toEqual(['file', 'public']);
    },
  );

  test('Should return file, platform, and public when the platform bucket is explicitly enabled', () => {
    expect(getRootFolders(ApplicationRoute.AssetsApplications, true)).toEqual(['file', 'platform', 'public']);
  });

  test('Should ignore the platform bucket flag for non-dual-bucket views', () => {
    const views = [ApplicationRoute.Prompts, ApplicationRoute.Conversations, ApplicationRoute.PlatformKeys];

    views.forEach((view) => {
      expect(getRootFolders(view, false)).toEqual([getRootFolder(view)]);
      expect(getRootFolders(view, true)).toEqual([getRootFolder(view)]);
    });
  });
});

describe('Root Folder Utils :: file roots', () => {
  test('maps supported views to Core config-file types and continues to exclude Keys', () => {
    expect(getConfigFileEntityType(ApplicationRoute.PlatformTranslators)).toBe('translators');
    expect(getConfigFileEntityType(ApplicationRoute.PlatformCatalogSchemas)).toBe('catalog_schemas');
    expect(getConfigFileEntityType(ApplicationRoute.PlatformKeys)).toBeUndefined();
  });

  test('identifies only the synthetic file root path', () => {
    expect(isFileRootPath(`${FILE_ROOT_FOLDER}/`)).toBe(true);
    expect(isFileRootPath('public/')).toBe(false);
    expect(isFileRootPath(undefined)).toBe(false);
  });
});

describe('Root Folder Utils :: isPlatformDualBucketView', () => {
  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'is true for %s when the current path is platform-prefixed',
    (view) => {
      expect(isPlatformDualBucketView(view, 'platform/')).toBe(true);
      expect(isPlatformDualBucketView(view, 'platform/my-item')).toBe(true);
    },
  );

  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'is false for %s for a public-prefixed path',
    (view) => {
      expect(isPlatformDualBucketView(view, 'public/')).toBe(false);
    },
  );

  test('is false for an undefined path, and for a non-dual-bucket view even with a platform-prefixed path', () => {
    expect(isPlatformDualBucketView(ApplicationRoute.AssetsApplications, undefined)).toBe(false);
    expect(isPlatformDualBucketView(ApplicationRoute.PlatformKeys, 'platform/')).toBe(false);
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
