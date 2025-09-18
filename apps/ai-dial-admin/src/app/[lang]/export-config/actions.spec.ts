import { exportConfig, getCoreEntity, getEntities, previewExportConfig } from './actions';

import * as api from '@/src/app/api/api';
import { utilityApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import * as entityUtils from '@/src/utils/entities/entities-list-view';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { EntityType } from '@/src/types/entity-type';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/app/api/api');
vi.mock('@/src/utils/entities/entities-list-view');

const mockedEntityData = [{ id: '1' }, { id: '2' }];

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Export config :: actions :: exportConfig', () => {
  const fakeToken = 'mocked-token';
  const mockRequest = { data: 'mocked-export-request' };
  const mockResponse = { success: true };

  beforeEach(() => {
    vi.clearAllMocks();
    getUserToken.mockResolvedValue(fakeToken);
    getIsEnableAuthToggle.mockReturnValue(true);
  });

  test('should call utilityApi.exportConfig with token', async () => {
    utilityApi.exportConfig.mockResolvedValue(mockResponse);

    const result = await exportConfig(mockRequest as any);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.exportConfig).toHaveBeenCalledWith(mockRequest, fakeToken);
    expect(result).toBe(mockResponse);
  });

  test('should call utilityApi.previewExportConfig with token', async () => {
    utilityApi.previewExportConfig.mockResolvedValue(mockResponse);

    const result = await previewExportConfig(mockRequest as any);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.previewExportConfig).toHaveBeenCalledWith(mockRequest, fakeToken);
    expect(result).toBe(mockResponse);
  });

  test('should call utilityApi.getCoreEntity with token', async () => {
    utilityApi.getCoreEntity.mockResolvedValue(mockResponse);

    const result = await getCoreEntity('name', EntityType.MODEL);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.getCoreEntity).toHaveBeenCalledWith(
      {
        $type: 'custom',
        componentTypes: [],
        components: [
          {
            name: 'name',
            type: 'MODEL',
          },
        ],
        exportFormat: 'CORE',
      },
      fakeToken,
    );
  });
});

describe('Export config :: actions :: getEntities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserToken.mockResolvedValue(TOKEN_MOCK);
  });

  test('should return ROUTE entities', async () => {
    api.routesApi.getRoutesList.mockResolvedValue(['route1']);
    entityUtils.getRoutesForEntitiesGrid.mockReturnValue([{ id: 'route' }]);

    const result = await getEntities(EntityType.ROUTE);
    expect(result).toEqual([{ id: 'route' }]);
  });

  test('should return APPLICATION entities', async () => {
    api.applicationsApi.getApplicationsList.mockResolvedValue(['app1']);
    entityUtils.getApplicationsForEntitiesGrid.mockReturnValue([{ id: 'app' }]);

    const result = await getEntities(EntityType.APPLICATION);
    expect(result).toEqual([{ id: 'app' }]);
  });

  test('should return INTERCEPTOR_RUNNER entities', async () => {
    api.interceptorTemplatesApi.getInterceptorTemplatesList.mockResolvedValue(['runner1']);
    entityUtils.getTemplatesForEntitiesGrid.mockReturnValue([{ id: 'runner' }]);

    const result = await getEntities(EntityType.INTERCEPTOR_RUNNER);
    expect(result).toEqual([{ id: 'runner' }]);
  });

  test('should return MODEL entities', async () => {
    api.modelsApi.getModelsList.mockResolvedValue(['model1']);
    entityUtils.getModelsForEntitiesGrid.mockReturnValue([{ id: 'model' }]);

    const result = await getEntities(EntityType.MODEL);
    expect(result).toEqual([{ id: 'model' }]);
  });

  test('should return TOOLSET entities', async () => {
    api.toolSetsApi.getToolsetList.mockResolvedValue(['toolset1']);
    entityUtils.getToolsetsForEntitiesGrid.mockReturnValue([{ id: 'toolset' }]);

    const result = await getEntities(EntityType.TOOLSET);
    expect(result).toEqual([{ id: 'toolset' }]);
  });

  test('should return ROLE entities', async () => {
    api.rolesApi.getRolesList.mockResolvedValue(['role1']);
    entityUtils.getRolesForEntitiesGrid.mockReturnValue(mockedEntityData);

    const result = await getEntities(EntityType.ROLE);
    expect(result).toEqual(mockedEntityData);
  });

  test('should return KEY entities', async () => {
    api.keysApi.getKeysList.mockResolvedValue(['key1']);
    entityUtils.getKeysForEntitiesGrid.mockReturnValue(mockedEntityData);

    const result = await getEntities(EntityType.KEY);
    expect(result).toEqual(mockedEntityData);
  });

  test('should return APPLICATION_TYPE_SCHEMA entities', async () => {
    api.applicationRunnersApi.getApplicationSchemesList.mockResolvedValue(['runner1']);
    entityUtils.getRunnersForEntitiesGrid.mockReturnValue(mockedEntityData);

    const result = await getEntities(EntityType.APPLICATION_TYPE_SCHEMA);
    expect(result).toEqual(mockedEntityData);
  });

  test('should return INTERCEPTOR entities', async () => {
    api.interceptorsApi.getInterceptorsList.mockResolvedValue(['int1']);
    entityUtils.getInterceptorsForEntitiesGrid.mockReturnValue(mockedEntityData);

    const result = await getEntities(EntityType.INTERCEPTOR);
    expect(result).toEqual(mockedEntityData);
  });

  test('should return empty array for unknown type', async () => {
    const result = await getEntities('UNKNOWN');
    expect(result).toEqual([]);
  });
});
