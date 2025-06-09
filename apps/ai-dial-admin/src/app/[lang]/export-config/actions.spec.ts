import { exportConfig, getEntities, previewExportConfig } from './actions';

import * as api from '@/src/app/api/api';
import { utilityApi } from '@/src/app/api/api';
import { ExportComponentType } from '@/src/types/export';
import { getUserToken } from '@/src/utils/auth/auth-request';
import * as entityUtils from '@/src/utils/entities/entities-list-view';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

jest.mock('@/src/utils/auth/auth-request');
jest.mock('@/src/app/api/api');
jest.mock('@/src/utils/entities/entities-list-view');

const mockedEntityData = [{ id: '1' }, { id: '2' }];

jest.mock('@/src/utils/auth/auth-request');
jest.mock('@/src/utils/env/get-auth-toggle');
jest.mock('@/src/app/api/api');

describe('Export config :: actions :: exportConfig', () => {
  const fakeToken = 'mocked-token';
  const mockRequest = { data: 'mocked-export-request' };
  const mockResponse = { success: true };

  beforeEach(() => {
    jest.clearAllMocks();
    (getUserToken as jest.Mock).mockResolvedValue(fakeToken);
    (getIsEnableAuthToggle as jest.Mock).mockReturnValue(true);
  });

  it('should call utilityApi.exportConfig with token', async () => {
    (utilityApi.exportConfig as jest.Mock).mockResolvedValue(mockResponse);

    const result = await exportConfig(mockRequest as any);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.exportConfig).toHaveBeenCalledWith(mockRequest, fakeToken);
    expect(result).toBe(mockResponse);
  });

  it('should call utilityApi.previewExportConfig with token', async () => {
    (utilityApi.previewExportConfig as jest.Mock).mockResolvedValue(mockResponse);

    const result = await previewExportConfig(mockRequest as any);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.previewExportConfig).toHaveBeenCalledWith(mockRequest, fakeToken);
    expect(result).toBe(mockResponse);
  });
});

describe('Export config :: actions :: getEntities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUserToken as jest.Mock).mockResolvedValue(TOKEN_MOCK);
  });

  it('should return combined ENTITIES data', async () => {
    (api.routesApi.getRoutesList as jest.Mock).mockResolvedValue(['route1']);
    (api.applicationsApi.getApplicationsList as jest.Mock).mockResolvedValue(['app1']);
    (api.modelsApi.getModelsList as jest.Mock).mockResolvedValue(['model1']);

    (entityUtils.getRoutesForEntitiesGrid as jest.Mock).mockReturnValue([{ id: 'route' }]);
    (entityUtils.getApplicationsForEntitiesGrid as jest.Mock).mockReturnValue([{ id: 'app' }]);
    (entityUtils.getModelsForEntitiesGrid as jest.Mock).mockReturnValue([{ id: 'model' }]);

    const result = await getEntities(ExportComponentType.ENTITIES);
    expect(result).toEqual([{ id: 'model' }, { id: 'app' }, { id: 'route' }]);
  });

  it('should return ROLE entities', async () => {
    (api.rolesApi.getRolesList as jest.Mock).mockResolvedValue(['role1']);
    (entityUtils.getRolesForEntitiesGrid as jest.Mock).mockReturnValue(mockedEntityData);

    const result = await getEntities(ExportComponentType.ROLE);
    expect(result).toEqual(mockedEntityData);
  });

  it('should return KEY entities', async () => {
    (api.keysApi.getKeysList as jest.Mock).mockResolvedValue(['key1']);
    (entityUtils.getKeysForEntitiesGrid as jest.Mock).mockReturnValue(mockedEntityData);

    const result = await getEntities(ExportComponentType.KEY);
    expect(result).toEqual(mockedEntityData);
  });

  it('should return APPLICATION_TYPE_SCHEMA entities', async () => {
    (api.applicationRunnersApi.getApplicationSchemesList as jest.Mock).mockResolvedValue(['runner1']);
    (entityUtils.getRunnersForEntitiesGrid as jest.Mock).mockReturnValue(mockedEntityData);

    const result = await getEntities(ExportComponentType.APPLICATION_TYPE_SCHEMA);
    expect(result).toEqual(mockedEntityData);
  });

  it('should return INTERCEPTOR entities', async () => {
    (api.interceptorsApi.getInterceptorsList as jest.Mock).mockResolvedValue(['int1']);
    (entityUtils.getInterceptorsForEntitiesGrid as jest.Mock).mockReturnValue(mockedEntityData);

    const result = await getEntities(ExportComponentType.INTERCEPTOR);
    expect(result).toEqual(mockedEntityData);
  });

  it('should return empty array for unknown type', async () => {
    const result = await getEntities('UNKNOWN');
    expect(result).toEqual([]);
  });
});
