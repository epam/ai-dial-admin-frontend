import { getButtonTitle, getAvailableData } from '../utils';
import { ButtonsI18nKey, ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import * as AddEntitiesUtils from '@/src/components/AddEntitiesTab/utils';
import { DeploymentExportEntityType } from '@/src/types/deployments/export';
import { EntityType } from '@/src/types/entity-type';
import { DEPLOYMENT_IMAGE_DEP } from '@/src/utils/entities/get-export-deps';
import { beforeEach, describe, expect, test, vi } from 'vitest';
vi.mock('@/src/components/AddEntitiesTab/utils');

const mockGetAvailableEntities = AddEntitiesUtils.getAvailableEntities;

describe('Export Config Utils :: getButtonTitle', () => {
  const mockTranslate = (v: string) => v;

  test('Should return title for MODEL (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.MODEL, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Models}`);
  });

  test('Should return title for APPLICATION (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.APPLICATION, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Applications}`);
  });

  test('Should return title for ROUTE (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.ROUTE, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Routes}`);
  });

  test('Should return title for TOOLSET (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.TOOLSET, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Toolsets}`);
  });

  test('Should return title for INTERCEPTOR_RUNNER (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.INTERCEPTOR_RUNNER, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.InterceptorTemplates}`);
  });

  test('Should return title for key (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.KEY, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Keys}`);
  });

  test('Should return title for prompts (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.PROMPT, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Prompts}`);
  });

  test('Should return title for roles (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.ROLE, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Roles}`);
  });

  test('Should return title for adapter (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.ADAPTER, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Adapters}`);
  });

  test('Should return title for application runners (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.APPLICATION_TYPE_SCHEMA, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.ApplicationRunners}`);
  });

  test('Should return title for files (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.FILE, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Files}`);
  });

  test('Should return title for models (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.MODEL, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Models}`);
  });

  test('Should return title for applications (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.APPLICATION, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Applications}`);
  });

  test('Should return title for routes (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.ROUTE, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Routes}`);
  });

  test('Should return title for interceptors (full)', () => {
    const res = getButtonTitle(mockTranslate, EntityType.INTERCEPTOR, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Interceptors}`);
  });

  test('Should return only label (not full) for interceptors', () => {
    const res = getButtonTitle(mockTranslate, EntityType.INTERCEPTOR, false);
    expect(res).toBe(MenuI18nKey.Interceptors);
  });

  test('Should return only label (not full) for Toolsets', () => {
    const res = getButtonTitle(mockTranslate, EntityType.TOOLSET, false);
    expect(res).toBe(MenuI18nKey.Toolsets);
  });

  test('Should return empty string for undefined tab', () => {
    const res = getButtonTitle(mockTranslate, undefined, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} `);
  });

  test('Should return empty string if no selected tab and not full', () => {
    const res = getButtonTitle(mockTranslate, undefined, false);
    expect(res).toBe('');
  });

  test('Should return title for MCP_CONTAINER (full)', () => {
    const res = getButtonTitle(mockTranslate, DeploymentExportEntityType.MCP_CONTAINER as EntityType, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.McpContainers}`);
  });

  test('Should return title for INTERCEPTOR_CONTAINER (full)', () => {
    const res = getButtonTitle(mockTranslate, DeploymentExportEntityType.INTERCEPTOR_CONTAINER as EntityType, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.InterceptorContainers}`);
  });

  test('Should return title for ADAPTER_CONTAINER (full)', () => {
    const res = getButtonTitle(mockTranslate, DeploymentExportEntityType.ADAPTER_CONTAINER as EntityType, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.AdapterContainers}`);
  });

  test('Should return title for MODEL_SERVING (full)', () => {
    const res = getButtonTitle(mockTranslate, DeploymentExportEntityType.MODEL_SERVING as EntityType, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.ModelServings}`);
  });

  test('Should return title for IMAGE (full)', () => {
    const res = getButtonTitle(mockTranslate, DeploymentExportEntityType.IMAGE as EntityType, true);
    expect(res).toBe(`${ButtonsI18nKey.Add} ${MenuI18nKey.Images}`);
  });

  test('Should return label for MCP_IMAGE dependency', () => {
    const res = getButtonTitle(mockTranslate, DEPLOYMENT_IMAGE_DEP.MCP as unknown as EntityType);
    expect(res).toBe(ExportI18nKey.McpImage);
  });

  test('Should return label for INTERCEPTOR_IMAGE dependency', () => {
    const res = getButtonTitle(mockTranslate, DEPLOYMENT_IMAGE_DEP.INTERCEPTOR as unknown as EntityType);
    expect(res).toBe(ExportI18nKey.InterceptorImage);
  });

  test('Should return label for ADAPTER_IMAGE dependency', () => {
    const res = getButtonTitle(mockTranslate, DEPLOYMENT_IMAGE_DEP.ADAPTER as unknown as EntityType);
    expect(res).toBe(ExportI18nKey.AdapterImage);
  });
});

