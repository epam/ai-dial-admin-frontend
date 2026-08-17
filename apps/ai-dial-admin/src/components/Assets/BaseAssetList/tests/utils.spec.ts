import { describe, expect, test, vi } from 'vitest';
import { getAllSelectedItemsPaths, getPlatformAssetDuplicate } from '../utils';
import { DialAppRunnerResource, DialModelResource, PlatformAsset } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

describe('BaseAssetList', () => {
  describe('getAllSelectedItemsPaths', () => {
    test('should get all selected paths for base path', () => {
      const mockSelectedVersionsMap = {
        'public/test': ['1', '2', '3'],
      };
      const basePath = 'public/test__3';
      const result = getAllSelectedItemsPaths(basePath, mockSelectedVersionsMap);

      expect(result).toHaveLength(3);
      expect(result).to.have.members(['public/test__1', 'public/test__2', 'public/test__3']);
    });

    test('should get base path if selected items no specified', () => {
      const mockSelectedVersionsMap = {};
      const basePath = 'public/test__3';
      const result = getAllSelectedItemsPaths(basePath, mockSelectedVersionsMap);

      expect(result).toHaveLength(1);
      expect(result).to.have.members(['public/test__3']);
    });
  });

  describe('getPlatformAssetDuplicate', () => {
    const model = {
      name: 'gpt-4-copy',
      displayName: 'GPT-4 copy',
      endpoint: 'http://model/chat',
      path: 'platform/gpt-4',
      folderId: 'platform/',
      author: 'someone',
      createdAt: '1',
      updatedAt: '2',
      status: 'valid',
      validationWarnings: [{ field: 'endpoint' }],
      reference: 'abc123',
    } as unknown as DialModelResource;

    const runner = {
      $id: 'http://runner/schema-copy',
      'dial:applicationTypeDisplayName': 'Runner copy',
      name: 'http%3A%2F%2Frunner%2Fschema',
      path: 'platform/http%3A%2F%2Frunner%2Fschema',
      folderId: 'platform/',
      author: 'someone',
      createdAt: '1',
      updatedAt: '2',
    } as unknown as DialAppRunnerResource;

    test('should keep the model name, since it is the identity the user just edited', () => {
      const duplicate = getPlatformAssetDuplicate(ApplicationRoute.AssetsModels, model) as DialModelResource;

      expect(duplicate.name).toBe('gpt-4-copy');
      expect(duplicate.displayName).toBe('GPT-4 copy');
      expect(duplicate.endpoint).toBe('http://model/chat');
    });

    test('should drop the fields Core owns from a model duplicate', () => {
      const duplicate = getPlatformAssetDuplicate(ApplicationRoute.AssetsModels, model);

      expect(duplicate).not.toHaveProperty('path');
      expect(duplicate).not.toHaveProperty('folderId');
      expect(duplicate).not.toHaveProperty('author');
      expect(duplicate).not.toHaveProperty('createdAt');
      expect(duplicate).not.toHaveProperty('updatedAt');
      expect(duplicate).not.toHaveProperty('status');
      expect(duplicate).not.toHaveProperty('validationWarnings');
      expect(duplicate).not.toHaveProperty('reference');
    });

    test('should drop the runner name, since keeping it navigates back to the original', () => {
      const duplicate = getPlatformAssetDuplicate(ApplicationRoute.AssetsAppRunners, runner) as DialAppRunnerResource;

      expect(duplicate).not.toHaveProperty('name');
      expect(duplicate).not.toHaveProperty('path');
      expect(duplicate.$id).toBe('http://runner/schema-copy');
      expect(duplicate['dial:applicationTypeDisplayName']).toBe('Runner copy');
    });

    test('should not mutate the asset it was given', () => {
      const source = { ...model } as PlatformAsset;
      getPlatformAssetDuplicate(ApplicationRoute.AssetsModels, source);

      expect(source).toEqual(model);
    });
  });
});
