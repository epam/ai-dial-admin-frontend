import * as entitiesUtils from '@/src/utils/entities/entities-list-view';
import { getPreviewTabs } from '../PreviewModal.utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/src/utils/entities/entities-list-view');

const t = (key: string) => `translated(${key})`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Export Config Utils :: getPreviewTabs', () => {
  test('should return tabs and convertedData correctly with roles, keys, applicationRunners, and models', () => {
    const mockEntities: any[] = [{ id: 'e1' }, { id: 'e2' }];
    entitiesUtils.getApplicationsForEntitiesGrid.mockReturnValue([]);
    entitiesUtils.getModelsForEntitiesGrid.mockReturnValue(mockEntities);
    entitiesUtils.getRoutesForEntitiesGrid.mockReturnValue([]);

    const data = {
      roles: [{ id: 'role1' }],
      keys: [{ id: 'key1' }, { id: 'key2' }],
      models: [{ id: 'model1' }],
      applicationRunners: [{ id: 'applicationRunner1' }],
      applications: [{ id: 'application1' }],
      prompts: [{ id: 'prompt1' }],
      routes: [{ id: 'route1' }],
    };

    const { tabs, convertedData } = getPreviewTabs(data, t);

    expect(tabs).toEqual([
      { id: 'ENTITIES', name: 'translated(Menu.Entities): 2' },
      { id: 'ROLE', name: 'translated(Menu.Roles): 1' },
      { id: 'KEY', name: 'translated(Menu.Keys): 2' },
      { id: 'APPLICATION_TYPE_SCHEMA', name: 'translated(Menu.ApplicationRunners): 1' },
      { id: 'PROMPT', name: 'translated(Menu.Prompts): 1' },
    ]);

    expect(convertedData.ROLE).toHaveLength(1);
    expect(convertedData.KEY).toHaveLength(2);
    expect(convertedData.APPLICATION_TYPE_SCHEMA).toHaveLength(1);
    expect(convertedData.PROMPT).toHaveLength(1);
    expect(convertedData.ENTITIES).toEqual(mockEntities);
  });

  test('should not add tabs for empty categories', () => {
    entitiesUtils.getApplicationsForEntitiesGrid.mockReturnValue([]);
    entitiesUtils.getModelsForEntitiesGrid.mockReturnValue([]);
    entitiesUtils.getRoutesForEntitiesGrid.mockReturnValue([]);

    const data = {
      roles: [],
      applications: [],
      models: [],
      routes: [],
    };

    const { tabs, convertedData } = getPreviewTabs(data, t);

    expect(tabs).toHaveLength(0);
    expect(Object.keys(convertedData)).toHaveLength(0);
  });

  test('should handle interceptors and files correctly', () => {
    const data = {
      interceptors: [{ id: 'int1' }],
      files: [{ id: 'file1' }],
    };

    const { tabs, convertedData } = getPreviewTabs(data, t);

    expect(tabs).toEqual([
      { id: 'INTERCEPTOR', name: 'translated(Menu.Interceptors): 1' },
      { id: 'FILE', name: 'translated(Menu.Files): 1' },
    ]);

    expect(convertedData.INTERCEPTOR).toHaveLength(1);
    expect(convertedData.FILE).toHaveLength(1);
  });

  test('should handle adapters correctly', () => {
    const data = {
      adapters: [{ id: 'adapter1' }],
    };

    const { tabs, convertedData } = getPreviewTabs(data, t);

    expect(tabs).toEqual([{ id: 'ADAPTER', name: 'translated(Menu.Adapters): 1' }]);

    expect(convertedData.ADAPTER).toEqual([{ id: 'adapter1' }]);
  });

  test('should merge entities from applications and routes as well', () => {
    const mockEntitiesFromApplications = [{ id: 'app1' }];
    const mockEntitiesFromRoutes = [{ id: 'route1' }];
    entitiesUtils.getApplicationsForEntitiesGrid.mockReturnValue(mockEntitiesFromApplications);
    entitiesUtils.getModelsForEntitiesGrid.mockReturnValue([]);
    entitiesUtils.getRoutesForEntitiesGrid.mockReturnValue(mockEntitiesFromRoutes);

    const data = {
      applications: [{ id: 'application1' }],
      routes: [{ id: 'route1' }],
    };

    const { tabs, convertedData } = getPreviewTabs(data, t);

    expect(tabs).toEqual([{ id: 'ENTITIES', name: 'translated(Menu.Entities): 2' }]);

    expect(convertedData.ENTITIES).toEqual([{ id: 'app1' }, { id: 'route1' }]);
  });
});
