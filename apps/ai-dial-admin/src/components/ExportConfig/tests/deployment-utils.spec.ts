import { describe, expect, test, vi } from 'vitest';

import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { IMAGE_TYPE } from '@/src/types/deployments/images';
import { DeploymentExportComponentType, DeploymentExportEntityType } from '@/src/types/deployments/export';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import {
  DESCRIPTION_COLUMN,
  DISPLAY_NAME_COLUMN_WITH_SORT,
  NAME_COLUMN,
  VERSION_COLUMN,
} from '@/src/constants/grid-columns/base-columns';
import {
  getDeploymentTabs,
  getDeploymentButtonTitle,
  getDeploymentColDefs,
  getDeploymentExportComponents,
} from '../deployment-utils';

const mockT = (key: string) => key;

describe('ExportConfig :: getDeploymentTabs', () => {
  test('returns 5 tabs', () => {
    const tabs = getDeploymentTabs(mockT);
    expect(tabs).toHaveLength(5);
  });

  test('returns tabs with correct ids', () => {
    const tabs = getDeploymentTabs(mockT);
    const ids = tabs.map((t) => t.id);
    expect(ids).toEqual([
      DeploymentExportEntityType.MODEL_SERVING,
      DeploymentExportEntityType.MCP_CONTAINER,
      DeploymentExportEntityType.INTERCEPTOR_CONTAINER,
      DeploymentExportEntityType.ADAPTER_CONTAINER,
      DeploymentExportEntityType.IMAGE,
    ]);
  });

  test('uses translation function for labels', () => {
    const translate = vi.fn((key: string) => `translated_${key}`);
    const tabs = getDeploymentTabs(translate);

    expect(translate).toHaveBeenCalledTimes(5);
    expect(tabs[0].label).toBe('translated_Menu.ModelServings');
  });
});

describe('ExportConfig :: getDeploymentButtonTitle', () => {
  test('returns button title with translated entity name', () => {
    const result = getDeploymentButtonTitle(mockT, DeploymentExportEntityType.MCP_CONTAINER);
    expect(result).toBe('Buttons.Add Menu.McpContainers');
  });

  test('returns button title with empty entity for unknown tab', () => {
    const result = getDeploymentButtonTitle(mockT, 'UNKNOWN');
    expect(result).toBe('Buttons.Add ');
  });

  test('preserves capitalization of entity name', () => {
    const translate = (key: string) => {
      if (key === 'Buttons.Add') return 'Add';
      if (key === 'Menu.AdapterContainers') return 'Adapter Containers';
      return key;
    };
    const result = getDeploymentButtonTitle(translate, DeploymentExportEntityType.ADAPTER_CONTAINER);
    expect(result).toBe('Add Adapter Containers');
  });
});

describe('ExportConfig :: getDeploymentColDefs', () => {
  test('returns container columns without version for non-image tabs', () => {
    const columns = getDeploymentColDefs((key) => key, undefined, DeploymentExportEntityType.MCP_CONTAINER);

    expect(columns).toContainEqual(DISPLAY_NAME_COLUMN_WITH_SORT);
    expect(columns).toContainEqual(DESCRIPTION_COLUMN);
    expect(columns).toContainEqual(NAME_COLUMN);
    expect(columns).not.toContainEqual(VERSION_COLUMN);
  });

  test('returns image columns with version and id for image tab', () => {
    const columns = getDeploymentColDefs((key) => key, undefined, DeploymentExportEntityType.IMAGE);

    const fields = columns.map((c) => c.field);
    expect(fields).toContain('id');
    expect(fields).toContain('name');
    expect(fields).toContain('description');
    expect(fields).toContain('version');
  });

  test('image tab has Display Name header for name column', () => {
    const columns = getDeploymentColDefs((key) => key, undefined, DeploymentExportEntityType.IMAGE);
    const nameCol = columns.find((c) => c.field === 'name');
    expect(nameCol?.headerName).toBe('Display Name');
  });

  test('image tab has ID header for id column', () => {
    const columns = getDeploymentColDefs((key) => key, undefined, DeploymentExportEntityType.IMAGE);
    const idCol = columns.find((c) => c.field === 'id');
    expect(idCol?.headerName).toBe('ID');
  });

  test('appends action column when remove callback provided', () => {
    const remove = vi.fn();
    const columns = getDeploymentColDefs((key) => key, remove, DeploymentExportEntityType.MCP_CONTAINER);

    const lastCol = columns[columns.length - 1];
    expect(lastCol.field).toBe('actionsColumn');
  });

  test('does not append action column when no remove callback', () => {
    const columns = getDeploymentColDefs((key) => key, undefined, DeploymentExportEntityType.MCP_CONTAINER);

    const actionCol = columns.find((c) => c.field === 'actionsColumn');
    expect(actionCol).toBeUndefined();
  });
});

describe('ExportConfig :: getDeploymentExportComponents', () => {
  test('returns empty array for empty data', () => {
    expect(getDeploymentExportComponents({})).toEqual([]);
  });

  test('maps container entities using name field', () => {
    const data: Record<string, EntitiesGridData[]> = {
      [DeploymentExportEntityType.MCP_CONTAINER]: [
        { name: 'container-1', $type: CONTAINER_TYPE.MCP } as unknown as EntitiesGridData,
      ],
    };

    const result = getDeploymentExportComponents(data);
    expect(result).toEqual([{ name: 'container-1', type: DeploymentExportComponentType.MCP_DEPLOYMENT }]);
  });

  test('maps image entities using id field instead of name', () => {
    const data: Record<string, EntitiesGridData[]> = {
      [DeploymentExportEntityType.IMAGE]: [
        { name: 'image-name', id: 'image-id-123', $type: IMAGE_TYPE.ADAPTER } as unknown as EntitiesGridData,
      ],
    };

    const result = getDeploymentExportComponents(data);
    expect(result).toEqual([{ name: 'image-id-123', type: DeploymentExportComponentType.ADAPTER_IMAGE_DEFINITION }]);
  });

  test('maps multiple entities across different types', () => {
    const data: Record<string, EntitiesGridData[]> = {
      [DeploymentExportEntityType.MCP_CONTAINER]: [
        { name: 'c1', $type: CONTAINER_TYPE.MCP } as unknown as EntitiesGridData,
      ],
      [DeploymentExportEntityType.ADAPTER_CONTAINER]: [
        { name: 'c2', $type: CONTAINER_TYPE.ADAPTER } as unknown as EntitiesGridData,
      ],
      [DeploymentExportEntityType.IMAGE]: [
        { name: 'img-name', id: 'img-id', $type: IMAGE_TYPE.INTERCEPTOR } as unknown as EntitiesGridData,
      ],
    };

    const result = getDeploymentExportComponents(data);
    expect(result).toHaveLength(3);
    expect(result).toContainEqual({ name: 'c1', type: DeploymentExportComponentType.MCP_DEPLOYMENT });
    expect(result).toContainEqual({ name: 'c2', type: DeploymentExportComponentType.ADAPTER_DEPLOYMENT });
    expect(result).toContainEqual({ name: 'img-id', type: DeploymentExportComponentType.INTERCEPTOR_IMAGE_DEFINITION });
  });

  test('skips entity types with empty arrays', () => {
    const data: Record<string, EntitiesGridData[]> = {
      [DeploymentExportEntityType.MCP_CONTAINER]: [],
      [DeploymentExportEntityType.IMAGE]: [
        { name: 'img', id: 'id-1', $type: IMAGE_TYPE.MCP } as unknown as EntitiesGridData,
      ],
    };

    const result = getDeploymentExportComponents(data);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('id-1');
  });
});
