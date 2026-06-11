import { DeploymentExportEntityType } from '@/src/types/deployments/export';
import { DeploymentImportPreviewResponse } from '@/src/models/deployments/preview';
import { EntityType } from '@/src/types/entity-type';
import { ImportConfigurationAction } from '@/src/types/import';
import { ExportConfigComponentType, ValidationError, ValidationState } from '@/src/types/deployments/import';
import { RowImportMeta } from '@/src/models/deployments/import';
import { describe, expect, test } from 'vitest';
import {
  buildErrorsByTab,
  filterArtifactErrors,
  formatValidationLine,
  getActionClassName,
  getComponentColDefs,
  getConfigurationPreview,
  getDeploymentConfigurationPreview,
  groupErrorsByEntity,
} from './ConfigurationPreview.utils';
import { COMPONENT_TYPE_TO_TAB_ID, GLOBAL_FIREWALL_TAB_ID } from '@/src/constants/deployments/import';
import { ROW_IMPORT_META_KEY } from '@/src/constants/import';
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

  describe('validation utilities', () => {
    const error = (overrides: Partial<ValidationError>): ValidationError => ({
      entityType: ExportConfigComponentType.MCP_DEPLOYMENT,
      entityIdentifier: 'echo',
      fieldPath: 'name',
      message: 'must not be null',
      ...overrides,
    });

    test('filterArtifactErrors drops GLOBAL_DOMAIN_WHITELIST entries', () => {
      const errors = [
        error({ entityType: ExportConfigComponentType.MCP_DEPLOYMENT }),
        error({
          entityType: ExportConfigComponentType.GLOBAL_DOMAIN_WHITELIST,
          fieldPath: 'globalImageBuildDomainWhitelist',
        }),
        error({ entityType: ExportConfigComponentType.ADAPTER_DEPLOYMENT, entityIdentifier: 'foo' }),
      ];
      const result = filterArtifactErrors(errors);
      expect(result).toHaveLength(2);
      expect(result.every((e) => e.entityType !== ExportConfigComponentType.GLOBAL_DOMAIN_WHITELIST)).toBe(true);
    });

    test('filterArtifactErrors handles undefined input', () => {
      expect(filterArtifactErrors(undefined)).toEqual([]);
    });

    test('groupErrorsByEntity groups errors for the same entity', () => {
      const errors = [
        error({ fieldPath: 'name' }),
        error({ fieldPath: 'displayName' }),
        error({ fieldPath: 'description' }),
      ];
      const result = groupErrorsByEntity(errors);
      expect(result.get(`${ExportConfigComponentType.MCP_DEPLOYMENT}::echo`)).toHaveLength(3);
    });

    test('groupErrorsByEntity keeps same identifier under different types separate', () => {
      const errors = [
        error({ entityType: ExportConfigComponentType.MCP_DEPLOYMENT }),
        error({ entityType: ExportConfigComponentType.ADAPTER_DEPLOYMENT }),
      ];
      const result = groupErrorsByEntity(errors);
      expect(result.size).toBe(2);
    });

    test('buildErrorsByTab counts unique entities, not raw errors', () => {
      const errors = [
        error({ entityType: ExportConfigComponentType.MCP_DEPLOYMENT, entityIdentifier: 'a' }),
        error({
          entityType: ExportConfigComponentType.MCP_DEPLOYMENT,
          entityIdentifier: 'a',
          fieldPath: 'displayName',
        }),
        error({ entityType: ExportConfigComponentType.MCP_DEPLOYMENT, entityIdentifier: 'b' }),
        error({ entityType: ExportConfigComponentType.MCP_IMAGE_DEFINITION, entityIdentifier: 'img-1' }),
      ];
      const result = buildErrorsByTab(errors);
      expect(result[DeploymentExportEntityType.MCP_CONTAINER]).toBe(2);
      expect(result[DeploymentExportEntityType.IMAGE]).toBe(1);
    });

    test('NIM and Inference both map to MODEL_SERVING tab', () => {
      expect(COMPONENT_TYPE_TO_TAB_ID[ExportConfigComponentType.NIM_DEPLOYMENT]).toBe(
        DeploymentExportEntityType.MODEL_SERVING,
      );
      expect(COMPONENT_TYPE_TO_TAB_ID[ExportConfigComponentType.INFERENCE_DEPLOYMENT]).toBe(
        DeploymentExportEntityType.MODEL_SERVING,
      );
    });

    test('formatValidationLine: non-empty fieldPath → "field: message"', () => {
      expect(formatValidationLine(error({ fieldPath: 'name', message: 'bad' }))).toBe('name: bad');
    });

    test('formatValidationLine: empty fieldPath → message only', () => {
      expect(formatValidationLine(error({ fieldPath: '', message: 'Mapping failed: NPE' }))).toBe(
        'Mapping failed: NPE',
      );
    });
  });

  describe('getDeploymentConfigurationPreview — validation enrichment', () => {
    const baseResponse = (): DeploymentImportPreviewResponse => ({
      mcpDeployments: [],
      adapterDeployments: [],
      applicationDeployments: [],
      interceptorDeployments: [],
      nimDeployments: [],
      inferenceDeployments: [],
      mcpImageDefinitions: [],
      adapterImageDefinitions: [],
      applicationImageDefinitions: [],
      interceptorImageDefinitions: [],
      globalImageBuildDomainWhitelist: null,
    });

    const error = (overrides: Partial<ValidationError>): ValidationError => ({
      entityType: ExportConfigComponentType.MCP_DEPLOYMENT,
      entityIdentifier: 'echo',
      fieldPath: 'name',
      message: 'must not be null',
      ...overrides,
    });

    test('absent validationErrors → all rows VALIDATED, summary clean, no tab marked invalid', () => {
      const response = baseResponse();
      response.mcpDeployments = [makeItem('CREATE', { name: 'echo' }), makeItem('CREATE', { name: 'gpt-world' })];

      const { previewData, tabs, validationSummary } = getDeploymentConfigurationPreview(response, t);
      const rows = previewData[DeploymentExportEntityType.MCP_CONTAINER] as Array<Record<string, unknown>>;
      rows.forEach((r) => {
        expect((r[ROW_IMPORT_META_KEY] as { validationState: ValidationState }).validationState).toBe(
          ValidationState.VALIDATED,
        );
      });
      expect(validationSummary).toEqual({ totalFailed: 0, errorsByTab: {} });
      expect(tabs.find((tab) => tab.id === DeploymentExportEntityType.MCP_CONTAINER)?.invalid).toBe(false);
    });

    test('mixed valid/invalid → only failing rows are FAILED; tab marked invalid', () => {
      const response = baseResponse();
      response.mcpDeployments = [makeItem('CREATE', { name: 'echo' }), makeItem('CREATE', { name: 'gpt-world' })];
      response.validationErrors = [error({ entityIdentifier: 'echo' })];

      const { previewData, tabs, validationSummary } = getDeploymentConfigurationPreview(response, t);
      const rows = previewData[DeploymentExportEntityType.MCP_CONTAINER] as Array<Record<string, unknown>>;
      const echoMeta = rows.find((r) => r.name === 'echo')?.[ROW_IMPORT_META_KEY] as {
        validationState: ValidationState;
      };
      const gptMeta = rows.find((r) => r.name === 'gpt-world')?.[ROW_IMPORT_META_KEY] as {
        validationState: ValidationState;
      };
      expect(echoMeta.validationState).toBe(ValidationState.FAILED);
      expect(gptMeta.validationState).toBe(ValidationState.VALIDATED);
      expect(validationSummary.totalFailed).toBe(1);
      expect(tabs.find((tab) => tab.id === DeploymentExportEntityType.MCP_CONTAINER)?.invalid).toBe(true);
    });

    test('firewall errors are grouped by domain, counted in totalFailed, and mark the firewall tab invalid', () => {
      const response = baseResponse();
      response.mcpDeployments = [makeItem('CREATE', { name: 'echo' })];
      response.globalImageBuildDomainWhitelist = makeItem('UPDATE', ['bad!', 'also bad!!'] as unknown as BaseEntity);
      response.validationErrors = [
        error({ entityIdentifier: 'echo' }),
        error({
          entityType: ExportConfigComponentType.GLOBAL_DOMAIN_WHITELIST,
          entityIdentifier: 'bad!',
          fieldPath: 'globalImageBuildDomainWhitelist',
          message: "domain 'bad!' is not a valid domain name",
        }),
        error({
          entityType: ExportConfigComponentType.GLOBAL_DOMAIN_WHITELIST,
          entityIdentifier: 'also bad!!',
          fieldPath: 'globalImageBuildDomainWhitelist',
          message: "domain 'also bad!!' is not a valid domain name",
        }),
      ];

      const { tabs, validationSummary, firewallErrorsByDomain } = getDeploymentConfigurationPreview(response, t);

      expect(firewallErrorsByDomain).toEqual({
        'bad!': ["domain 'bad!' is not a valid domain name"],
        'also bad!!': ["domain 'also bad!!' is not a valid domain name"],
      });
      expect(validationSummary.totalFailed).toBe(3);
      expect(validationSummary.errorsByTab).toEqual({ [DeploymentExportEntityType.MCP_CONTAINER]: 1 });
      expect(tabs.find((tab) => tab.id === GLOBAL_FIREWALL_TAB_ID)?.invalid).toBe(true);
    });

    test('clean firewall → empty error map, tab not invalid', () => {
      const response = baseResponse();
      response.globalImageBuildDomainWhitelist = makeItem('UPDATE', ['a.com'] as unknown as BaseEntity);

      const { tabs, validationSummary, firewallErrorsByDomain } = getDeploymentConfigurationPreview(response, t);

      expect(firewallErrorsByDomain).toEqual({});
      expect(validationSummary.totalFailed).toBe(0);
      expect(tabs.find((tab) => tab.id === GLOBAL_FIREWALL_TAB_ID)?.invalid).toBe(false);
    });

    test('IMAGE-tab join: error matches by next.name even after row.name is clobbered', () => {
      const response = baseResponse();
      response.mcpImageDefinitions = [
        makeItem(
          'UPDATE',
          { name: 'img-foo' } as Partial<BaseEntity>,
          { id: 'prev-uuid-123' } as unknown as BaseEntity,
        ),
      ];
      response.validationErrors = [
        error({ entityType: ExportConfigComponentType.MCP_IMAGE_DEFINITION, entityIdentifier: 'img-foo' }),
      ];

      const { previewData } = getDeploymentConfigurationPreview(response, t);
      const rows = previewData[DeploymentExportEntityType.IMAGE] as Array<Record<string, unknown>>;
      expect(rows[0].name).toBe('prev-uuid-123');
      expect(rows[0].displayName).toBe('img-foo');

      const meta = rows[0][ROW_IMPORT_META_KEY] as RowImportMeta;
      expect(meta.validationState).toBe(ValidationState.FAILED);
      expect(meta.validationErrors).toHaveLength(1);
    });

    test('identifier collision across types does not bleed errors', () => {
      const response = baseResponse();
      response.mcpDeployments = [makeItem('CREATE', { name: 'echo' })];
      response.adapterDeployments = [makeItem('CREATE', { name: 'echo' })];
      response.validationErrors = [
        error({ entityType: ExportConfigComponentType.MCP_DEPLOYMENT, entityIdentifier: 'echo' }),
      ];

      const { previewData } = getDeploymentConfigurationPreview(response, t);
      const mcpMeta = (previewData[DeploymentExportEntityType.MCP_CONTAINER][0] as Record<string, unknown>)[
        ROW_IMPORT_META_KEY
      ] as { validationState: ValidationState };
      const adapterMeta = (previewData[DeploymentExportEntityType.ADAPTER_CONTAINER][0] as Record<string, unknown>)[
        ROW_IMPORT_META_KEY
      ] as { validationState: ValidationState };
      expect(mcpMeta.validationState).toBe(ValidationState.FAILED);
      expect(adapterMeta.validationState).toBe(ValidationState.VALIDATED);
    });

    test('IMAGE error keyed as `${name}(${version})` matches by composite candidate', () => {
      const response = baseResponse();
      response.mcpImageDefinitions = [
        makeItem(
          'UPDATE',
          { name: 'Registry image', version: '1.0.0' } as Partial<BaseEntity>,
          { id: '3ae3b052-21f6' } as unknown as BaseEntity,
        ),
      ];
      response.validationErrors = [
        error({
          entityType: ExportConfigComponentType.MCP_IMAGE_DEFINITION,
          entityIdentifier: 'Registry image(1.0.0)',
          fieldPath: 'source.externalRegistryRef.version',
          message: 'must not be blank',
        }),
      ];

      const { previewData, validationSummary } = getDeploymentConfigurationPreview(response, t);
      const rows = previewData[DeploymentExportEntityType.IMAGE] as Array<Record<string, unknown>>;
      const meta = rows[0][ROW_IMPORT_META_KEY] as RowImportMeta;
      expect(meta.validationState).toBe(ValidationState.FAILED);
      expect(meta.validationErrors).toHaveLength(1);
      expect(validationSummary.totalFailed).toBe(1);
    });

    test('multiple errors for the same entity surface in row meta; totalFailed counts entities', () => {
      const response = baseResponse();
      response.mcpDeployments = [makeItem('CREATE', { name: 'echo' })];
      response.validationErrors = [
        error({ fieldPath: 'name', message: 'bad' }),
        error({ fieldPath: 'displayName', message: 'must not be null' }),
      ];

      const { previewData, validationSummary } = getDeploymentConfigurationPreview(response, t);
      const meta = (previewData[DeploymentExportEntityType.MCP_CONTAINER][0] as Record<string, unknown>)[
        ROW_IMPORT_META_KEY
      ] as { validationErrors: ValidationError[] };
      expect(meta.validationErrors).toHaveLength(2);
      expect(validationSummary.totalFailed).toBe(1);
    });
  });
});