describe('Export Config Utils :: getAvailableData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const entity = (id: string, type: string, topics: string[] = []): EntitiesGridData =>
    ({
      id,
      type,
      topics,
    }) as EntitiesGridData;

  test('should filter and return available MODEL entities based on selected topics', () => {
    const tabData = {
      MODEL: [entity('m1', MenuI18nKey.Models, ['topic1', 'topic2']), entity('m2', 'OTHER', ['topic3'])],
    };
    const customExportData = {
      MODEL: [entity('m3', MenuI18nKey.Models, ['topic1'])],
    };

    const selectedTopics = ['topic1'];

    mockGetAvailableEntities.mockReturnValue(['filtered']);

    const result = getAvailableData(EntityType.MODEL, tabData, customExportData, 'MODEL', selectedTopics);

    expect(mockGetAvailableEntities).toHaveBeenCalledWith(
      [entity('m3', MenuI18nKey.Models, ['topic1'])],
      [entity('m1', MenuI18nKey.Models, ['topic1', 'topic2'])],
    );
    expect(result).toEqual(['filtered']);
  });

  test('should return all available MODEL entities when selectedTopics is empty', () => {
    const tabData = {
      MODEL: [entity('m1', MenuI18nKey.Models, ['topic1', 'topic2']), entity('m2', 'OTHER', ['topic3'])],
    };
    const customExportData = {
      MODEL: [entity('m3', MenuI18nKey.Models, ['topic1'])],
    };

    const selectedTopics = [];

    mockGetAvailableEntities.mockReturnValue(['filtered']);

    const result = getAvailableData(EntityType.MODEL, tabData, customExportData, 'MODEL', selectedTopics);

    expect(mockGetAvailableEntities).toHaveBeenCalledWith(
      [entity('m3', MenuI18nKey.Models, ['topic1'])],
      [entity('m1', MenuI18nKey.Models, ['topic1', 'topic2'])],
    );
    expect(result).toEqual(['filtered']);
  });

  test('should filter and return available APPLICATION entities based on selected topics', () => {
    const tabData = {
      APPLICATION: [entity('a1', MenuI18nKey.Applications, ['topic1']), entity('a2', 'OTHER', ['topic2'])],
    };
    const customExportData = {
      APPLICATION: [entity('a3', MenuI18nKey.Applications, ['topic1'])],
    };

    const selectedTopics = ['topic1'];

    mockGetAvailableEntities.mockReturnValue(['filtered-apps']);

    const result = getAvailableData(EntityType.APPLICATION, tabData, customExportData, 'APPLICATION', selectedTopics);

    expect(mockGetAvailableEntities).toHaveBeenCalledWith(
      [entity('a3', MenuI18nKey.Applications, ['topic1'])],
      [entity('a1', MenuI18nKey.Applications, ['topic1'])],
    );
    expect(result).toEqual(['filtered-apps']);
  });

  test('should return all available APPLICATION entities when selectedTopics is empty', () => {
    const tabData = {
      APPLICATION: [entity('a1', MenuI18nKey.Applications, ['topic1']), entity('a2', 'OTHER', ['topic2'])],
    };
    const customExportData = {
      APPLICATION: [entity('a3', MenuI18nKey.Applications, ['topic1'])],
    };

    const selectedTopics = [];

    mockGetAvailableEntities.mockReturnValue(['filtered-apps']);

    const result = getAvailableData(EntityType.APPLICATION, tabData, customExportData, 'APPLICATION', selectedTopics);

    expect(mockGetAvailableEntities).toHaveBeenCalledWith(
      [entity('a3', MenuI18nKey.Applications, ['topic1'])],
      [entity('a1', MenuI18nKey.Applications, ['topic1'])],
    );
    expect(result).toEqual(['filtered-apps']);
  });

  test('should filter and return available TOOLSET entities based on selected topics', () => {
    const tabData = {
      TOOLSET: [entity('t1', MenuI18nKey.Toolsets, ['topic1']), entity('t2', 'OTHER', ['topic2'])],
    };
    const customExportData = {
      TOOLSET: [entity('t3', MenuI18nKey.Toolsets, ['topic1'])],
    };

    const selectedTopics = ['topic1'];

    mockGetAvailableEntities.mockReturnValue(['filtered-toolsets']);

    const result = getAvailableData(EntityType.TOOLSET, tabData, customExportData, 'TOOLSET', selectedTopics);

    expect(mockGetAvailableEntities).toHaveBeenCalledWith(
      [entity('t3', MenuI18nKey.Toolsets, ['topic1'])],
      [entity('t1', MenuI18nKey.Toolsets, ['topic1'])],
    );
    expect(result).toEqual(['filtered-toolsets']);
  });

  test('should return all available TOOLSET entities when selectedTopics is empty', () => {
    const tabData = {
      TOOLSET: [entity('t1', MenuI18nKey.Toolsets, ['topic1']), entity('t2', 'OTHER', ['topic2'])],
    };
    const customExportData = {
      TOOLSET: [entity('t3', MenuI18nKey.Toolsets, ['topic1'])],
    };

    const selectedTopics = [];

    mockGetAvailableEntities.mockReturnValue(['filtered-toolsets']);

    const result = getAvailableData(EntityType.TOOLSET, tabData, customExportData, 'TOOLSET', selectedTopics);

    expect(mockGetAvailableEntities).toHaveBeenCalledWith(
      [entity('t3', MenuI18nKey.Toolsets, ['topic1'])],
      [entity('t1', MenuI18nKey.Toolsets, ['topic1'])],
    );
    expect(result).toEqual(['filtered-toolsets']);
  });

  test('should handle APPLICATION_TYPE_SCHEMA entities with selected topics', () => {
    const tabData = {
      APPLICATION_TYPE_SCHEMA: [entity('schema1', MenuI18nKey.ApplicationRunners, ['topic1'])],
    };
    const customExportData = {
      APPLICATION_TYPE_SCHEMA: [entity('schema2', MenuI18nKey.ApplicationRunners, ['topic2'])],
    };

    const selectedTopics = ['topic1'];

    mockGetAvailableEntities.mockReturnValue(['filtered-schemas']);

    const result = getAvailableData(
      EntityType.APPLICATION_TYPE_SCHEMA,
      tabData,
      customExportData,
      'APPLICATION_TYPE_SCHEMA',
      selectedTopics,
    );

    expect(mockGetAvailableEntities).toHaveBeenCalledWith(
      [entity('schema2', MenuI18nKey.ApplicationRunners, ['topic2'])],
      [entity('schema1', MenuI18nKey.ApplicationRunners, ['topic1'])],
    );
    expect(result).toEqual(['filtered-schemas']);
  });

  test('should return empty array when no data is available for APPLICATION_TYPE_SCHEMA', () => {
    const tabData = {
      APPLICATION_TYPE_SCHEMA: [],
    };
    const customExportData = {
      APPLICATION_TYPE_SCHEMA: [],
    };

    const selectedTopics = ['topic1'];

    mockGetAvailableEntities.mockReturnValue([]);

    const result = getAvailableData(
      EntityType.APPLICATION_TYPE_SCHEMA,
      tabData,
      customExportData,
      'APPLICATION_TYPE_SCHEMA',
      selectedTopics,
    );

    expect(result).toEqual([]);
  });

  test('should fallback to empty arrays when no tab data is provided', () => {
    mockGetAvailableEntities.mockReturnValue([]);

    const result = getAvailableData(EntityType.MODEL, {}, {}, 'MODEL', ['topic1']);

    expect(result).toEqual([]);
  });
});
