import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { containersApi, huggingFaceApi, imagesApi, topicApi, whitelistApi } from '@/src/app/api/api';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createContainer,
  createImage,
  deleteContainer,
  deleteImage,
  duplicateContainer,
  getContainer,
  getContainerPods,
  getContainerPrompts,
  getContainerResources,
  getContainerTools,
  getContainers,
  getImage,
  getImageContainers,
  getImageLogs,
  getImageVersions,
  getImagesWithVersions,
  getInterceptorContainers,
  getMCPContainers,
  getImages,
  getModelContainers,
  getTopics,
  installImage,
  runContainer,
  stopContainer,
  updateContainer,
  updateContainersImageId,
  updateImage,
  getGlobalWhitelist,
  updateGlobalWhitelist,
  getHuggingFaceModels,
  getModelDetails,
} from '../deployments';
import { ResourceType } from '@/src/types/resource-type';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('next/headers', () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));
vi.mock('@/src/app/api/api');

describe('Deployments actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  describe('Image actions', () => {
    test('getMCPImages calls imagesApi.getMCPImages with token', async () => {
      const mockResponse = [{ id: '1', name: 'mcp-image' }];
      (imagesApi.getImages as any).mockResolvedValue(mockResponse);

      const result = await getImages();

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.getImages).toHaveBeenCalledWith(TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getImage calls imagesApi.getImage with id and token', async () => {
      const mockResponse = { id: 'image-1', name: 'test-image' };
      (imagesApi.getImage as any).mockResolvedValue(mockResponse);

      const result = await getImage('image-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.getImage).toHaveBeenCalledWith('image-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getImageVersions calls imagesApi.getImageVersions with name and token', async () => {
      const mockResponse = [{ id: 'v1', version: '1.0.0' }];
      (imagesApi.getImageVersions as any).mockResolvedValue(mockResponse);

      const result = await getImageVersions('test-image', 'MCP');

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.getImageVersions).toHaveBeenCalledWith('test-image', 'MCP', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getImagesWithVersions calls imagesApi.getImagesWithVersions with type and token', async () => {
      const mockResponse = [{ name: 'image', versions: [] }];
      (imagesApi.getImagesWithVersions as any).mockResolvedValue(mockResponse);

      const result = await getImagesWithVersions('MCP');

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.getImagesWithVersions).toHaveBeenCalledWith('MCP', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('createImage calls imagesApi.createImage with image and token', async () => {
      const mockImage = { name: 'new-image', version: '1.0.0' };
      const mockResponse = { id: '1', ...mockImage };
      (imagesApi.createImage as any).mockResolvedValue(mockResponse);

      const result = await createImage(mockImage);

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.createImage).toHaveBeenCalledWith(mockImage, TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('deleteImage calls imagesApi.deleteImage with id and token', async () => {
      (imagesApi.deleteImage as any).mockResolvedValue(RESPONSE_MOCK);

      const result = await deleteImage('image-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.deleteImage).toHaveBeenCalledWith('image-1', TOKEN_MOCK);
      expect(result).toBe(RESPONSE_MOCK);
    });

    test('updateImage calls imagesApi.updateImage with image and token', async () => {
      const mockImage = { id: '1', name: 'updated-image' };
      const mockResponse = { ...mockImage };
      (imagesApi.updateImage as any).mockResolvedValue(mockResponse);

      const result = await updateImage(mockImage);

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.updateImage).toHaveBeenCalledWith(mockImage, TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('installImage calls imagesApi.installImage with id and token', async () => {
      (imagesApi.installImage as any).mockResolvedValue(RESPONSE_MOCK);

      const result = await installImage('image-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.installImage).toHaveBeenCalledWith('image-1', TOKEN_MOCK);
      expect(result).toBe(RESPONSE_MOCK);
    });

    test('getImageLogs calls imagesApi.getImageLogs with id and token', async () => {
      const mockResponse = 'log output';
      (imagesApi.getImageLogs as any).mockResolvedValue(mockResponse);

      const result = await getImageLogs('image-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.getImageLogs).toHaveBeenCalledWith('image-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });
  });

  describe('Container actions', () => {
    test('getContainers calls containersApi.getContainers with type and token', async () => {
      const mockResponse = [{ id: '1', name: 'container' }];
      (containersApi.getContainers as any).mockResolvedValue(mockResponse);

      const result = await getContainers('MCP');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.getContainers).toHaveBeenCalledWith('MCP', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getContainers without type calls containersApi.getContainers with undefined and token', async () => {
      const mockResponse = [{ id: '1', name: 'container' }];
      (containersApi.getContainers as any).mockResolvedValue(mockResponse);

      const result = await getContainers();

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.getContainers).toHaveBeenCalledWith(undefined, TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getMCPContainers calls containersApi.getMCPContainers with token', async () => {
      const mockResponse = [{ id: '1', name: 'mcp-container' }];
      (containersApi.getMCPContainers as any).mockResolvedValue(mockResponse);

      const result = await getMCPContainers();

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.getMCPContainers).toHaveBeenCalledWith(TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getInterceptorContainers calls containersApi.getInterceptorContainers with token', async () => {
      const mockResponse = [{ id: '1', name: 'interceptor-container' }];
      (containersApi.getInterceptorContainers as any).mockResolvedValue(mockResponse);

      const result = await getInterceptorContainers();

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.getInterceptorContainers).toHaveBeenCalledWith(TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getModelContainers calls containersApi.getModelContainers with token', async () => {
      const mockResponse = [{ id: '1', name: 'model-container' }];
      (containersApi.getModelContainers as any).mockResolvedValue(mockResponse);

      const result = await getModelContainers();

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.getModelContainers).toHaveBeenCalledWith(TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getImageContainers calls containersApi.getImageContainers with imageId and token', async () => {
      const mockResponse = [{ id: '1', imageId: 'img-1' }];
      (containersApi.getImageContainers as any).mockResolvedValue(mockResponse);

      const result = await getImageContainers('img-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.getImageContainers).toHaveBeenCalledWith('img-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getContainer calls containersApi.getContainer with id and token', async () => {
      const mockResponse = { id: 'container-1', name: 'test' };
      (containersApi.getContainer as any).mockResolvedValue(mockResponse);

      const result = await getContainer('container-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.getContainer).toHaveBeenCalledWith('container-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('createContainer calls containersApi.createContainer with container and token', async () => {
      const mockContainer = { name: 'new-container' } as any;
      const mockResponse = { id: '1', ...mockContainer };
      (containersApi.createContainer as any).mockResolvedValue(mockResponse);

      const result = await createContainer(mockContainer);

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.createContainer).toHaveBeenCalledWith(mockContainer, TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('duplicateContainer calls containersApi.duplicateContainer with id, name and token', async () => {
      const mockResponse = { id: '2', name: 'duplicated' };
      (containersApi.duplicateContainer as any).mockResolvedValue(mockResponse);

      const result = await duplicateContainer('container-1', 'container-2', 'duplicated');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.duplicateContainer).toHaveBeenCalledWith(
        'container-1',
        'container-2',
        'duplicated',
        TOKEN_MOCK,
      );
      expect(result).toBe(mockResponse);
    });

    test('updateContainer calls containersApi.updateContainer with container and token', async () => {
      const mockContainer = { id: '1', name: 'updated' } as any;
      const mockResponse = { ...mockContainer };
      (containersApi.updateContainer as any).mockResolvedValue(mockResponse);

      const result = await updateContainer(mockContainer);

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.updateContainer).toHaveBeenCalledWith(mockContainer, TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('updateContainersImageId calls containersApi.updateContainersImageId with deployments, imageId and token', async () => {
      (containersApi.updateContainersImageId as any).mockResolvedValue(RESPONSE_MOCK);

      const result = await updateContainersImageId(['c1', 'c2'], 'img-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.updateContainersImageId).toHaveBeenCalledWith(['c1', 'c2'], 'img-1', TOKEN_MOCK);
      expect(result).toBe(RESPONSE_MOCK);
    });

    test('deleteContainer calls containersApi.deleteContainer with containerId and token', async () => {
      (containersApi.deleteContainer as any).mockResolvedValue(RESPONSE_MOCK);

      const result = await deleteContainer('container-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.deleteContainer).toHaveBeenCalledWith('container-1', TOKEN_MOCK);
      expect(result).toBe(RESPONSE_MOCK);
    });

    test('runContainer calls containersApi.runContainer with containerId and token', async () => {
      (containersApi.runContainer as any).mockResolvedValue(RESPONSE_MOCK);

      const result = await runContainer('container-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.runContainer).toHaveBeenCalledWith('container-1', TOKEN_MOCK);
      expect(result).toBe(RESPONSE_MOCK);
    });

    test('stopContainer calls containersApi.stopContainer with containerId and token', async () => {
      (containersApi.stopContainer as any).mockResolvedValue(RESPONSE_MOCK);

      const result = await stopContainer('container-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.stopContainer).toHaveBeenCalledWith('container-1', TOKEN_MOCK);
      expect(result).toBe(RESPONSE_MOCK);
    });

    test('getContainerTools calls containersApi.getContainerTools with containerId and token', async () => {
      const mockResponse = [{ name: 'tool1' }];
      (containersApi.getContainerTools as any).mockResolvedValue(mockResponse);

      const result = await getContainerTools('container-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.getContainerTools).toHaveBeenCalledWith('container-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getContainerResources calls containersApi.getContainerResources with containerId and token', async () => {
      const mockResponse = { cpu: '1', memory: '2Gi' };
      (containersApi.getContainerResources as any).mockResolvedValue(mockResponse);

      const result = await getContainerResources('container-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.getContainerResources).toHaveBeenCalledWith('container-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getContainerPrompts calls containersApi.getContainerPrompts with containerId and token', async () => {
      const mockResponse = [{ name: 'prompt1' }];
      (containersApi.getContainerPrompts as any).mockResolvedValue(mockResponse);

      const result = await getContainerPrompts('container-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.getContainerPrompts).toHaveBeenCalledWith('container-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getContainerPods calls containersApi.getContainerPods with containerId and token', async () => {
      const mockResponse = [{ name: 'pod1' }];
      (containersApi.getContainerPods as any).mockResolvedValue(mockResponse);

      const result = await getContainerPods('container-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.getContainerPods).toHaveBeenCalledWith('container-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });
  });

  describe('Topic actions', () => {
    test('getTopics calls topicApi.getTopics with token', async () => {
      const mockResponse = [{ name: 'topic1' }];
      (topicApi.getTopics as any).mockResolvedValue(mockResponse);

      const result = await getTopics();

      expect(getUserToken).toHaveBeenCalled();
      expect(topicApi.getTopics).toHaveBeenCalledWith(TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });
  });

  describe('Whitelist actions', () => {
    test('calls whitelistApi.getGlobalWhitelist with token', async () => {
      const mockResponse = ['github.com'];
      (whitelistApi.getGlobalWhitelist as any).mockResolvedValue(mockResponse);

      const result = await getGlobalWhitelist();

      expect(getUserToken).toHaveBeenCalled();
      expect(whitelistApi.getGlobalWhitelist).toHaveBeenCalledWith(TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('calls whitelistApi.updateGlobalWhitelist with token', async () => {
      const mockResponse = ['github.com'];
      (whitelistApi.updateGlobalWhitelist as any).mockResolvedValue(mockResponse);

      const result = await updateGlobalWhitelist(mockResponse);

      expect(getUserToken).toHaveBeenCalled();
      expect(whitelistApi.updateGlobalWhitelist).toHaveBeenCalledWith(mockResponse, TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });
  });

  describe('Huggingface actions', () => {
    test('calls whitelistApi.getGlobalWhitelist with token', async () => {
      const mockResponse = [{ id: 'model-1' }, { id: 'model-2' }];
      (huggingFaceApi.getHuggingFaceModels as any).mockResolvedValue(mockResponse);

      const result = await getHuggingFaceModels({});

      expect(getUserToken).toHaveBeenCalled();
      expect(huggingFaceApi.getHuggingFaceModels).toHaveBeenCalledWith({}, TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('calls whitelistApi.getModelDetails with token', async () => {
      const mockResponse = [{ id: 'model-1' }, { id: 'model-2' }];
      (huggingFaceApi.getModelDetails as any).mockResolvedValue(mockResponse);

      const result = await getModelDetails('test', 'sha');

      expect(getUserToken).toHaveBeenCalled();
      expect(huggingFaceApi.getModelDetails).toHaveBeenCalledWith('test', 'sha', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });
  });
});
