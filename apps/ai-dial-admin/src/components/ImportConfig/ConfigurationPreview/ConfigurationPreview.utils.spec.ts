import { DeploymentExportEntityType } from '@/src/types/deployments/export';
import { DeploymentImportPreviewResponse } from '@/src/types/deployments/preview';
import { EntityType } from '@/src/types/entity-type';
import { ImportConfigurationAction } from '@/src/types/import';
import { describe, expect, test } from 'vitest';
import {
  getActionClassName,
  getComponentColDefs,
  getConfigurationPreview,
  getDeploymentConfigurationPreview,
  GLOBAL_FIREWALL_TAB_ID,
} from './ConfigurationPreview.utils';
import { FileComponentItem, FileConfiguration } from '@/src/models/import';
import { BaseEntity } from '@/src/models/dial/base-entity';

const makeItem = (importAction: string, next: Partial<BaseEntity>, prev?: Partial<BaseEntity>): FileComponentItem => ({
  importAction,
  next: next as BaseEntity,
  prev: prev as BaseEntity,
});

describe('ConfigurationPreview.utils', () => {
  const t = (v: string) => v;
  const compare = () => void 0;

  test('getConfigurationPreview returns empty tabs for empty config', () => {
    const config: FileConfiguration = {};
    const { tabs } = getConfigurationPreview(config, t);
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs.length).toBe(0);
  });

  test('getConfigurationPreview returns correct previewData and tabs', () => {
    const config: FileConfiguration = {
      models: [makeItem('CREATE', { id: 1 } as unknown as BaseEntity)],
      applications: [makeItem('UPDATE', { id: 2 } as unknown as BaseEntity)],
      routes: [],
      roles: [],
      keys: [],
      applicationRunners: [],
      interceptors: [],
      prompts: [],
      files: [],
    };
    const { previewData, tabs } = getConfigurationPreview(config, t);
    expect(previewData.MODEL).toBeDefined();
    expect(previewData.APPLICATION).toBeDefined();
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs[0].label).toContain('Model');
    expect(tabs[1].label).toContain('Application');
  });

  test('getConfigurationPreview returns correct prevData structure with next/prev fields', () => {
    const config: FileConfiguration = {
      models: [makeItem('CREATE', { id: 1 } as unknown as BaseEntity, { id: 1 } as unknown as BaseEntity)],
      applications: [makeItem('UPDATE', { id: 2 } as unknown as BaseEntity, { id: 2 } as unknown as BaseEntity)],
      routes: [],
      roles: [],
      keys: [],
      applicationRunners: [],
      interceptors: [],
      prompts: [],
      files: [],
    };

    const { previewData, prevData } = getConfigurationPreview(config, t);

    expect(prevData).toBeDefined();

    expect(prevData[EntityType.MODEL]).toBeDefined();
    expect(prevData[EntityType.APPLICATION]).toBeDefined();

    expect(prevData[EntityType.MODEL].length).toBe(previewData[EntityType.MODEL].length);
    expect(prevData[EntityType.APPLICATION].length).toBe(previewData[EntityType.APPLICATION].length);

    expect(prevData[EntityType.MODEL][0]?.id).toBe(1);
    expect(prevData[EntityType.APPLICATION][0]?.id).toBe(2);

    expect(previewData[EntityType.MODEL][0].id).toBe(1);
    expect(previewData[EntityType.APPLICATION][0].id).toBe(2);

    expect(prevData[EntityType.ROUTE]).toEqual([]);
  });

  test('getConfigurationPreview returns prevData with undefined items when no previous items exist', () => {
    const config: FileConfiguration = {
      models: [makeItem('CREATE', { id: 1 } as unknown as BaseEntity)],
      roles: [makeItem('UPDATE', { id: 2 } as unknown as BaseEntity)],
    };

    const { previewData, prevData } = getConfigurationPreview(config, t);

    expect(prevData[EntityType.MODEL][0]).toBeUndefined();
    expect(prevData[EntityType.ROLE][0]).toBeUndefined();

    expect(previewData[EntityType.MODEL]).toHaveLength(1);
    expect(previewData[EntityType.ROLE]).toHaveLength(1);
    expect(previewData[EntityType.MODEL][0].id).toBe(1);
    expect(previewData[EntityType.ROLE][0].id).toBe(2);
  });

  test('getConfigurationPreview handles empty config correctly with prevData', () => {
    const config: FileConfiguration = {};
    const { previewData, prevData, tabs } = getConfigurationPreview(config, t);

    expect(Object.keys(previewData).length).toBe(0);
    expect(Object.keys(prevData).length).toBe(0);

    expect(tabs).toBeDefined();
    expect(tabs.length).toBe(0);
  });

  test('getConfigurationPreview returns correct prevData when configuration has mixed items with next/prev fields', () => {
    const config: FileConfiguration = {
      models: [makeItem('CREATE', { id: 1 } as unknown as BaseEntity, { id: 1 } as unknown as BaseEntity)],
      roles: [makeItem('UPDATE', { id: 2 } as unknown as BaseEntity, { id: 2 } as unknown as BaseEntity)],
      routes: [],
    };

    const { previewData, prevData } = getConfigurationPreview(config, t);

    expect(previewData[EntityType.MODEL]).toHaveLength(1);
    expect(previewData[EntityType.ROLE]).toHaveLength(1);
    expect(prevData[EntityType.MODEL]).toBeDefined();
    expect(prevData[EntityType.ROLE]).toBeDefined();

    expect(prevData[EntityType.MODEL].length).toBe(previewData[EntityType.MODEL].length);
    expect(prevData[EntityType.ROLE].length).toBe(previewData[EntityType.ROLE].length);

    expect(prevData[EntityType.MODEL][0]?.id).toBe(1);
    expect(prevData[EntityType.ROLE][0]?.id).toBe(2);

    expect(previewData[EntityType.MODEL][0].id).toBe(1);
    expect(previewData[EntityType.ROLE][0].id).toBe(2);

    expect(prevData[EntityType.ROUTE]).toEqual([]);
  });

  test('getConfigurationPreview handles missing configuration keys gracefully', () => {
    const config: FileConfiguration = {
      models: [makeItem('CREATE', { id: 1 } as unknown as BaseEntity, { id: 1 } as unknown as BaseEntity)],
    };

    const { previewData, prevData } = getConfigurationPreview(config, t);

    expect(previewData[EntityType.MODEL]).toHaveLength(1);
    expect(prevData[EntityType.MODEL]).toBeDefined();

    expect(prevData[EntityType.APPLICATION]).toBeUndefined();
    expect(prevData[EntityType.ROUTE]).toBeUndefined();
  });

  test('getActionClassName returns correct class', () => {
    expect(getActionClassName(ImportConfigurationAction.CREATE)).toBe('bg-accent-primary');
    expect(getActionClassName(ImportConfigurationAction.UPDATE)).toBe('bg-orange-400');
    expect(getActionClassName(ImportConfigurationAction.OTHER)).toBe('bg-controls-disable');
  });

  test('getComponentColDefs returns correct columns for MODEL', () => {
    const cols = getComponentColDefs(EntityType.MODEL, t, compare);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('displayName');
  });

  test('getComponentColDefs returns correct columns for APPLICATION', () => {
    const cols = getComponentColDefs(EntityType.APPLICATION, t, compare);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('displayName');
  });

  test('getComponentColDefs returns correct columns for ROUTE/ROLE/INTERCEPTOR', () => {
    ['ROUTE', 'ROLE', 'INTERCEPTOR'].forEach((type) => {
      const cols = getComponentColDefs(type, t, compare);
      expect(cols[0].field).toBe('action');
      expect(cols[1].field).toBe('displayName');
    });
  });

  test('getComponentColDefs returns correct columns for APPLICATION_TYPE_SCHEMA', () => {
    const cols = getComponentColDefs(EntityType.APPLICATION_TYPE_SCHEMA, t, compare);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('dial:applicationTypeDisplayName');
  });

  test('getComponentColDefs returns correct columns for KEY', () => {
    const cols = getComponentColDefs(EntityType.KEY, t, compare);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('displayName');
  });

  test('getComponentColDefs returns BASE_COLUMNS for unknown type', () => {
    const cols = getComponentColDefs('UNKNOWN', t, compare);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('displayName');
  });

  describe('getDeploymentConfigurationPreview', () => {
    const emptyResponse: DeploymentImportPreviewResponse = {
      mcpDeployments: [],
      adapterDeployments: [],
      interceptorDeployments: [],
      nimDeployments: [],
      inferenceDeployments: [],
      mcpImageDefinitions: [],
      adapterImageDefinitions: [],
      interceptorImageDefinitions: [],
      globalImageBuildDomainWhitelist: null,
    };

    test('returns empty tabs for empty response', () => {
      const { tabs, previewData, prevData, globalFirewall } = getDeploymentConfigurationPreview(emptyResponse, t);
      expect(tabs).toHaveLength(0);
      expect(Object.keys(previewData)).toHaveLength(0);
      expect(Object.keys(prevData)).toHaveLength(0);
      expect(globalFirewall).toBeNull();
    });

    test('groups MCP deployments into MCP_CONTAINER tab', () => {
      const response: DeploymentImportPreviewResponse = {
        ...emptyResponse,
        mcpDeployments: [makeItem('CREATE', { name: 'mcp-1', displayName: 'MCP 1' })],
      };
      const { tabs, previewData } = getDeploymentConfigurationPreview(response, t);

      expect(tabs.some((tab) => tab.id === DeploymentExportEntityType.MCP_CONTAINER)).toBe(true);
      expect(previewData[DeploymentExportEntityType.MCP_CONTAINER]).toHaveLength(1);
    });

    test('groups image definitions into IMAGE tab', () => {
      const response: DeploymentImportPreviewResponse = {
        ...emptyResponse,
        mcpImageDefinitions: [makeItem('CREATE', { name: 'img-1' })],
        adapterImageDefinitions: [makeItem('UPDATE', { name: 'img-2' }, { name: 'img-2-old' })],
      };
      const { tabs, previewData } = getDeploymentConfigurationPreview(response, t);

      expect(tabs.some((tab) => tab.id === DeploymentExportEntityType.IMAGE)).toBe(true);
      expect(previewData[DeploymentExportEntityType.IMAGE]).toHaveLength(2);
    });

    test('groups nim and inference deployments into MODEL_SERVING tab', () => {
      const response: DeploymentImportPreviewResponse = {
        ...emptyResponse,
        nimDeployments: [makeItem('CREATE', { name: 'nim-1' })],
        inferenceDeployments: [makeItem('CREATE', { name: 'inf-1' })],
      };
      const { tabs, previewData } = getDeploymentConfigurationPreview(response, t);

      expect(tabs.some((tab) => tab.id === DeploymentExportEntityType.MODEL_SERVING)).toBe(true);
      expect(previewData[DeploymentExportEntityType.MODEL_SERVING]).toHaveLength(2);
    });

    test('includes Global Firewall tab when whitelist present', () => {
      const response: DeploymentImportPreviewResponse = {
        ...emptyResponse,
        globalImageBuildDomainWhitelist: makeItem(
          'UPDATE',
          ['a.com', 'b.com'] as unknown as BaseEntity,
          ['a.com'] as unknown as BaseEntity,
        ),
      };
      const { tabs, globalFirewall } = getDeploymentConfigurationPreview(response, t);

      expect(tabs.some((tab) => tab.id === GLOBAL_FIREWALL_TAB_ID)).toBe(true);
      expect(globalFirewall).not.toBeNull();
      expect(globalFirewall?.importAction).toBe('UPDATE');
    });

    test('omits Global Firewall tab when whitelist is null', () => {
      const { tabs, globalFirewall } = getDeploymentConfigurationPreview(emptyResponse, t);

      expect(tabs.some((tab) => tab.id === GLOBAL_FIREWALL_TAB_ID)).toBe(false);
      expect(globalFirewall).toBeNull();
    });

    test('tab labels include counts', () => {
      const response: DeploymentImportPreviewResponse = {
        ...emptyResponse,
        mcpDeployments: [
          makeItem('CREATE', { name: 'mcp-1' }),
          makeItem('UPDATE', { name: 'mcp-2' }, { name: 'mcp-2-old' }),
        ],
      };
      const { tabs } = getDeploymentConfigurationPreview(response, t);
      const mcpTab = tabs.find((tab) => tab.id === DeploymentExportEntityType.MCP_CONTAINER);
      expect(mcpTab?.label).toContain('2');
    });

    test('preserves prev data for deployment items', () => {
      const response: DeploymentImportPreviewResponse = {
        ...emptyResponse,
        adapterDeployments: [makeItem('UPDATE', { name: 'a-1' }, { name: 'a-1-old' })],
      };
      const { prevData } = getDeploymentConfigurationPreview(response, t);

      expect(prevData[DeploymentExportEntityType.ADAPTER_CONTAINER]).toBeDefined();
      expect(prevData[DeploymentExportEntityType.ADAPTER_CONTAINER][0]).toBeDefined();
    });
  });
});
