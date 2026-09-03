import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import {
  getRootFolder,
  getRootFolders,
  isFlatPlatformView,
  isPlatformBucketPath,
  PLATFORM_ROOT_FOLDER,
} from '../root-folder';

describe('Root Folder Utils :: getRootFolder', () => {
  test.each([
    ApplicationRoute.PlatformModels,
    ApplicationRoute.PlatformAppRunners,
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
  test('Should return both buckets, platform first, for Assets Applications', () => {
    expect(getRootFolders(ApplicationRoute.AssetsApplications)).toEqual(['platform', 'public']);
  });

  test.each([
    ApplicationRoute.AssetsToolsets,
    ApplicationRoute.Prompts,
    ApplicationRoute.Conversations,
    ApplicationRoute.Files,
    ApplicationRoute.PlatformKeys,
  ])('Should return a single-element array matching getRootFolder for %s', (view) => {
    expect(getRootFolders(view)).toEqual([getRootFolder(view)]);
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
