import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { getRootFolder, MODELS_ROOT_FOLDER } from '../root-folder';

describe('Root Folder Utils :: getRootFolder', () => {
  test('Should return "platform" for AssetsModels view', () => {
    expect(getRootFolder(ApplicationRoute.AssetsModels)).toEqual('platform');
    expect(getRootFolder(ApplicationRoute.AssetsModels)).toEqual(MODELS_ROOT_FOLDER);
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
