import { ColDef } from 'ag-grid-community';

import { ENTITY_BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { LIMIT_COLUMNS } from '@/src/components/EntityView/Roles/roles-utils';
import { NO_LIMITS_KEY } from '@/src/constants/role';
import { DialAddon } from '@/src/models/dial/addon';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialKey } from '@/src/models/dial/key';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import {
  getAddonsForEntitiesGrid,
  getApplicationsForEntitiesGrid,
  getKeysForEntitiesGrid,
  getModelsForEntitiesGrid,
  getRolesForEntitiesGrid,
} from '@/src/utils/entities/entities-list-view';
import { DialAdapter } from '@/src/models/dial/adapter';

export const ENTITY_COLUMNS = (t: (v: string) => string): ColDef[] => [
  ...ENTITY_BASE_COLUMNS,
  {
    headerName: 'Type',
    field: 'type',
    valueFormatter: (params) => t(params.value),
    tooltipValueGetter: (params) => t(params.value),
  },
];

export const ROLES_ENTITIES_COLUMNS = (
  t: (v: string) => string,
  onChangeLimits: ((value: number, data: DialRole, token: string) => void) | undefined,
): ColDef[] => [...ENTITY_COLUMNS(t), ...LIMIT_COLUMNS(void 0, onChangeLimits)];

/**
 * Get list of entities with type and route for entities view
 *
 * @param {DialModel[]} models - all dial models '/'
 * @param {DialApplication[]} applications - all dial applications '/'
 * @param {DialAddon[]} addons - all dial addons '/'
 * @param {DialRole[]} roles - all dial roles '/'
 * @param {DialKey[]} keys - all dial keys '/'
 * @returns {EntitiesGridData[]} - array of all entities
 */
export const getEntitiesGridData = (
  models?: DialModel[],
  applications?: DialApplication[],
  addons?: DialAddon[],
  roles?: DialRole[],
  keys?: DialKey[],
): EntitiesGridData[] => {
  const data: EntitiesGridData[] = [];

  data.push(...getModelsForEntitiesGrid(models));
  data.push(...getApplicationsForEntitiesGrid(applications));
  data.push(...getAddonsForEntitiesGrid(addons));
  data.push(...getRolesForEntitiesGrid(roles));
  data.push(...getKeysForEntitiesGrid(keys));

  return data;
};

/**
 * Get applications that are using the app runner
 *
 * @param {DialApplicationScheme} appRunner - interceptor '/'
 * @param {EntitiesGridData[]} allEntities - all available entities in application  '/'
 * @returns {EntitiesGridData[]} - array of relevant applications
 */
export const getRelevantDataForAppRunner = (
  appRunner: DialApplicationScheme,
  allEntities: EntitiesGridData[],
): EntitiesGridData[] => {
  const data: EntitiesGridData[] = [];
  if (!appRunner.applications) {
    return data;
  }
  appRunner.applications.forEach((application) => {
    const entity = allEntities.find((m) => m.name === application);
    if (entity) {
      data.push(entity as EntitiesGridData);
    }
  });
  return data;
};

/**
 * Get entities that are using the interceptor
 *
 * @param {DialInterceptor} interceptor - interceptor '/'
 * @param {EntitiesGridData[]} allEntities - all available entities in application  '/'
 * @returns {EntitiesGridData[]} - array of relevant entities
 */
export const getRelevantDataForInterceptor = (
  interceptor: DialInterceptor,
  allEntities: EntitiesGridData[],
): EntitiesGridData[] => {
  const data: EntitiesGridData[] = [];
  if (!interceptor.entities) {
    return data;
  }
  interceptor.entities.forEach((entityName) => {
    const entity = allEntities.find((m) => m.name === entityName);
    if (entity) {
      data.push(entity as EntitiesGridData);
    }
  });
  return data;
};

/**
 * Get entities that are using the role
 *
 * @param {DialRole} role - role '/'
 * @param {EntitiesGridData[]} allEntities - all available entities in application  '/'
 * @returns {EntitiesGridData[]} - array of relevant entities
 */
export const getEntitiesForRole = (role: DialRole, allEntities: EntitiesGridData[]): EntitiesGridData[] => {
  const data: EntitiesGridData[] = [];
  if (!role?.limits) {
    return data;
  }

  Object.keys(role?.limits).forEach((entityName) => {
    const limit = role?.limits?.[entityName];

    const entity = allEntities.find((m) => m.name === entityName);
    data.push({
      ...(entity as EntitiesGridData),
      day: limit?.day == null ? NO_LIMITS_KEY : limit?.day,
      minute: limit?.minute == null ? NO_LIMITS_KEY : limit?.minute,
      month: limit?.month == null ? NO_LIMITS_KEY : limit?.month,
      week: limit?.week == null ? NO_LIMITS_KEY : limit?.week,
    });
  });

  return data;
};

/**
 * Filtered entities that are use in entity
 *
 * @param {EntitiesGridData[]} existingEntities - existing entities '/'
 * @param {EntitiesGridData[]} allEntities - all available entities in application  '/'
 * @returns {EntitiesGridData[]} - array of relevant entities
 */
export const getAvailableEntities = (existingEntities: EntitiesGridData[], allEntities: EntitiesGridData[]) => {
  const existingNames = existingEntities.map((entity) => entity.name || entity.key || entity.$id);
  const filteredEntities = allEntities.filter(
    (entity) => !existingNames.includes(entity.name || entity.key || entity.$id),
  );
  return filteredEntities;
};

/**
 * Get roles that are using the key
 *
 * @param {DialInterceptor} key - interceptor '/'
 * @param {EntitiesGridData} allRoles - all available roles in application  '/'
 * @returns {EntitiesGridData[]} - array of relevant roles
 */
export const getRelevantRolesForKey = (key: DialBaseEntity, allRoles: EntitiesGridData[]): EntitiesGridData[] => {
  const data: EntitiesGridData[] = [];
  if (!(key as DialKey).roles) {
    return data;
  }
  (key as DialKey).roles?.forEach((role) => {
    const addedRole = allRoles.find((r) => r.name === role);
    data.push(addedRole as EntitiesGridData);
  });
  return data;
};

/**
 * Get keys that are using the role
 *
 * @param {DialInterceptor} role - role '/'
 * @param {EntitiesGridData} allKeys - all available keys in application  '/'
 * @returns {EntitiesGridData[]} - array of relevant keys
 */
export const getRelevantKeysForRole = (role: DialBaseEntity, allKeys: EntitiesGridData[]): EntitiesGridData[] => {
  const data: EntitiesGridData[] = [];
  if (!(role as DialRole).grantedKeys) {
    return data;
  }
  (role as DialRole).grantedKeys?.forEach((key) => {
    const addedKey = allKeys.find((k) => k.name === key);
    if (addedKey) {
      data.push(addedKey);
    }
  });
  return data;
};

/**
 * Get models that are using the adpter
 *
 * @param {DialAdapter} adapter - adapter '/'
 * @param {EntitiesGridData[]} allEntities - all available models in adapter  '/'
 * @returns {EntitiesGridData[]} - array of relevant models
 */
export const getRelevantModelsForAdapter = (
  adapter: DialAdapter,
  allEntities: EntitiesGridData[],
): EntitiesGridData[] => {
  const data: EntitiesGridData[] = [];
  if (!adapter.models) {
    return data;
  }
  adapter.models.forEach((model) => {
    const entity = allEntities.find((m) => m.name === model);
    if (entity) {
      data.push(entity as EntitiesGridData);
    }
  });
  return data;
};
