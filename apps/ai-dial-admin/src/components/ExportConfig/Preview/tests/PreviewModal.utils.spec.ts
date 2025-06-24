import { EntitiesGridData } from '@/src/models/entities-grid-data';
import * as entitiesUtils from '@/src/utils/entities/entities-list-view';
import { getPreviewTabs } from '../PreviewModal.utils';
import { EntityType } from '@/src/types/entity-type';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/src/utils/entities/entities-list-view');

const t = (key: string) => `translated(${key})`;

describe('Export Config Utils :: getPreviewTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should return tabs and convertedData correctly with roles, keys, applicationRunners, and models', () => {
    const mockEntities: EntitiesGridData[] = [{ id: 'e1' }, { id: 'e2' }] as any;

    (entitiesUtils.getApplicationsForEntitiesGrid as vi.Mock).mockReturnValue([]);
    (entitiesUtils.getModelsForEntitiesGrid as vi.Mock).mockReturnValue(mockEntities);
    (entitiesUtils.getRoutesForEntitiesGrid as vi.Mock).mockReturnValue([]);

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
      {
        id: EntityType.ENTITIES,
        name: 'translated(Menu.Entities): 2',
      },
      {
        id: EntityType.ROLE,
        name: 'translated(Menu.Roles): 1',
      },
      {
        id: EntityType.KEY,
        name: 'translated(Menu.Keys): 2',
      },
      {
        id: EntityType.APPLICATION_TYPE_SCHEMA,
        name: 'translated(Menu.ApplicationRunners): 1',
      },
      {
        id: EntityType.PROMPT,
        name: 'translated(Menu.Prompts): 1',
      },
    ]);

    expect(convertedData[EntityType.ROLE]).toHaveLength(1);
    expect(convertedData[EntityType.APPLICATION_TYPE_SCHEMA]).toHaveLength(1);
    expect(convertedData[EntityType.PROMPT]).toHaveLength(1);
    expect(convertedData[EntityType.KEY]).toHaveLength(2);
    expect(convertedData[EntityType.ENTITIES]).toEqual(mockEntities);
  });

  test('should not add tabs for empty categories', () => {
    const data = {
      roles: [],
      applications: [],
      models: [],
      routes: [],
    };

    entitiesUtils.getApplicationsForEntitiesGrid.mockReturnValue([]);
    entitiesUtils.getModelsForEntitiesGrid.mockReturnValue([]);
    entitiesUtils.getRoutesForEntitiesGrid.mockReturnValue([]);

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
      {
        id: EntityType.INTERCEPTOR,
        name: 'translated(Menu.Interceptors): 1',
      },
      {
        id: EntityType.FILE,
        name: 'translated(Menu.Files): 1',
      },
    ]);

    expect(convertedData[EntityType.INTERCEPTOR]).toHaveLength(1);
    expect(convertedData[EntityType.FILE]).toHaveLength(1);
  });
});
