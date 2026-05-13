import {
  arrayObjectParameterKeys,
  arrayParameterKeys,
  arrayStringParameterKeys,
  EntityParameterKeys,
  separateObjectParameterKeys,
} from '@/src/components/ActivityAudit/constants';
import { ActivityAuditDiff, ActivityAuditSection } from '@/src/models/activity-audit';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import {
  ActivityAuditEntity,
  ActivityAuditResourceType,
  DiffStatus,
  isImageDefinitionResource,
} from '@/src/types/activity-audit';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { isAppRunnerParameter, isRoleSharingParameter, sortKeys } from './compare-helpers';
import { setObjectsArrayDiff } from './set-objects-array-diffs';
import { setRolesDiffs } from './set-roles-diffs';
import {
  compareAppRunnerParameters,
  compareDefaultLimits,
  compareDefaults,
  compareSimpleObjects,
  compareSimpleTypes,
  compareStringArray,
  compareUpstreams,
  fillAppRunnerParameters,
  fillDefaultLimits,
  fillDefaults,
  fillSimpleObjects,
  fillSimpleTypes,
  fillStringArray,
  fillUpstreams,
} from './create-complex-diffs';
import { DialModelEndpoint } from '@/src/models/dial/model';
import { DialRoleLimits, DialRoleShare } from '@/src/models/dial/role-limits';
import { ExternalRegistryRef } from '@/src/types/deployments/mcp-registry';
import {
  compareAllowedDomains,
  compareDomains,
  compareEntities,
  compareInterceptors,
  compareRoleLimits,
  compareShare,
  fillAllowedDomains,
  fillDomains,
  fillEntities,
  fillInterceptors,
  fillRoleLimits,
  fillShare,
} from './create-simple-diffs';

const IMAGE_HIDDEN_KEYS = new Set<string>(['$type', 'id', 'createdAt', 'updatedAt']);

export const generateCurrentResource = (
  current: ActivityAuditEntity | null,
  compare: ActivityAuditEntity | null,
  type?: ActivityAuditResourceType,
  isCurrent?: boolean,
  t?: (str: string) => string,
): Record<string, ActivityAuditDiff[]> => {
  const result: Record<string, ActivityAuditDiff[]> = {
    properties: [],
  };

  const allKeys = new Set([...Object.keys(current || {}), ...Object.keys(compare || {})].sort(sortKeys));
  if (type === ActivityAuditResourceType.ROLE && !allKeys.has(EntityParameterKeys.SHARE)) {
    allKeys.add(EntityParameterKeys.SHARE);
  }
  const skipImageKeys = isImageDefinitionResource(type);

  if (current && compare) {
    allKeys.forEach((key) => {
      if (skipImageKeys && IMAGE_HIDDEN_KEYS.has(key)) return;
      const val1 = current?.[key];
      const val2 = compare?.[key];
      const isObject = typeof val1 === 'object' || typeof val2 === 'object';
      if (!isObject && !isAppRunnerParameter(key, type) && !isRoleSharingParameter(key, type)) {
        compareSimpleTypes(result.properties, key, val1, val2, isCurrent);
      } else {
        compareObjectTypes(result, key as EntityParameterKeys, val1 as object, val2 as object, type, isCurrent, t);
      }
    });
  }
  if (!current) {
    allKeys.forEach((key) => {
      if (skipImageKeys && IMAGE_HIDDEN_KEYS.has(key)) return;
      const value = compare?.[key];
      const isObject = typeof value === 'object';
      if (!isObject && !isAppRunnerParameter(key, type) && !isRoleSharingParameter(key, type)) {
        fillSimpleTypes(result.properties, key, value);
      } else {
        fillObjectTypes(result, key as EntityParameterKeys, value as object, type, t);
      }
    });
  }

  return result;
};

export const compareObjectTypes = (
  diffMap: Record<string, ActivityAuditDiff[]>,
  key: EntityParameterKeys,
  val1: object,
  val2: object,
  type?: ActivityAuditResourceType,
  isCurrent?: boolean,
  t?: (str: string) => string,
): void => {
  if (isAppRunnerParameter(key, type)) {
    if (!diffMap.parameters) {
      diffMap.parameters = [];
    }
    compareAppRunnerParameters(diffMap.parameters, key, val1, val2);
  } else if (arrayParameterKeys.includes(key)) {
    compareSimpleTypes(
      diffMap.properties,
      key,
      (val1 as string[])?.sort().join(', '),
      (val2 as string[])?.sort().join(', '),
      isCurrent,
    );
  } else if (
    arrayStringParameterKeys.includes(key) ||
    (key === EntityParameterKeys.LIMITS && type === ActivityAuditResourceType.MODEL)
  ) {
    compareStringArray(diffMap.properties, key, val1, val2, isCurrent, t);
  } else if (arrayObjectParameterKeys.includes(key)) {
    compareObjectArray(diffMap, key, val1 as object[], val2 as object[], isCurrent);
  } else if (key === EntityParameterKeys.SOURCE) {
    const { completionEndpointPath: __completionEndpointPath1, ...value1 } = val1 as {
      completionEndpointPath?: string;
    };
    const { completionEndpointPath: __completionEndpointPath2, ...value2 } = val2 as {
      completionEndpointPath?: string;
    };
    compareSimpleObjects(diffMap.properties, normalizeImageSource(value1), normalizeImageSource(value2), isCurrent);
  } else if (
    !diffMap[key] &&
    (separateObjectParameterKeys.includes(key) ||
      (type === ActivityAuditResourceType.ROLE &&
        (key === EntityParameterKeys.LIMITS ||
          key === EntityParameterKeys.SHARE ||
          key === EntityParameterKeys.COST_LIMIT)))
  ) {
    diffMap[key] = [];
    compareSeparateObjects(diffMap[key], key, val1, val2, isCurrent);
  }
};

