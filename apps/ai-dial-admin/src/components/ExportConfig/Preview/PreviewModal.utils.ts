import { MenuI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { TabModel } from '@/src/models/tab';
import {
  getApplicationsForEntitiesGrid,
  getModelsForEntitiesGrid,
  getRoutesForEntitiesGrid,
} from '@/src/utils/entities/entities-list-view';
import { DialModel } from '@/src/models/dial/model';
import { EntityType } from '@/src/types/entity-type';

/**
 * Get converted data and tabs for export preview
 *
 * @param {Record<string, EntitiesGridData[]>} data - preview data from server '/'
 * @param {(t: string) => string} t - function for translate
 * @returns { tabs: TabModel[]; convertedData: Record<string, EntitiesGridData[]> } result - array of data and tabs
 */
export const getPreviewTabs = (
  data: Record<string, EntitiesGridData[]>,
  t: (v: string) => string,
): { tabs: TabModel[]; convertedData: Record<string, EntitiesGridData[]> } => {
  const tabs: TabModel[] = [];
  const convertedData: Record<string, EntitiesGridData[]> = {};
  const allEntities: EntitiesGridData[] = [];

  Object.keys(data).forEach((key) => {
    if (data[key].length > 0) {
      if (key === 'roles') {
        convertedData[EntityType.ROLE] = data[key];
        tabs.push({
          id: EntityType.ROLE,
          name: `${t(MenuI18nKey.Roles)}: ${data[key].length}`,
        });
      }

      if (key === 'keys') {
        convertedData[EntityType.KEY] = data[key];
        tabs.push({
          id: EntityType.KEY,
          name: `${t(MenuI18nKey.Keys)}: ${data[key].length}`,
        });
      }

      if (key === 'applicationRunners') {
        convertedData[EntityType.APPLICATION_TYPE_SCHEMA] = data[key];
        tabs.push({
          id: EntityType.APPLICATION_TYPE_SCHEMA,
          name: `${t(MenuI18nKey.ApplicationRunners)}: ${data[key].length}`,
        });
      }

      if (key === 'interceptors') {
        convertedData[EntityType.INTERCEPTOR] = data[key];
        tabs.push({
          id: EntityType.INTERCEPTOR,
          name: `${t(MenuI18nKey.Interceptors)}: ${data[key].length}`,
        });
      }

      if (key === 'prompts') {
        convertedData[EntityType.PROMPT] = data[key];
        tabs.push({
          id: EntityType.PROMPT,
          name: `${t(MenuI18nKey.Prompts)}: ${data[key].length}`,
        });
      }

      if (key === 'files') {
        convertedData[EntityType.FILE] = data[key];
        tabs.push({
          id: EntityType.FILE,
          name: `${t(MenuI18nKey.Files)}: ${data[key].length}`,
        });
      }

      if (key === 'applications') {
        allEntities.push(...getApplicationsForEntitiesGrid(data[key]));
      }

      if (key === 'models') {
        allEntities.push(...getModelsForEntitiesGrid(data[key] as DialModel[]));
      }

      if (key === 'routes') {
        allEntities.push(...getRoutesForEntitiesGrid(data[key]));
      }
    }
  });

  if (allEntities.length > 0) {
    convertedData[EntityType.ENTITIES] = allEntities;
    tabs.unshift({
      id: EntityType.ENTITIES,
      name: `${t(MenuI18nKey.Entities)}: ${allEntities.length}`,
    });
  }

  return { tabs, convertedData };
};
