import * as entitiesUtils from '@/src/utils/entities/entities-list-view';
import { getPreviewTabs } from '../utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ExportFormat } from '@/src/types/export';

vi.mock('@/src/utils/entities/entities-list-view');

const t = (key: string) => `translated(${key})`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Export Config Utils :: getPreviewTabs', () => {
  test('should return tabs and convertedData correctly with roles, keys, applicationRunners, and models', () => {
    const mockEntities: any[] = [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }];
    entitiesUtils.getApplicationsForEntitiesGrid.mockReturnValue([]);
    entitiesUtils.getModelsForEntitiesGrid.mockReturnValue(mockEntities);
    entitiesUtils.getRolesForEntitiesGrid.mockReturnValue([{ id: 'e1' }]);
    entitiesUtils.getKeysForEntitiesGrid.mockReturnValue([{ id: 'e1' }, { id: 'e1' }]);
    entitiesUtils.getRoutesForEntitiesGrid.mockReturnValue([]);
    entitiesUtils.getToolsetsForEntitiesGrid.mockReturnValue([]);
    entitiesUtils.getRunnersForEntitiesGrid.mockReturnValue([{ id: 'e1' }]);

    const data = {
      roles: [{ id: 'role1' }],
      keys: [{ id: 'key1' }, { id: 'key2' }],
      models: [{ id: 'model1' }],
      applicationRunners: [{ id: 'applicationRunner1' }],
      applications: [{ id: 'application1' }],
      prompts: [{ id: 'prompt1' }],
      routes: [{ id: 'route1' }],
      toolSets: [{ id: 'toolSet1' }],
    };

    const { tabs, convertedData } = getPreviewTabs(data, true, ExportFormat.CORE, t);

    expect(tabs).toEqual([
      { id: 'ROLE', label: 'translated(Menu.Roles): 1' },
      { id: 'KEY', label: 'translated(Menu.Keys): 2' },
      { id: 'MODEL', label: 'translated(Menu.Models): 1' },
      { id: 'APPLICATION_TYPE_SCHEMA', label: 'translated(Menu.ApplicationRunners): 1' },
      { id: 'APPLICATION', label: 'translated(Menu.Applications): 1' },
      { id: 'PROMPT', label: 'translated(Menu.Prompts): 1' },
      { id: 'ROUTE', label: 'translated(Menu.Routes): 1' },
      { id: 'TOOL_SET', label: 'translated(Menu.Toolsets): 1' },
    ]);

    expect(convertedData.ROLE).toHaveLength(1);
    expect(convertedData.KEY).toHaveLength(2);
    expect(convertedData.APPLICATION_TYPE_SCHEMA).toHaveLength(1);
    expect(convertedData.PROMPT).toHaveLength(1);
  });

  test('should not add tabs for empty categories', () => {
    entitiesUtils.getApplicationsForEntitiesGrid.mockReturnValue([]);
    entitiesUtils.getModelsForEntitiesGrid.mockReturnValue([]);
    entitiesUtils.getRoutesForEntitiesGrid.mockReturnValue([]);
    entitiesUtils.getToolsetsForEntitiesGrid.mockReturnValue([]);

    const data = {
      roles: [],
      applications: [],
      models: [],
      routes: [],
    };

    const { tabs, convertedData } = getPreviewTabs(data, false, ExportFormat.ADMIN, t);

    expect(tabs).toHaveLength(0);
    expect(Object.keys(convertedData)).toHaveLength(0);
  });

  test('should handle interceptors and files correctly', () => {
    const mockEntities = [{ id: 'int1' }];
    entitiesUtils.getInterceptorsForEntitiesGrid.mockReturnValue(mockEntities);
    const data = {
      interceptors: [{ id: 'int1' }],
      files: [{ id: 'file1' }],
    };

    const { tabs, convertedData } = getPreviewTabs(data, false, ExportFormat.ADMIN, t);

    expect(tabs).toEqual([
      { id: 'INTERCEPTOR', label: 'translated(Menu.Interceptors): 1' },
      { id: 'FILE', label: 'translated(Menu.Files): 1' },
    ]);

    expect(convertedData.INTERCEPTOR).toHaveLength(1);
    expect(convertedData.FILE).toHaveLength(1);
  });

  test('should handle adapters correctly', () => {
    const data = {
      adapters: [{ id: 'adapter1' }],
    };

    const mockEntities = [{ id: 'adapter1' }];
    entitiesUtils.getAdaptersForEntitiesGrid.mockReturnValue(mockEntities);

    const { tabs, convertedData } = getPreviewTabs(data, false, ExportFormat.ADMIN, t);

    expect(tabs).toEqual([{ id: 'ADAPTER', label: 'translated(Menu.Adapters): 1' }]);

    expect(convertedData.ADAPTER).toEqual([{ id: 'adapter1' }]);
  });

  test('should merge entities from applications and routes as well', () => {
    const mockEntitiesFromApplications = [{ id: 'app1' }];
    const mockEntitiesFromRoutes = [{ id: 'route1' }];
    entitiesUtils.getApplicationsForEntitiesGrid.mockReturnValue(mockEntitiesFromApplications);
    entitiesUtils.getModelsForEntitiesGrid.mockReturnValue([]);
    entitiesUtils.getRoutesForEntitiesGrid.mockReturnValue(mockEntitiesFromRoutes);
    entitiesUtils.getToolsetsForEntitiesGrid.mockReturnValue([]);

    const data = {
      applications: [{ id: 'application1' }],
      routes: [{ id: 'route1' }],
    };

    const { tabs } = getPreviewTabs(data, false, ExportFormat.ADMIN, t);

    expect(tabs).toEqual([
      { id: 'APPLICATION', label: 'translated(Menu.Applications): 1' },
      { id: 'ROUTE', label: 'translated(Menu.Routes): 1' },
    ]);
  });
});