type ImageSourceShape = Record<string, unknown> & {
  externalRegistryRef?: ExternalRegistryRef;
};

// MCP-Registry sources are projected to a synthetic `mcp-registry` $type with
// just packageName + serverVersion — the docker/git-specific fields (imageUri,
// url, branchName, sha, baseDirectory) are intentionally dropped because they
// are not populated by the registry.
const normalizeImageSource = (source: object | undefined): object => {
  if (!source || typeof source !== 'object') return source ?? {};
  const src = source as ImageSourceShape;
  if (src.externalRegistryRef && typeof src.externalRegistryRef === 'object') {
    return {
      $type: 'mcp-registry',
      packageName: src.externalRegistryRef.packageName ?? '',
      serverVersion: src.externalRegistryRef.version ?? '',
    };
  }
  if ('externalRegistryRef' in src) {
    const { externalRegistryRef: __excluded, ...rest } = src;
    return rest;
  }
  return source;
};

export const fillObjectTypes = (
  diffMap: Record<string, ActivityAuditDiff[]>,
  key: EntityParameterKeys,
  value: object,
  type?: ActivityAuditResourceType,
  t?: (str: string) => string,
) => {
  if (isAppRunnerParameter(key, type)) {
    if (!diffMap.parameters) {
      diffMap.parameters = [];
    }
    fillAppRunnerParameters(diffMap.parameters, key, value);
  } else if (arrayParameterKeys.includes(key)) {
    fillSimpleTypes(diffMap.properties, key, (value as string[])?.sort().join(', '));
  } else if (
    arrayStringParameterKeys.includes(key) ||
    (key === EntityParameterKeys.LIMITS && type === ActivityAuditResourceType.MODEL)
  ) {
    fillStringArray(diffMap.properties, key, value, t);
  } else if (arrayObjectParameterKeys.includes(key)) {
    fillObjectArray(diffMap, key, value as object[]);
  } else if (key === EntityParameterKeys.SOURCE) {
    const { completionEndpointPath: __completionEndpointPath1, ...value1 } = value as {
      completionEndpointPath?: string;
    };
    fillSimpleObjects(diffMap.properties, normalizeImageSource(value1));
  } else if (
    !diffMap[key] &&
    (separateObjectParameterKeys.includes(key) ||
      (type === ActivityAuditResourceType.ROLE &&
        (key === EntityParameterKeys.LIMITS ||
          key === EntityParameterKeys.SHARE ||
          key === EntityParameterKeys.COST_LIMIT)))
  ) {
    diffMap[key] = [];
    fillSeparateObjects(diffMap[key], key, value);
  }
};

/**
 * Compare most complex object where can be multiple values to compare
 *
 * @param {Record<string, ActivityAuditDiff[]>} diffMap - result map
 * @param {string} key - resource key
 * @param {object[]} val1 - first value to compare
 * @param {object[]} val2 - second value to compare
 */
export const compareObjectArray = (
  diffMap: Record<string, ActivityAuditDiff[]>,
  key: string,
  val1: object[] | Record<string, unknown>,
  val2: object[] | Record<string, unknown>,
  isCurrent?: boolean,
): void => {
  if (key === EntityParameterKeys.UPSTREAMS) {
    compareUpstreams(diffMap, val1 as DialModelEndpoint[], val2 as DialModelEndpoint[], isCurrent);
  }
  if (key === EntityParameterKeys.DEFAULTS || key === EntityParameterKeys.APP_PROPERTIES) {
    compareDefaults(diffMap, key, val1 as Record<string, unknown>, val2 as Record<string, unknown>, isCurrent);
  }
};

/**
 * Fill most complex object where can be multiple values to fill diff
 *
 * @param {Record<string, ActivityAuditDiff[]>} diffMap - result map
 * @param {string} key - resource key
 * @param {object[]} value - value to fill
 */
