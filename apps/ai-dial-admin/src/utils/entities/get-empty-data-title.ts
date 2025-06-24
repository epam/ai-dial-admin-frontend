import { EntityType } from '@/src/types/entity-type';
import { BasicI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';

/**
 * Generate title key for empty grid of each EntityType
 *
 * @param {?EntityType} [type] - current component type
 * @returns {string} - key string for translate
 */
export const getEmptyDataTitleI18nKey = (type?: EntityType): string => {
  if (type === EntityType.ROLE) {
    return EntitiesI18nKey.NoRoles;
  }

  if (type === EntityType.KEY) {
    return EntitiesI18nKey.NoKeys;
  }

  if (type === EntityType.APPLICATION_TYPE_SCHEMA) {
    return EntitiesI18nKey.NoApplicationRunners;
  }

  if (type === EntityType.INTERCEPTOR) {
    return EntitiesI18nKey.NoInterceptors;
  }

  if (type === EntityType.PROMPT) {
    return EntitiesI18nKey.NoPrompts;
  }

  if (type === EntityType.FILE) {
    return EntitiesI18nKey.NoFiles;
  }

  if (type === EntityType.MODEL) {
    return EntitiesI18nKey.NoModels;
  }

  if (type === EntityType.APPLICATION) {
    return EntitiesI18nKey.NoApplications;
  }

  if (type === EntityType.ROUTE) {
    return EntitiesI18nKey.NoRoutes;
  }

  if (type === EntityType.ENTITIES) {
    return EntitiesI18nKey.NoEntities;
  }

  return BasicI18nKey.NoData;
};
