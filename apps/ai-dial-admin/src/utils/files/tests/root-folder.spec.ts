import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { getRootFolder, PLATFORM_ROOT_FOLDER } from '../root-folder';

describe('Root Folder Utils :: getRootFolder', () => {
  test.each([ApplicationRoute.AssetsModels, ApplicationRoute.AssetsAppRunners])(
    'Should return "platform" for %s view',
    (view) => {
      expect(getRootFolder(view)).toEqual('platform');
      expect(getRootFolder(view)).toEqual(PLATFORM_ROOT_FOLDER);
    },
  );

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
