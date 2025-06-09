import { ExportComponentType } from '@/src/types/export';
import { getButtonTitle, getAllAvailableDependencies,getAvailableData } from '../AddEntities.utils';
import { MenuI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import * as AddEntitiesUtils from '@/src/components/AddEntitiesTab/AddEntitiesView.utils';

jest.mock('@/src/components/AddEntitiesTab/AddEntitiesView.utils');

const mockGetAvailableEntities = AddEntitiesUtils.getAvailableEntities as jest.Mock;

describe('Export Config Utils :: getButtonTitle', () => {
  const mockTranslate = (t: string) => t;
  it('Should return title for entities', () => {
    const res = getButtonTitle(mockTranslate, ExportComponentType.ENTITIES, true);

    expect(res).toBe('Buttons.Add menu.entities');
  });

  it('Should return title for key', () => {
    const res = getButtonTitle(mockTranslate, ExportComponentType.KEY, true);

    expect(res).toBe('Buttons.Add menu.keys');
  });

  it('Should return title for prompts', () => {
    const res = getButtonTitle(mockTranslate, ExportComponentType.PROMPT, true);

    expect(res).toBe('Buttons.Add menu.prompts');
  });

  it('Should return title for roles', () => {
    const res = getButtonTitle(mockTranslate, ExportComponentType.ROLE, true);

    expect(res).toBe('Buttons.Add menu.roles');
  });

  it('Should return title for runners', () => {
    const res = getButtonTitle(mockTranslate, ExportComponentType.APPLICATION_TYPE_SCHEMA, true);

    expect(res).toBe('Buttons.Add menu.applicationrunners');
  });

  it('Should return title for files', () => {
    const res = getButtonTitle(mockTranslate, ExportComponentType.FILE, true);

    expect(res).toBe('Buttons.Add menu.files');
  });

  it('Should return title for models', () => {
    const res = getButtonTitle(mockTranslate, ExportComponentType.MODEL, true);

    expect(res).toBe('Buttons.Add menu.models');
  });

  it('Should return title for applications', () => {
    const res = getButtonTitle(mockTranslate, ExportComponentType.APPLICATION, true);

    expect(res).toBe('Buttons.Add menu.applications');
  });

  it('Should return title for routes', () => {
    const res = getButtonTitle(mockTranslate, ExportComponentType.ROUTE, true);

    expect(res).toBe('Buttons.Add menu.routes');
  });

  it('Should return title for interceptors', () => {
    const res = getButtonTitle(mockTranslate, ExportComponentType.INTERCEPTOR, true);

    expect(res).toBe('Buttons.Add menu.interceptors');
  });

  it('Should return title for interceptors', () => {
    const res = getButtonTitle(mockTranslate, ExportComponentType.INTERCEPTOR, false);

    expect(res).toBe('Menu.Interceptors');
  });
});

describe('Export Config Utils :: getAllAvailableDependencies', () => {
  it('returns correct dependencies for ROLE', () => {
    const result = getAllAvailableDependencies(ExportComponentType.ROLE);
    expect(result).toEqual([
      ExportComponentType.ENTITIES,
      ExportComponentType.APPLICATION_TYPE_SCHEMA,
      ExportComponentType.INTERCEPTOR,
    ]);
  });

  it('returns correct dependencies for KEY', () => {
    const result = getAllAvailableDependencies(ExportComponentType.KEY);
    expect(result).toEqual([
      ExportComponentType.ROLE,
      ExportComponentType.ENTITIES,
      ExportComponentType.APPLICATION_TYPE_SCHEMA,
      ExportComponentType.INTERCEPTOR,
    ]);
  });

  it('returns correct dependencies for MODEL', () => {
    const result = getAllAvailableDependencies(ExportComponentType.MODEL);
    expect(result).toEqual([ExportComponentType.INTERCEPTOR]);
  });

  it('returns correct dependencies for APPLICATION', () => {
    const result = getAllAvailableDependencies(ExportComponentType.APPLICATION);
    expect(result).toEqual([
      ExportComponentType.ENTITIES,
      ExportComponentType.APPLICATION_TYPE_SCHEMA,
      ExportComponentType.INTERCEPTOR,
    ]);
  });

  it('returns empty array for undefined input', () => {
    const result = getAllAvailableDependencies(undefined);
    expect(result).toEqual([]);
  });

  it('returns empty array for unsupported type', () => {
    const result = getAllAvailableDependencies('UNKNOWN' as ExportComponentType);
    expect(result).toEqual([]);
  });
});

describe('Export Config Utils :: getAvailableData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const entity = (id: string, type: string): EntitiesGridData => ({ id, type }) as EntitiesGridData;

  it('should filter and return available MODEL entities', () => {
    const tabData = {
      MODEL: [entity('m1', MenuI18nKey.Models), entity('m2', 'OTHER')],
    };
    const customExportData = {
      MODEL: [entity('m3', MenuI18nKey.Models)],
    };

    mockGetAvailableEntities.mockReturnValue(['filtered']);

    const result = getAvailableData(ExportComponentType.MODEL, tabData, customExportData, 'MODEL');

    expect(mockGetAvailableEntities).toHaveBeenCalledWith(
      [entity('m3', MenuI18nKey.Models)],
      [entity('m1', MenuI18nKey.Models)],
    );
    expect(result).toEqual(['filtered']);
  });

  it('should filter and return available APPLICATION entities', () => {
    const tabData = {
      APPLICATION: [entity('a1', MenuI18nKey.Applications), entity('a2', 'OTHER')],
    };
    const customExportData = {
      APPLICATION: [entity('a3', MenuI18nKey.Applications)],
    };

    mockGetAvailableEntities.mockReturnValue(['filtered-apps']);

    const result = getAvailableData(ExportComponentType.APPLICATION, tabData, customExportData, 'APPLICATION');

    expect(mockGetAvailableEntities).toHaveBeenCalledWith(
      [entity('a3', MenuI18nKey.Applications)],
      [entity('a1', MenuI18nKey.Applications)],
    );
    expect(result).toEqual(['filtered-apps']);
  });

  it('should filter and return available ROUTE entities', () => {
    const tabData = {
      ROUTE: [entity('r1', MenuI18nKey.Routes)],
    };
    const customExportData = {
      ROUTE: [entity('r2', MenuI18nKey.Routes)],
    };

    mockGetAvailableEntities.mockReturnValue(['filtered-routes']);

    const result = getAvailableData(ExportComponentType.ROUTE, tabData, customExportData, 'ROUTE');

    expect(result).toEqual(['filtered-routes']);
  });

  it('should return unfiltered data for non-MODEL/APPLICATION/ROUTE types', () => {
    const tabData = {
      ROLE: [entity('x1', 'some')],
    };
    const customExportData = {
      ROLE: [entity('x2', 'some')],
    };

    mockGetAvailableEntities.mockReturnValue(['default']);

    const result = getAvailableData(ExportComponentType.ROLE, tabData, customExportData, 'ROLE');

    expect(mockGetAvailableEntities).toHaveBeenCalledWith(customExportData.ROLE, tabData.ROLE);
    expect(result).toEqual(['default']);
  });

  it('should fallback to empty arrays when no tab data is provided', () => {
    mockGetAvailableEntities.mockReturnValue([]);

    const result = getAvailableData(ExportComponentType.MODEL, {}, {}, 'MODEL');

    expect(result).toEqual([]);
  });
});
