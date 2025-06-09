import { MenuI18nKey } from '@/src/constants/i18n';
import { DialAddon } from '@/src/models/dial/addon';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialKey } from '@/src/models/dial/key';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { DialRoute } from '@/src/models/dial/route';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ApplicationRoute } from '@/src/types/routes';

/**
 * Get list of DialModel with type and route for entities view
 *
 * @param {?(DialModel[] | null)} [models] - DialModel array
 * @returns {EntitiesGridData[]}  - EntitiesGridData array
 */
export const getModelsForEntitiesGrid = (models?: DialModel[] | null): EntitiesGridData[] => {
  return [...(models || [])].map((model) => ({ ...model, type: MenuI18nKey.Models, route: ApplicationRoute.Models }));
};

/**
 * Get list of DialApplication with type and route for entities view
 *
 * @param {?(DialApplication[] | null)} [applications] - DialApplication array
 * @returns {EntitiesGridData[]} - EntitiesGridData array
 */
export const getApplicationsForEntitiesGrid = (applications?: DialApplication[] | null): EntitiesGridData[] => {
  return [...(applications || [])].map((application) => ({
    ...application,
    type: MenuI18nKey.Applications,
    route: ApplicationRoute.Applications,
  }));
};

/**
 * Get list of DialAddon with type and route for entities view
 *
 * @param {?(DialAddon[] | null)} [addons] - DialAddon array
 * @returns {EntitiesGridData[]} - EntitiesGridData array
 */
export const getAddonsForEntitiesGrid = (addons?: DialAddon[] | null): EntitiesGridData[] => {
  return [...(addons || [])].map((addon) => ({ ...addon, type: MenuI18nKey.Addons, route: ApplicationRoute.Addons }));
}; /**
 * Get list of DialRoute with type and route for entities view
 *
 * @param {?(DialRoute[] | null)} [routes] - DialRoute array
 * @returns {EntitiesGridData[]} - EntitiesGridData array
 */
export const getRoutesForEntitiesGrid = (routes?: DialRoute[] | null): EntitiesGridData[] => {
  return [...(routes || [])].map((route) => ({ ...route, type: MenuI18nKey.Routes, route: ApplicationRoute.Routes }));
};

/**
 * Get list of DialRole with type and route for entities view
 *
 * @param {?(DialRole[] | null)} [roles] - DialRole array
 * @returns {EntitiesGridData[]} - EntitiesGridData array
 */
export const getRolesForEntitiesGrid = (roles?: DialRole[] | null): EntitiesGridData[] => {
  return [...(roles || [])].map((role) => ({ ...role, type: MenuI18nKey.Roles, route: ApplicationRoute.Roles }));
};

/**
 * Get list of DialKey with type and route for entities view
 *
 * @param {?(DialKey[] | null)} [keys] - DialKey array
 * @returns {EntitiesGridData[]} - EntitiesGridData array
 */
export const getKeysForEntitiesGrid = (keys?: DialKey[] | null): EntitiesGridData[] => {
  return [...(keys || [])].map((key) => ({ ...key, type: MenuI18nKey.Keys, route: ApplicationRoute.Keys }));
};

/**
 * Get list of DialApplicationScheme with type and route for entities view
 *
 * @param {?(DialApplicationScheme[] | null)} [runners] - DialApplicationScheme array
 * @returns {EntitiesGridData[]} - EntitiesGridData array
 */
export const getRunnersForEntitiesGrid = (runners?: DialApplicationScheme[] | null): EntitiesGridData[] => {
  return [...(runners || [])].map((runner) => ({
    ...runner,
    type: MenuI18nKey.ApplicationRunners,
    route: ApplicationRoute.ApplicationRunners,
  }));
};

/**
 * Get list of DialInterceptor with type and route for entities view
 *
 * @param {?(DialInterceptor[] | null)} [interceptors] - DialInterceptor array
 * @returns {EntitiesGridData[]} - EntitiesGridData array
 */
export const getInterceptorsForEntitiesGrid = (interceptors?: DialInterceptor[] | null): EntitiesGridData[] => {
  return [...(interceptors || [])].map((interceptor) => ({
    ...interceptor,
    type: MenuI18nKey.Interceptors,
    route: ApplicationRoute.Interceptors,
  }));
};
