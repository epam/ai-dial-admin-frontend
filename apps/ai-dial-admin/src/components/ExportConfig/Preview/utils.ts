import { MenuI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { TabModel } from '@epam/ai-dial-ui-kit';
import {
  getApplicationsForEntitiesGrid,
  getModelsForEntitiesGrid,
  getRoutesForEntitiesGrid,
  getRolesForEntitiesGrid,
  getAdaptersForEntitiesGrid,
  getInterceptorsForEntitiesGrid,
  getKeysForEntitiesGrid,
  getToolsetsForEntitiesGrid,
  getRunnersForEntitiesGrid,
} from '@/src/utils/entities/entities-list-view';
import { DialModel } from '@/src/models/dial/model';
import { EntityType } from '@/src/types/entity-type';
import { ExportFormat } from '@/src/types/export';

/**
 * Get converted data and tabs for export preview
 *
 * @param {Record<string, EntitiesGridData[]>} data - preview data from server '/'
 * @param {boolean} isIncludeSecret - is include secret data in export'
 * @param {ExportFormat} exportFormat - is export format - core or admin'
 * @param {(t: string) => string} t - function for translate
 * @returns { tabs: TabModel[]; convertedData: Record<string, EntitiesGridData[]> } result - array of data and tabs
 */
export const getPreviewTabs = (
  data: Record<string, EntitiesGridData[]>,
  isIncludeSecret: boolean,
  exportFormat: ExportFormat | undefined,
  t: (v: string) => string,
): { tabs: TabModel[]; convertedData: Record<string, EntitiesGridData[]> } => {
  const tabs: TabModel[] = [];
  const convertedData: Record<string, EntitiesGridData[]> = {};

  Object.keys(data).forEach((key) => {
    if (data[key].length > 0) {
      if (key === 'roles') {
        convertedData[EntityType.ROLE] = getRolesForEntitiesGrid(data[key]);
        tabs.push({
          id: EntityType.ROLE,
          label: `${t(MenuI18nKey.Roles)}: ${data[key].length}`,
        });
      }

      if (key === 'keys' && (exportFormat === ExportFormat.ADMIN || isIncludeSecret)) {
        convertedData[EntityType.KEY] = getKeysForEntitiesGrid(data[key]);
        tabs.push({
          id: EntityType.KEY,
          label: `${t(MenuI18nKey.Keys)}: ${data[key].length}`,
        });
      }

      if (key === 'applicationRunners') {
        convertedData[EntityType.APPLICATION_TYPE_SCHEMA] = getRunnersForEntitiesGrid(data[key]);
        tabs.push({
          id: EntityType.APPLICATION_TYPE_SCHEMA,
          label: `${t(MenuI18nKey.ApplicationRunners)}: ${data[key].length}`,
        });
      }

      if (key === 'interceptors') {
        convertedData[EntityType.INTERCEPTOR] = getInterceptorsForEntitiesGrid(data[key]);
        tabs.push({
          id: EntityType.INTERCEPTOR,
          label: `${t(MenuI18nKey.Interceptors)}: ${data[key].length}`,
        });
      }

      if (key === 'adapters') {
        convertedData[EntityType.ADAPTER] = getAdaptersForEntitiesGrid(data[key]);
        tabs.push({
          id: EntityType.ADAPTER,
          label: `${t(MenuI18nKey.Adapters)}: ${data[key].length}`,
        });
      }

      if (key === 'prompts') {
        convertedData[EntityType.PROMPT] = data[key];
        tabs.push({
          id: EntityType.PROMPT,
          label: `${t(MenuI18nKey.Prompts)}: ${data[key].length}`,
        });
      }

      if (key === 'files') {
        convertedData[EntityType.FILE] = data[key];
        tabs.push({
          id: EntityType.FILE,
          label: `${t(MenuI18nKey.Files)}: ${data[key].length}`,
        });
      }

      if (key === 'applications') {
        convertedData[EntityType.APPLICATION] = getApplicationsForEntitiesGrid(data[key]);

        tabs.push({
          id: EntityType.APPLICATION,
          label: `${t(MenuI18nKey.Applications)}: ${data[key].length}`,
        });
      }

      if (key === 'models') {
        convertedData[EntityType.MODEL] = getModelsForEntitiesGrid(data[key] as DialModel[]);
        tabs.push({
          id: EntityType.MODEL,
          label: `${t(MenuI18nKey.Models)}: ${data[key].length}`,
        });
      }

      if (key === 'routes') {
        convertedData[EntityType.ROUTE] = getRoutesForEntitiesGrid(data[key] as DialModel[]);
        tabs.push({
          id: EntityType.ROUTE,
          label: `${t(MenuI18nKey.Routes)}: ${data[key].length}`,
        });
      }

      if (key === 'toolSets') {
        convertedData[EntityType.TOOLSET] = getToolsetsForEntitiesGrid(data[key]);
        tabs.push({
          id: EntityType.TOOLSET,
          label: `${t(MenuI18nKey.Toolsets)}: ${data[key].length}`,
        });
      }
    }
  });

  return { tabs, convertedData };
};
