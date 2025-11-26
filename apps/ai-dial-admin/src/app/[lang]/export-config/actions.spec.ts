import { beforeEach, describe, expect, test, vi } from 'vitest';
import { exportConfig, exportConfigMap, getEntities, previewExportConfig } from './actions';

import * as api from '@/src/app/api/api';
import { utilityApi } from '@/src/app/api/api';
import { EntityType } from '@/src/types/entity-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import * as entityUtils from '@/src/utils/entities/entities-list-view';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');
vi.mock('@/src/utils/entities/entities-list-view');

const mockedEntityData = [{ id: '1' }, { id: '2' }];

describe('Export config :: actions :: exportConfig', () => {
  const mockRequest = { data: 'mocked-export-request' };

  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('should call exportConfig action', async () => {
    (utilityApi.exportConfig as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await exportConfig(mockRequest as any);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.exportConfig).toHaveBeenCalledWith(mockRequest, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('should call previewExportConfig action', async () => {
    (utilityApi.previewExportConfig as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await previewExportConfig(mockRequest as any);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.previewExportConfig).toHaveBeenCalledWith(mockRequest, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('should call exportConfigMap action', async () => {
    (utilityApi.exportConfigMap as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await exportConfigMap();
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.exportConfigMap).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});

describe('Export config :: actions :: getEntities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('should return ROUTE entities', async () => {
    (api.routesApi.getRoutesList as any).mockResolvedValue(['route1']);
    (entityUtils.getRoutesForEntitiesGrid as any).mockReturnValue([{ id: 'route' }]);

    const result = await getEntities(EntityType.ROUTE);
    expect(result).toEqual([{ id: 'route' }]);
  });

  test('should return APPLICATION entities', async () => {
    (api.applicationsApi.getApplicationsList as any).mockResolvedValue(['app1']);
    (entityUtils.getApplicationsForEntitiesGrid as any).mockReturnValue([{ id: 'app' }]);

    const result = await getEntities(EntityType.APPLICATION);
    expect(result).toEqual([{ id: 'app' }]);
  });

  test('should return INTERCEPTOR_RUNNER entities', async () => {
    (api.interceptorTemplatesApi.getInterceptorTemplatesList as any).mockResolvedValue(['runner1']);
    (entityUtils.getTemplatesForEntitiesGrid as any).mockReturnValue([{ id: 'runner' }]);

    const result = await getEntities(EntityType.INTERCEPTOR_RUNNER);
    expect(result).toEqual([{ id: 'runner' }]);
  });

  test('should return MODEL entities', async () => {
    (api.modelsApi.getModelsList as any).mockResolvedValue(['model1']);
    (entityUtils.getModelsForEntitiesGrid as any).mockReturnValue([{ id: 'model' }]);

    const result = await getEntities(EntityType.MODEL);
    expect(result).toEqual([{ id: 'model' }]);
  });

  test('should return TOOLSET entities', async () => {
    (api.toolSetsApi.getToolsetList as any).mockResolvedValue(['toolset1']);
    (entityUtils.getToolsetsForEntitiesGrid as any).mockReturnValue([{ id: 'toolset' }]);

    const result = await getEntities(EntityType.TOOLSET);
    expect(result).toEqual([{ id: 'toolset' }]);
  });

  test('should return ROLE entities', async () => {
    (api.rolesApi.getRolesList as any).mockResolvedValue(['role1']);
    (entityUtils.getRolesForEntitiesGrid as any).mockReturnValue(mockedEntityData);

    const result = await getEntities(EntityType.ROLE);
    expect(result).toEqual(mockedEntityData);
  });

  test('should return KEY entities', async () => {
    (api.keysApi.getKeysList as any).mockResolvedValue(['key1']);
    (entityUtils.getKeysForEntitiesGrid as any).mockReturnValue(mockedEntityData);

    const result = await getEntities(EntityType.KEY);
    expect(result).toEqual(mockedEntityData);
  });

  test('should return APPLICATION_TYPE_SCHEMA entities', async () => {
    (api.applicationRunnersApi.getApplicationSchemesList as any).mockResolvedValue(['runner1']);
    (entityUtils.getRunnersForEntitiesGrid as any).mockReturnValue(mockedEntityData);

    const result = await getEntities(EntityType.APPLICATION_TYPE_SCHEMA);
    expect(result).toEqual(mockedEntityData);
  });

  test('should return INTERCEPTOR entities', async () => {
    (api.interceptorsApi.getInterceptorsList as any).mockResolvedValue(['int1']);
    (entityUtils.getInterceptorsForEntitiesGrid as any).mockReturnValue(mockedEntityData);

    const result = await getEntities(EntityType.INTERCEPTOR);
    expect(result).toEqual(mockedEntityData);
  });

  test('should return ADAPTER entities', async () => {
    (api.adaptersApi.getAdaptersList as any).mockResolvedValue(['adapter1']);
    (entityUtils.getAdaptersForEntitiesGrid as any).mockReturnValue(mockedEntityData);

    const result = await getEntities(EntityType.ADAPTER);
    expect(result).toEqual(mockedEntityData);
  });

  test('should return empty array for unknown type', async () => {
    const result = await getEntities('UNKNOWN');
    expect(result).toEqual([]);
  });
});
