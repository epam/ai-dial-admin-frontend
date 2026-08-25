import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { getRootFolder, isFlatPlatformView, PLATFORM_ROOT_FOLDER } from '../root-folder';

describe('Root Folder Utils :: getRootFolder', () => {
  test.each([
    ApplicationRoute.AssetsModels,
    ApplicationRoute.AssetsAppRunners,
    ApplicationRoute.AssetsInterceptors,
    ApplicationRoute.AssetsRoutes,
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
    ApplicationRoute.AssetsModels,
    ApplicationRoute.AssetsAppRunners,
    ApplicationRoute.AssetsInterceptors,
    ApplicationRoute.AssetsRoutes,
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
