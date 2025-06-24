import { getButtonTitle, getAllAvailableDependencies, getAvailableData } from '../AddEntities.utils';
import { MenuI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import * as AddEntitiesUtils from '@/src/components/AddEntitiesTab/AddEntitiesView.utils';
import { EntityType } from '@/src/types/entity-type';
import { beforeEach, describe, expect, test, vi } from 'vitest';
vi.mock('@/src/components/AddEntitiesTab/AddEntitiesView.utils');

const mockGetAvailableEntities = AddEntitiesUtils.getAvailableEntities;

describe('Export Config Utils :: getButtonTitle', () => {
  const mockTranslate = (t: string) => t;
  test('Should return title for entities', () => {
    const res = getButtonTitle(mockTranslate, EntityType.ENTITIES, true);

    expect(res).toBe('Buttons.Add menu.entities');
  });

  test('Should return title for key', () => {
    const res = getButtonTitle(mockTranslate, EntityType.KEY, true);

    expect(res).toBe('Buttons.Add menu.keys');
  });

  test('Should return title for prompts', () => {
    const res = getButtonTitle(mockTranslate, EntityType.PROMPT, true);

    expect(res).toBe('Buttons.Add menu.prompts');
  });

  test('Should return title for roles', () => {
    const res = getButtonTitle(mockTranslate, EntityType.ROLE, true);

    expect(res).toBe('Buttons.Add menu.roles');
  });

  test('Should return title for runners', () => {
    const res = getButtonTitle(mockTranslate, EntityType.APPLICATION_TYPE_SCHEMA, true);

    expect(res).toBe('Buttons.Add menu.applicationrunners');
  });

  test('Should return title for files', () => {
    const res = getButtonTitle(mockTranslate, EntityType.FILE, true);

    expect(res).toBe('Buttons.Add menu.files');
  });

  test('Should return title for models', () => {
    const res = getButtonTitle(mockTranslate, EntityType.MODEL, true);

    expect(res).toBe('Buttons.Add menu.models');
  });

  test('Should return title for applications', () => {
    const res = getButtonTitle(mockTranslate, EntityType.APPLICATION, true);

    expect(res).toBe('Buttons.Add menu.applications');
  });

  test('Should return title for routes', () => {
    const res = getButtonTitle(mockTranslate, EntityType.ROUTE, true);

    expect(res).toBe('Buttons.Add menu.routes');
  });

  test('Should return title for interceptors', () => {
    const res = getButtonTitle(mockTranslate, EntityType.INTERCEPTOR, true);

    expect(res).toBe('Buttons.Add menu.interceptors');
  });

  test('Should return title for interceptors', () => {
    const res = getButtonTitle(mockTranslate, EntityType.INTERCEPTOR, false);

    expect(res).toBe('Menu.Interceptors');
  });
});

describe('Export Config Utils :: getAllAvailableDependencies', () => {
  test('returns correct dependencies for ROLE', () => {
    const result = getAllAvailableDependencies(EntityType.ROLE);
    expect(result).toEqual([EntityType.ENTITIES, EntityType.APPLICATION_TYPE_SCHEMA, EntityType.INTERCEPTOR]);
  });

  test('returns correct dependencies for KEY', () => {
    const result = getAllAvailableDependencies(EntityType.KEY);
    expect(result).toEqual([
      EntityType.ROLE,
      EntityType.ENTITIES,
      EntityType.APPLICATION_TYPE_SCHEMA,
      EntityType.INTERCEPTOR,
    ]);
  });

  test('returns correct dependencies for MODEL', () => {
    const result = getAllAvailableDependencies(EntityType.MODEL);
    expect(result).toEqual([EntityType.INTERCEPTOR]);
  });

  test('returns correct dependencies for APPLICATION', () => {
    const result = getAllAvailableDependencies(EntityType.APPLICATION);
    expect(result).toEqual([EntityType.ENTITIES, EntityType.APPLICATION_TYPE_SCHEMA, EntityType.INTERCEPTOR]);
  });

  test('returns empty array for undefined input', () => {
    const result = getAllAvailableDependencies(undefined);
    expect(result).toEqual([]);
  });

  test('returns empty array for unsupported type', () => {
    const result = getAllAvailableDependencies('UNKNOWN' as EntityType);
    expect(result).toEqual([]);
  });
});

describe('Export Config Utils :: getAvailableData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const entity = (id: string, type: string): EntitiesGridData => ({ id, type }) as EntitiesGridData;

  test('should filter and return available MODEL entities', () => {
    const tabData = {
      MODEL: [entity('m1', MenuI18nKey.Models), entity('m2', 'OTHER')],
    };
    const customExportData = {
      MODEL: [entity('m3', MenuI18nKey.Models)],
    };

    mockGetAvailableEntities.mockReturnValue(['filtered']);

    const result = getAvailableData(EntityType.MODEL, tabData, customExportData, 'MODEL');

    expect(mockGetAvailableEntities).toHaveBeenCalledWith(
      [entity('m3', MenuI18nKey.Models)],
      [entity('m1', MenuI18nKey.Models)],
    );
    expect(result).toEqual(['filtered']);
  });

  test('should filter and return available APPLICATION entities', () => {
    const tabData = {
      APPLICATION: [entity('a1', MenuI18nKey.Applications), entity('a2', 'OTHER')],
    };
    const customExportData = {
      APPLICATION: [entity('a3', MenuI18nKey.Applications)],
    };

    mockGetAvailableEntities.mockReturnValue(['filtered-apps']);

    const result = getAvailableData(EntityType.APPLICATION, tabData, customExportData, 'APPLICATION');

    expect(mockGetAvailableEntities).toHaveBeenCalledWith(
      [entity('a3', MenuI18nKey.Applications)],
      [entity('a1', MenuI18nKey.Applications)],
    );
    expect(result).toEqual(['filtered-apps']);
  });

  test('should filter and return available ROUTE entities', () => {
    const tabData = {
      ROUTE: [entity('r1', MenuI18nKey.Routes)],
    };
    const customExportData = {
      ROUTE: [entity('r2', MenuI18nKey.Routes)],
    };

    mockGetAvailableEntities.mockReturnValue(['filtered-routes']);

    const result = getAvailableData(EntityType.ROUTE, tabData, customExportData, 'ROUTE');

    expect(result).toEqual(['filtered-routes']);
  });

  test('should return unfiltered data for non-MODEL/APPLICATION/ROUTE types', () => {
    const tabData = {
      ROLE: [entity('x1', 'some')],
    };
    const customExportData = {
      ROLE: [entity('x2', 'some')],
    };

    mockGetAvailableEntities.mockReturnValue(['default']);

    const result = getAvailableData(EntityType.ROLE, tabData, customExportData, 'ROLE');

    expect(mockGetAvailableEntities).toHaveBeenCalledWith(customExportData.ROLE, tabData.ROLE);
    expect(result).toEqual(['default']);
  });

  test('should fallback to empty arrays when no tab data is provided', () => {
    mockGetAvailableEntities.mockReturnValue([]);

    const result = getAvailableData(EntityType.MODEL, {}, {}, 'MODEL');

    expect(result).toEqual([]);
  });
});