export const fillObjectArray = (
  diffMap: Record<string, ActivityAuditDiff[]>,
  key: string,
  value: object[] | Record<string, unknown>,
): void => {
  if (key === EntityParameterKeys.UPSTREAMS) {
    fillUpstreams(diffMap, value as DialModelEndpoint[]);
  }
  if (key === EntityParameterKeys.DEFAULTS || key === EntityParameterKeys.APP_PROPERTIES) {
    fillDefaults(diffMap, key, value as Record<string, unknown>);
  }
};

type SeparateObjectHandler = {
  compare: (diffs: ActivityAuditDiff[], val1: object, val2: object, isCurrent?: boolean) => void;
  fill: (diffs: ActivityAuditDiff[], value: object) => void;
};

const interceptorsHandler: SeparateObjectHandler = {
  compare: (diffs, val1, val2, isCurrent) => compareInterceptors(diffs, val1 as string[], val2 as string[], isCurrent),
  fill: (diffs, value) => fillInterceptors(diffs, value as string[]),
};

const entitiesHandler: SeparateObjectHandler = {
  compare: (diffs, val1, val2, isCurrent) => compareEntities(diffs, val1 as string[], val2 as string[], isCurrent),
  fill: (diffs, value) => fillEntities(diffs, value as string[]),
};

const roleLimitsHandler: SeparateObjectHandler = {
  compare: (diffs, val1, val2, isCurrent) =>
    compareRoleLimits(diffs, val1 as Record<string, DialRoleLimits>, val2 as Record<string, DialRoleLimits>, isCurrent),
  fill: (diffs, value) => fillRoleLimits(diffs, value as Record<string, DialRoleLimits>),
};

const shareHandler: SeparateObjectHandler = {
  compare: (diffs, val1, val2, isCurrent) =>
    compareShare(diffs, val1 as Record<string, DialRoleShare>, val2 as Record<string, DialRoleShare>, isCurrent),
  fill: (diffs, value) => fillShare(diffs, value as Record<string, DialRoleShare>),
};

const defaultLimitsHandler: SeparateObjectHandler = {
  compare: compareDefaultLimits,
  fill: fillDefaultLimits,
};

const featuresHandler: SeparateObjectHandler = {
  compare: compareSimpleObjects,
  fill: fillSimpleObjects,
};

const authHandler: SeparateObjectHandler = {
  compare: compareSimpleObjects,
  fill: () => undefined,
};

const allowedDomainsHandler: SeparateObjectHandler = {
  compare: (diffs, val1, val2, isCurrent) =>
    compareAllowedDomains(diffs, val1 as string[], val2 as string[], isCurrent),
  fill: (diffs, value) => fillAllowedDomains(diffs, value as string[]),
};

const domainsHandler: SeparateObjectHandler = {
  compare: (diffs, val1, val2, isCurrent) => compareDomains(diffs, val1 as string[], val2 as string[], isCurrent),
  fill: (diffs, value) => fillDomains(diffs, value as string[]),
};

const SEPARATE_OBJECT_HANDLERS: Record<string, SeparateObjectHandler> = {
  [EntityParameterKeys.ALLOWED_DOMAINS]: allowedDomainsHandler,
  [EntityParameterKeys.DOMAINS]: domainsHandler,
  [EntityParameterKeys.INTERCEPTORS]: interceptorsHandler,
  [EntityParameterKeys.GLOBAL_INTERCEPTORS]: interceptorsHandler,
  [EntityParameterKeys.APP_RUNNER_INTERCEPTORS]: interceptorsHandler,
  [EntityParameterKeys.ROLE_LIMITS]: roleLimitsHandler,
  [EntityParameterKeys.LIMITS]: roleLimitsHandler,
  [EntityParameterKeys.SHARE]: shareHandler,
  [EntityParameterKeys.COST_LIMIT]: defaultLimitsHandler,
  [EntityParameterKeys.DEFAULT_ROLE_LIMIT]: defaultLimitsHandler,
  [EntityParameterKeys.FEATURES]: featuresHandler,
  [EntityParameterKeys.AUTH]: authHandler,
  [EntityParameterKeys.APPLICATIONS]: entitiesHandler,
  [EntityParameterKeys.ENTITIES]: entitiesHandler,
  [EntityParameterKeys.KEYS]: entitiesHandler,
  [EntityParameterKeys.ROLES]: entitiesHandler,
  [EntityParameterKeys.ROUTES]: entitiesHandler,
  [EntityParameterKeys.DEPENDENCIES]: entitiesHandler,
  [EntityParameterKeys.MODELS]: entitiesHandler,
  [EntityParameterKeys.APP_RUNNERS]: entitiesHandler,
};

