import * as entitiesUtils from '@/src/utils/entities/entities-list-view';
import { buildDeploymentExportPreviewRequest } from '@/src/components/ExportConfig/deployment-utils';
import { getDeploymentExportPreviewTabs, getPreviewTabs } from '../utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DeploymentExportComponentType, DeploymentExportEntityType } from '@/src/types/deployments/export';
import { DeploymentExportPreviewResponse } from '@/src/models/deployments/preview';
import { ExportFormat, ExportType } from '@/src/types/export';

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

  test('should handle interceptorRunners correctly', () => {
    const data = {
      interceptorRunners: [{ id: 'interceptorRunner1' }],
    };

    const mockEntities = [{ id: 'interceptorRunner1' }];
    entitiesUtils.getInterceptorTemplatesForEntitiesGrid.mockReturnValue(mockEntities);

    const { tabs, convertedData } = getPreviewTabs(data, false, ExportFormat.ADMIN, t);

    expect(tabs).toEqual([{ id: 'INTERCEPTOR_RUNNER', label: 'translated(Menu.InterceptorTemplates): 1' }]);

    expect(convertedData.INTERCEPTOR_RUNNER).toEqual([{ id: 'interceptorRunner1' }]);
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

describe('Export Config Utils :: getDeploymentExportPreviewTabs', () => {
  const emptyResponse: DeploymentExportPreviewResponse = {
    deployments: [],
    imageDefinitions: [],
    globalImageBuildDomainWhitelist: [],
  };

  test('returns empty tabs for empty response', () => {
    const { tabs, convertedData } = getDeploymentExportPreviewTabs(emptyResponse, t);
    expect(tabs).toHaveLength(0);
    expect(Object.keys(convertedData)).toHaveLength(0);
  });

  test('groups MCP deployments into MCP_CONTAINER tab', () => {
    const response: DeploymentExportPreviewResponse = {
      ...emptyResponse,
      deployments: [
        {
          id: 'mcp-1',
          displayName: 'MCP 1',
          description: 'desc',
          version: null,
          type: DeploymentExportComponentType.MCP_DEPLOYMENT,
        },
      ],
    };
    const { tabs, convertedData } = getDeploymentExportPreviewTabs(response, t);
    expect(tabs.some((tab) => tab.id === DeploymentExportEntityType.MCP_CONTAINER)).toBe(true);
    expect(convertedData[DeploymentExportEntityType.MCP_CONTAINER]).toHaveLength(1);
    expect(convertedData[DeploymentExportEntityType.MCP_CONTAINER][0].name).toBe('mcp-1');
  });

  test('handles lowercase type values from BE', () => {
    const response: DeploymentExportPreviewResponse = {
      ...emptyResponse,
      deployments: [
        { id: 'mcp-1', displayName: 'MCP 1', description: '', version: null, type: 'mcp_deployment' },
        { id: 'int-1', displayName: 'INT 1', description: '', version: null, type: 'interceptor_deployment' },
      ],
    };
    const { tabs, convertedData } = getDeploymentExportPreviewTabs(response, t);
    expect(tabs.some((tab) => tab.id === DeploymentExportEntityType.MCP_CONTAINER)).toBe(true);
    expect(tabs.some((tab) => tab.id === DeploymentExportEntityType.INTERCEPTOR_CONTAINER)).toBe(true);
    expect(convertedData[DeploymentExportEntityType.MCP_CONTAINER]).toHaveLength(1);
    expect(convertedData[DeploymentExportEntityType.INTERCEPTOR_CONTAINER]).toHaveLength(1);
  });

  test('groups image definitions into IMAGE tab', () => {
    const response: DeploymentExportPreviewResponse = {
      ...emptyResponse,
      imageDefinitions: [
        {
          id: 'img-1',
          displayName: 'Image 1',
          description: null,
          version: '1.0.0',
          type: DeploymentExportComponentType.MCP_IMAGE_DEFINITION,
        },
        {
          id: 'img-2',
          displayName: 'Image 2',
          description: null,
          version: '2.0.0',
          type: DeploymentExportComponentType.ADAPTER_IMAGE_DEFINITION,
        },
      ],
    };
    const { tabs, convertedData } = getDeploymentExportPreviewTabs(response, t);
    expect(tabs.some((tab) => tab.id === DeploymentExportEntityType.IMAGE)).toBe(true);
    expect(convertedData[DeploymentExportEntityType.IMAGE]).toHaveLength(2);
  });

  test('groups NIM and INFERENCE into MODEL_SERVING tab', () => {
    const response: DeploymentExportPreviewResponse = {
      ...emptyResponse,
      deployments: [
        {
          id: 'nim-1',
          displayName: 'NIM 1',
          description: null,
          version: null,
          type: DeploymentExportComponentType.NIM_DEPLOYMENT,
        },
        {
          id: 'inf-1',
          displayName: 'INF 1',
          description: null,
          version: null,
          type: DeploymentExportComponentType.INFERENCE_DEPLOYMENT,
        },
      ],
    };
    const { tabs, convertedData } = getDeploymentExportPreviewTabs(response, t);
    expect(tabs.some((tab) => tab.id === DeploymentExportEntityType.MODEL_SERVING)).toBe(true);
    expect(convertedData[DeploymentExportEntityType.MODEL_SERVING]).toHaveLength(2);
  });

  test('tab labels include counts', () => {
    const response: DeploymentExportPreviewResponse = {
      ...emptyResponse,
      deployments: [
        {
          id: 'mcp-1',
          displayName: 'MCP 1',
          description: null,
          version: null,
          type: DeploymentExportComponentType.MCP_DEPLOYMENT,
        },
        {
          id: 'mcp-2',
          displayName: 'MCP 2',
          description: null,
          version: null,
          type: DeploymentExportComponentType.MCP_DEPLOYMENT,
        },
      ],
    };
    const { tabs } = getDeploymentExportPreviewTabs(response, t);
    const mcpTab = tabs.find((tab) => tab.id === DeploymentExportEntityType.MCP_CONTAINER);
    expect(mcpTab?.label).toContain('2');
  });

  test('maps ExportComponentInfo fields to EntitiesGridData correctly', () => {
    const response: DeploymentExportPreviewResponse = {
      ...emptyResponse,
      deployments: [
        {
          id: 'test-id',
          displayName: 'Test Name',
          description: 'Test Desc',
          version: null,
          type: DeploymentExportComponentType.ADAPTER_DEPLOYMENT,
        },
      ],
    };
    const { convertedData } = getDeploymentExportPreviewTabs(response, t);
    const item = convertedData[DeploymentExportEntityType.ADAPTER_CONTAINER][0];
    expect(item.name).toBe('test-id');
    expect(item.displayName).toBe('Test Name');
    expect(item.description).toBe('Test Desc');
  });

  test('maps image ExportComponentInfo fields to same base fields as containers', () => {
    const response: DeploymentExportPreviewResponse = {
      ...emptyResponse,
      imageDefinitions: [
        {
          id: 'img-uuid',
          displayName: 'My Image',
          description: 'Img Desc',
          version: '1.0.0',
          type: DeploymentExportComponentType.MCP_IMAGE_DEFINITION,
        },
      ],
    };
    const { convertedData } = getDeploymentExportPreviewTabs(response, t);
    const item = convertedData[DeploymentExportEntityType.IMAGE][0];
    expect(item.name).toBe('img-uuid');
    expect(item.displayName).toBe('My Image');
    expect(item.description).toBe('Img Desc');
    expect(item.version).toBe('1.0.0');
  });
});

describe('buildDeploymentExportPreviewRequest', () => {
  test('builds request with custom type and no secrets', () => {
    const result = buildDeploymentExportPreviewRequest({});
    expect(result.$type).toBe(ExportType.Custom);
    expect(result.addSecrets).toBe(false);
    expect(result.addGlobalImageBuildDomainWhitelist).toBe(false);
    expect(result.components).toEqual([]);
  });

  test('includes components from custom export data', () => {
    const data = {
      MCP_CONTAINER: [{ name: 'mcp-1', $type: 'mcp' }],
    };
    const result = buildDeploymentExportPreviewRequest(data as any);
    expect(result.components.length).toBe(1);
    expect(result.components[0].name).toBe('mcp-1');
  });
});
