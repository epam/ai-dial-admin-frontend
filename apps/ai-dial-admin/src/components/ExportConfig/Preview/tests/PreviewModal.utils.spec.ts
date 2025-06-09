import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportComponentType } from '@/src/types/export';
import * as entitiesUtils from '@/src/utils/entities/entities-list-view';
import { getPreviewTabs } from '../PreviewModal.utils';

jest.mock('@/src/utils/entities/entities-list-view');

const t = (key: string) => `translated(${key})`;

describe('Export Config Utils :: getPreviewTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return tabs and convertedData correctly with roles, keys, applicationRunners, and models', () => {
    const mockEntities: EntitiesGridData[] = [{ id: 'e1' }, { id: 'e2' }] as any;

    (entitiesUtils.getApplicationsForEntitiesGrid as jest.Mock).mockReturnValue([]);
    (entitiesUtils.getModelsForEntitiesGrid as jest.Mock).mockReturnValue(mockEntities);
    (entitiesUtils.getRoutesForEntitiesGrid as jest.Mock).mockReturnValue([]);

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
        id: ExportComponentType.ENTITIES,
        name: 'translated(Menu.Entities): 2',
      },
      {
        id: ExportComponentType.ROLE,
        name: 'translated(Menu.Roles): 1',
      },
      {
        id: ExportComponentType.KEY,
        name: 'translated(Menu.Keys): 2',
      },
      {
        id: ExportComponentType.APPLICATION_TYPE_SCHEMA,
        name: 'translated(Menu.ApplicationRunners): 1',
      },
      {
        id: ExportComponentType.PROMPT,
        name: 'translated(Menu.Prompts): 1',
      },
    ]);

    expect(convertedData[ExportComponentType.ROLE]).toHaveLength(1);
    expect(convertedData[ExportComponentType.APPLICATION_TYPE_SCHEMA]).toHaveLength(1);
    expect(convertedData[ExportComponentType.PROMPT]).toHaveLength(1);
    expect(convertedData[ExportComponentType.KEY]).toHaveLength(2);
    expect(convertedData[ExportComponentType.ENTITIES]).toEqual(mockEntities);
  });

  it('should not add tabs for empty categories', () => {
    const data = {
      roles: [],
      applications: [],
      models: [],
      routes: [],
    };

    (entitiesUtils.getApplicationsForEntitiesGrid as jest.Mock).mockReturnValue([]);
    (entitiesUtils.getModelsForEntitiesGrid as jest.Mock).mockReturnValue([]);
    (entitiesUtils.getRoutesForEntitiesGrid as jest.Mock).mockReturnValue([]);

    const { tabs, convertedData } = getPreviewTabs(data, t);

    expect(tabs).toHaveLength(0);
    expect(Object.keys(convertedData)).toHaveLength(0);
  });

  it('should handle interceptors and files correctly', () => {
    const data = {
      interceptors: [{ id: 'int1' }],
      files: [{ id: 'file1' }],
    };

    const { tabs, convertedData } = getPreviewTabs(data, t);

    expect(tabs).toEqual([
      {
        id: ExportComponentType.INTERCEPTOR,
        name: 'translated(Menu.Interceptors): 1',
      },
      {
        id: ExportComponentType.FILE,
        name: 'translated(Menu.Files): 1',
      },
    ]);

    expect(convertedData[ExportComponentType.INTERCEPTOR]).toHaveLength(1);
    expect(convertedData[ExportComponentType.FILE]).toHaveLength(1);
  });
});
