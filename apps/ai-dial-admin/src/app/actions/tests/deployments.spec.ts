import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import {
  assetsApi,
  containersApi,
  foldersApi,
  imagesApi,
  interceptorsApi,
  modelsApi,
  toolSetsApi,
  topicApi,
} from '@/src/app/api/api';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createAssetToolset,
  createContainer,
  createImage,
  createInterceptor,
  createModel,
  createToolset,
  deleteContainer,
  deleteImage,
  duplicateContainer,
  getContainer,
  getContainerPods,
  getContainerPrompts,
  getContainerResources,
  getContainerTools,
  getContainers,
  getFiles,
  getFolders,
  getImage,
  getImageContainers,
  getImageLogs,
  getImageVersions,
  getImagesWithVersions,
  getInterceptorContainers,
  getInterceptorImages,
  getInterceptorsList,
  getMCPContainers,
  getMCPImages,
  getModelContainers,
  getModelImages,
  getModelsList,
  getRules,
  getToolsetList,
  getToolsets,
  getTopics,
  installImage,
  runContainer,
  stopContainer,
  updateContainer,
  updateContainersImageId,
  updateImage,
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
      (imagesApi.getMCPImages as any).mockResolvedValue(mockResponse);

      const result = await getMCPImages();

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.getMCPImages).toHaveBeenCalledWith(TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getInterceptorImages calls imagesApi.getInterceptorImages with token', async () => {
      const mockResponse = [{ id: '1', name: 'interceptor-image' }];
      (imagesApi.getInterceptorImages as any).mockResolvedValue(mockResponse);

      const result = await getInterceptorImages();

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.getInterceptorImages).toHaveBeenCalledWith(TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getModelImages calls imagesApi.getModelImages with token', async () => {
      const mockResponse = [{ id: '1', name: 'model-image' }];
      (imagesApi.getModelImages as any).mockResolvedValue(mockResponse);

      const result = await getModelImages();

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.getModelImages).toHaveBeenCalledWith(TOKEN_MOCK);
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

      const result = await getImageVersions('test-image');

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.getImageVersions).toHaveBeenCalledWith('test-image', TOKEN_MOCK);
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
      const mockResponse = { success: true };
      (imagesApi.deleteImage as any).mockResolvedValue(mockResponse);

      const result = await deleteImage('image-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.deleteImage).toHaveBeenCalledWith('image-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
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
      const mockResponse = { success: true };
      (imagesApi.installImage as any).mockResolvedValue(mockResponse);

      const result = await installImage('image-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(imagesApi.installImage).toHaveBeenCalledWith('image-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
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

      const result = await duplicateContainer('container-1', 'duplicated');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.duplicateContainer).toHaveBeenCalledWith('container-1', 'duplicated', TOKEN_MOCK);
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
      const mockResponse = { success: true };
      (containersApi.updateContainersImageId as any).mockResolvedValue(mockResponse);

      const result = await updateContainersImageId(['c1', 'c2'], 'img-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.updateContainersImageId).toHaveBeenCalledWith(['c1', 'c2'], 'img-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('deleteContainer calls containersApi.deleteContainer with containerId and token', async () => {
      const mockResponse = { success: true };
      (containersApi.deleteContainer as any).mockResolvedValue(mockResponse);

      const result = await deleteContainer('container-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.deleteContainer).toHaveBeenCalledWith('container-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('runContainer calls containersApi.runContainer with containerId and token', async () => {
      const mockResponse = { success: true };
      (containersApi.runContainer as any).mockResolvedValue(mockResponse);

      const result = await runContainer('container-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.runContainer).toHaveBeenCalledWith('container-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('stopContainer calls containersApi.stopContainer with containerId and token', async () => {
      const mockResponse = { success: true };
      (containersApi.stopContainer as any).mockResolvedValue(mockResponse);

      const result = await stopContainer('container-1');

      expect(getUserToken).toHaveBeenCalled();
      expect(containersApi.stopContainer).toHaveBeenCalledWith('container-1', TOKEN_MOCK);
      expect(result).toBe(mockResponse);
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

  describe('Entity actions', () => {
    test('createInterceptor calls interceptorsApi.createInterceptor with interceptor and token', async () => {
      const mockInterceptor = { name: 'interceptor' } as any;
      const mockResponse = { ...mockInterceptor };
      (interceptorsApi.createInterceptor as any).mockResolvedValue(mockResponse);

      const result = await createInterceptor(mockInterceptor);

      expect(getUserToken).toHaveBeenCalled();
      expect(interceptorsApi.createInterceptor).toHaveBeenCalledWith(mockInterceptor, TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('createToolset calls toolSetsApi.createToolset with toolset and token', async () => {
      const mockToolset = { name: 'toolset' } as any;
      const mockResponse = { ...mockToolset };
      (toolSetsApi.createToolset as any).mockResolvedValue(mockResponse);

      const result = await createToolset(mockToolset);

      expect(getUserToken).toHaveBeenCalled();
      expect(toolSetsApi.createToolset).toHaveBeenCalledWith(mockToolset, TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('createModel calls modelsApi.createModel with model and token', async () => {
      const mockModel = { name: 'model' } as any;
      const mockResponse = { ...mockModel };
      (modelsApi.createModel as any).mockResolvedValue(mockResponse);

      const result = await createModel(mockModel);

      expect(getUserToken).toHaveBeenCalled();
      expect(modelsApi.createModel).toHaveBeenCalledWith(mockModel, TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getInterceptorsList calls interceptorsApi.getInterceptorsList with token', async () => {
      const mockResponse = [{ name: 'interceptor1' }];
      (interceptorsApi.getInterceptorsList as any).mockResolvedValue(mockResponse);

      const result = await getInterceptorsList();

      expect(getUserToken).toHaveBeenCalled();
      expect(interceptorsApi.getInterceptorsList).toHaveBeenCalledWith(TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getModelsList calls modelsApi.getModelsList with token', async () => {
      const mockResponse = [{ name: 'model1' }];
      (modelsApi.getModelsList as any).mockResolvedValue(mockResponse);

      const result = await getModelsList();

      expect(getUserToken).toHaveBeenCalled();
      expect(modelsApi.getModelsList).toHaveBeenCalledWith(TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });

    test('getToolsetList calls toolSetsApi.getToolsetList with token', async () => {
      const mockResponse = [{ name: 'toolset1' }];
      (toolSetsApi.getToolsetList as any).mockResolvedValue(mockResponse);

      const result = await getToolsetList();

      expect(getUserToken).toHaveBeenCalled();
      expect(toolSetsApi.getToolsetList).toHaveBeenCalledWith(TOKEN_MOCK);
      expect(result).toBe(mockResponse);
    });
  });

  describe('Folder and Asset actions', () => {
    test('getFolders calls foldersApi.getFolders with token and path', async () => {
      const mockResponse = [{ name: 'folder1' }];
      (foldersApi.getFolders as any).mockResolvedValue(mockResponse);

      const result = await getFolders('/path');

      expect(getUserToken).toHaveBeenCalled();
      expect(foldersApi.getFolders).toHaveBeenCalledWith(TOKEN_MOCK, '/path');
      expect(result).toBe(mockResponse);
    });

    test('getRules calls foldersApi.getRules with token and path', async () => {
      const mockResponse = [{ rule: 'rule1' }];
      (foldersApi.getRules as any).mockResolvedValue(mockResponse);

      const result = await getRules('/path');

      expect(getUserToken).toHaveBeenCalled();
      expect(foldersApi.getRules).toHaveBeenCalledWith(TOKEN_MOCK, '/path');
      expect(result).toBe(mockResponse);
    });

    test('getFiles calls assetsApi.getAssetList with token, path and FILE type', async () => {
      const mockResponse = [{ name: 'file1' }];
      (assetsApi.getAssetList as any).mockResolvedValue(mockResponse);

      const result = await getFiles('/path');

      expect(getUserToken).toHaveBeenCalled();
      expect(assetsApi.getAssetList).toHaveBeenCalledWith(TOKEN_MOCK, '/path', ResourceType.FILE);
      expect(result).toBe(mockResponse);
    });

    test('getToolsets calls assetsApi.getAssetList with token, path and TOOLSET type', async () => {
      const mockResponse = [{ name: 'toolset1' }];
      (assetsApi.getAssetList as any).mockResolvedValue(mockResponse);

      const result = await getToolsets('/path');

      expect(getUserToken).toHaveBeenCalled();
      expect(assetsApi.getAssetList).toHaveBeenCalledWith(TOKEN_MOCK, '/path', ResourceType.TOOLSET);
      expect(result).toBe(mockResponse);
    });

    test('createAssetToolset calls assetsApi.createAsset with toolset, TOOLSET type and token', async () => {
      const mockToolset = { name: 'asset-toolset' } as any;
      const mockResponse = { ...mockToolset };
      (assetsApi.createAsset as any).mockResolvedValue(mockResponse);

      const result = await createAssetToolset(mockToolset);

      expect(getUserToken).toHaveBeenCalled();
      expect(assetsApi.createAsset).toHaveBeenCalledWith(mockToolset, ResourceType.TOOLSET, TOKEN_MOCK);
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
});