export const compareSeparateObjects = (
  diffs: ActivityAuditDiff[],
  key: string,
  val1: object,
  val2: object,
  isCurrent?: boolean,
): void => {
  SEPARATE_OBJECT_HANDLERS[key]?.compare(diffs, val1, val2, isCurrent);
};

export const fillSeparateObjects = (diffs: ActivityAuditDiff[], key: string, value: object): void => {
  SEPARATE_OBJECT_HANDLERS[key]?.fill(diffs, value);
};

/**
 * Generate sections from diff compare result
 *
 * @param {Record<string, ActivityAuditDiff[]>} current - current values with status
 * @param {Record<string, ActivityAuditDiff[]>} compare - compare values with status
 * @returns {ActivityAuditSection} - map with section keys and values
 */
export const createSectionFromDiffs = (
  current: Record<string, ActivityAuditDiff[]>,
  compare: Record<string, ActivityAuditDiff[]>,
): ActivityAuditSection => {
  const sectionNames = [
    EntityParameterKeys.PROPERTIES,
    EntityParameterKeys.UPSTREAMS,
    EntityParameterKeys.COST_LIMIT,
    EntityParameterKeys.FEATURES,
    EntityParameterKeys.AUTH,
    EntityParameterKeys.ROLES,
    EntityParameterKeys.INTERCEPTORS,
    EntityParameterKeys.APPLICATIONS,
    EntityParameterKeys.ENTITIES,
    EntityParameterKeys.KEYS,
    EntityParameterKeys.PARAMETERS,
    EntityParameterKeys.MODELS,
    EntityParameterKeys.DEPENDENCIES,
    EntityParameterKeys.DEFAULTS,
    EntityParameterKeys.APP_PROPERTIES,
    EntityParameterKeys.SHARE,
    EntityParameterKeys.APP_RUNNER_INTERCEPTORS,
    EntityParameterKeys.APP_RUNNERS,
    EntityParameterKeys.GLOBAL_INTERCEPTORS,
    EntityParameterKeys.ALLOWED_DOMAINS,
    EntityParameterKeys.DOMAINS,
  ];
  const sections: ActivityAuditSection = {};

  sectionNames.forEach((name) => {
    if (name == EntityParameterKeys.ROLES) {
      setRolesDiffs(sections, current, compare);
    } else if (
      name === EntityParameterKeys.UPSTREAMS ||
      name === EntityParameterKeys.DEFAULTS ||
      name === EntityParameterKeys.APP_PROPERTIES
    ) {
      setObjectsArrayDiff(sections, name, current, compare);
    } else {
      const currentItem = current[name];
      const compareItem = compare[name];
      if (currentItem?.length || compareItem?.length) {
        sections[name] = [{ current: currentItem, compare: compareItem }];
      }
    }
  });
  return sections;
};

/**
 * Generate map with entity status
 *
 * @param {Map<ActivityAuditResourceType, ActivityAuditEntity[] | null>} current - current state map
 * @param {Map<ActivityAuditResourceType, ActivityAuditEntity[] | null>} previous - previous state map
 * @param {?boolean} [isCurrent] - flag for correct coloring
 * @returns {Map<ActivityAuditResourceType, EntitiesGridData[]>} - map for each entity type with statuses
 */
export const mergeEntityMaps = (
  current: Map<ActivityAuditResourceType, ActivityAuditEntity[] | null>,
  previous: Map<ActivityAuditResourceType, ActivityAuditEntity[] | null>,
  isCurrent?: boolean,
): Map<ActivityAuditResourceType, EntitiesGridData[]> => {
  const result = new Map<ActivityAuditResourceType, EntitiesGridData[]>();

  for (const resourceType of current.keys()) {
    const currentEntities = current.get(resourceType) || [];
    const previousEntities = previous.get(resourceType) || [];

    const currentMap = new Map(currentEntities.map((e) => [e.name || e.$id, e]));
    const previousMap = new Map(previousEntities.map((e) => [e.name || e.$id, e]));

    const allNames = Array.from(new Set([...currentMap.keys(), ...previousMap.keys()])).sort();

    const mergedEntities: EntitiesGridData[] = allNames.map((name) => {
      const currentEntity = currentMap.get(name);
      const previousEntity = previousMap.get(name);

      if (currentEntity && !previousEntity) {
        return { ...currentEntity, diffStatus: isCurrent ? DiffStatus.ADDED : DiffStatus.REMOVED };
      }

      if (!currentEntity && previousEntity) {
        return { diffStatus: DiffStatus.MIRROR };
      }

      if (currentEntity && previousEntity) {
        if (isEqualSkippingUndefined(currentEntity, previousEntity)) {
          return currentEntity as unknown as EntitiesGridData;
        } else {
          return { ...currentEntity, diffStatus: DiffStatus.CHANGED };
        }
      }

      return {} as EntitiesGridData;
    });

    result.set(resourceType, mergedEntities);
  }
  return result;
};
