import {
  arrayObjectParameterKeys,
  arrayParameterKeys,
  arrayStringParameterKeys,
  EntityParameterKeys,
  separateObjectParameterKeys,
} from '@/src/components/ActivityAudit/constants';
import {
  ActivityAuditDiff,
  ActivityAuditSection,
  FlatRow,
  ImageSourceShape,
  SeparateObjectHandler,
} from '@/src/models/activity-audit';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import {
  ActivityAuditEntity,
  ActivityAuditResourceType,
  DiffStatus,
  isContainerDeploymentResource,
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
import {
  compareAllowedDomains,
  compareDomains,
  compareEntities,
  compareInterceptors,
  compareNestedFlatObject,
  compareRoleLimits,
  compareShare,
  fillAllowedDomains,
  fillDomains,
  fillEntities,
  fillInterceptors,
  fillNestedFlatObject,
  fillRoleLimits,
  fillShare,
} from './create-simple-diffs';
import { EnvironmentVariable } from '@/src/models/deployments/variables';
import { Autoscaling, ProbeProperties } from '@/src/models/deployments/containers';
import { ContainerResources } from '@/src/types/deployments/containers';
import { VALUE_TYPE } from '@/src/types/deployments/variables';
import { normalizeEnvironmentVariables } from '@/src/utils/deployments/containers';

const IMAGE_HIDDEN_KEYS = new Set<string>(['$type', 'id', 'createdAt', 'updatedAt']);

const CONTAINER_HIDDEN_KEYS = new Set<string>([
  '$type',
  'id',
  'createdAt',
  'updatedAt',
  'parentDeploymentName',
  'modelFormat',
]);

const CONTAINER_HIDE_IF_EMPTY_KEYS = new Set<string>(['nodePoolId', 'nodePoolName']);

const CONTAINER_PRIMITIVE_SECTION_ROUTING: Record<string, EntityParameterKeys> = {
  transport: EntityParameterKeys.ENDPOINT_CONFIGURATION,
  mcpEndpointPath: EntityParameterKeys.ENDPOINT_CONFIGURATION,
  containerPort: EntityParameterKeys.ENDPOINT_CONFIGURATION,
  containerGrpcPort: EntityParameterKeys.ENDPOINT_CONFIGURATION,
  command: EntityParameterKeys.CONFIGURATION,
  args: EntityParameterKeys.CONFIGURATION,
  nodePoolId: EntityParameterKeys.RESOURCES,
  nodePoolName: EntityParameterKeys.RESOURCES,
};

// Section render order for container detail (slotted between Properties and the
// generic admin sections). Adding a new container section means: register a
// SEPARATE_OBJECT_HANDLERS entry (or CONTAINER_PRIMITIVE_SECTION_ROUTING entry)
// AND list its key here so it renders in the right place.
const CONTAINER_SECTION_ORDER: EntityParameterKeys[] = [
  EntityParameterKeys.ENDPOINT_CONFIGURATION,
  EntityParameterKeys.SCALING,
  EntityParameterKeys.METADATA,
  EntityParameterKeys.RESOURCES,
  EntityParameterKeys.CONFIGURATION,
  EntityParameterKeys.PROBE_PROPERTIES,
];

// Section render order for admin-backend entities (models, roles, etc.).
const ADMIN_SECTION_ORDER: EntityParameterKeys[] = [
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

const isEmptyPrimitive = (v: unknown): boolean => v == null || v === '';

const applyDiffStatus = (result: Record<string, ActivityAuditDiff[]>, status: DiffStatus): void => {
  for (const diffs of Object.values(result)) {
    for (const diff of diffs) {
      if (diff.diffStatus == null) {
        diff.diffStatus = status;
      }
    }
  }
};

const getPrimitiveBucket = (
  result: Record<string, ActivityAuditDiff[]>,
  key: string,
  isContainerRow: boolean,
  val1?: unknown,
  val2?: unknown,
): ActivityAuditDiff[] | null => {
  if (isContainerRow) {
    if (CONTAINER_HIDE_IF_EMPTY_KEYS.has(key) && isEmptyPrimitive(val1) && isEmptyPrimitive(val2)) return null;
    const sectionKey = CONTAINER_PRIMITIVE_SECTION_ROUTING[key];
    if (sectionKey) {
      if (isEmptyPrimitive(val1) && isEmptyPrimitive(val2)) return null;
      if (!result[sectionKey]) result[sectionKey] = [];
      return result[sectionKey];
    }
  }
  return result.properties;
};

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
  const isContainerRow = isContainerDeploymentResource(type);
  const skipContainerKeys = isContainerRow;

  if (current && compare) {
    allKeys.forEach((key) => {
      if (skipImageKeys && IMAGE_HIDDEN_KEYS.has(key)) return;
      if (skipContainerKeys && CONTAINER_HIDDEN_KEYS.has(key)) return;
      const val1 = current?.[key];
      const val2 = compare?.[key];
      const isObject = typeof val1 === 'object' || typeof val2 === 'object';
      if (!isObject && !isAppRunnerParameter(key, type) && !isRoleSharingParameter(key, type)) {
        const bucket = getPrimitiveBucket(result, key, isContainerRow, val1, val2);
        if (bucket) compareSimpleTypes(bucket, key, val1, val2, isCurrent);
      } else {
        compareObjectTypes(result, key as EntityParameterKeys, val1 as object, val2 as object, type, isCurrent, t);
      }
    });
  }
  if (!current && compare) {
    allKeys.forEach((key) => {
      if (skipImageKeys && IMAGE_HIDDEN_KEYS.has(key)) return;
      if (skipContainerKeys && CONTAINER_HIDDEN_KEYS.has(key)) return;
      const value = compare[key];
      const isObject = typeof value === 'object';
      if (!isObject && !isAppRunnerParameter(key, type) && !isRoleSharingParameter(key, type)) {
        const bucket = getPrimitiveBucket(result, key, isContainerRow, undefined, value);
        if (bucket) fillSimpleTypes(bucket, key, value);
      } else {
        fillObjectTypes(result, key as EntityParameterKeys, value as object, type, t);
      }
    });
    if (isCurrent !== undefined) {
      applyDiffStatus(result, isCurrent ? DiffStatus.REMOVED : DiffStatus.ADDED);
    }
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
    separateObjectParameterKeys.includes(key) ||
    (type === ActivityAuditResourceType.ROLE &&
      (key === EntityParameterKeys.LIMITS ||
        key === EntityParameterKeys.SHARE ||
        key === EntityParameterKeys.COST_LIMIT))
  ) {
    if (!diffMap[key]) diffMap[key] = [];
    compareSeparateObjects(diffMap[key], key, val1, val2, isCurrent);
  }
};

// MCP-Registry sources are projected to a synthetic `mcp-registry` $type with
// just packageName + serverVersion — the docker/git-specific fields (imageUri,
// url, branchName, sha, baseDirectory) are intentionally dropped because they
// are not populated by the registry.
//
// Internal-image container sources collapse the three imageDefinition* fields
// into a single `imageDefinition` row formatted as `Name (version)`; the
// internal id is dropped (not useful to humans, the displayed name is unique).
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
  if (src.imageDefinitionName || src.imageDefinitionVersion || src.imageDefinitionId) {
    const { imageDefinitionId: __id, imageDefinitionName: name, imageDefinitionVersion: version, ...rest } = src;
    const label = name && version ? `${name} (${version})` : name || version || '';
    return label ? { ...rest, imageDefinition: label } : rest;
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
    separateObjectParameterKeys.includes(key) ||
    (type === ActivityAuditResourceType.ROLE &&
      (key === EntityParameterKeys.LIMITS ||
        key === EntityParameterKeys.SHARE ||
        key === EntityParameterKeys.COST_LIMIT))
  ) {
    if (!diffMap[key]) diffMap[key] = [];
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
  if (key === EntityParameterKeys.METADATA) {
    compareMetadataEnvs(
      diffMap,
      (val1 as { envs?: EnvironmentVariable[] } | undefined)?.envs,
      (val2 as { envs?: EnvironmentVariable[] } | undefined)?.envs,
      isCurrent,
    );
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
  if (key === EntityParameterKeys.METADATA) {
    fillMetadataEnvs(diffMap, (value as { envs?: EnvironmentVariable[] } | undefined)?.envs);
  }
};

const envValueLabel = (env: EnvironmentVariable): string => {
  if (env.value?.$type === VALUE_TYPE.FILE) return env.value.fileName || '';
  return env.value?.value || '';
};

const envBucketRows = (env: EnvironmentVariable | undefined): ActivityAuditDiff[] => {
  if (!env) return [];
  const isFile = env.value?.$type === VALUE_TYPE.FILE;
  return [
    { parameter: 'envName', value: env.name || '' },
    { parameter: 'envDescription', value: env.description || '' },
    {
      parameter: 'envValue',
      value: envValueLabel(env),
      mountType: env.mountType,
      valueType: env.value?.$type,
      ...(isFile && env.value?.fileContent ? { fileContent: env.value.fileContent } : {}),
    },
    { parameter: 'envMountType', value: env.mountType || '' },
  ];
};

const compareMetadataEnvs = (
  diffMap: Record<string, ActivityAuditDiff[]>,
  val1: EnvironmentVariable[] | undefined,
  val2: EnvironmentVariable[] | undefined,
  isCurrent?: boolean,
): void => {
  const sorted1 = normalizeEnvironmentVariables(val1);
  const sorted2 = normalizeEnvironmentVariables(val2);
  const allNames = Array.from(new Set([...sorted1, ...sorted2].map((e) => e.name))).sort();
  allNames.forEach((name, index) => {
    const sectionKey = `${EntityParameterKeys.METADATA}${index}`;
    if (!diffMap[sectionKey]) diffMap[sectionKey] = [];
    const e1 = sorted1.find((e) => e.name === name);
    const e2 = sorted2.find((e) => e.name === name);
    const rows1 = envBucketRows(e1);
    const rows2 = envBucketRows(e2);
    if (rows1.length === 0 && rows2.length === 0) return;
    if (rows1.length === 0) {
      rows2.forEach((row) =>
        diffMap[sectionKey].push({
          ...row,
          diffStatus: isCurrent ? DiffStatus.REMOVED : DiffStatus.ADDED,
        }),
      );
      return;
    }
    if (rows2.length === 0) {
      return;
    }
    rows1.forEach((row1, i) => {
      const row2 = rows2[i];
      const v1 = row1.value;
      const v2 = row2.value;
      if (v1 === v2) {
        diffMap[sectionKey].push({ ...row2 });
      } else {
        diffMap[sectionKey].push({ ...row2, diffStatus: DiffStatus.CHANGED });
      }
    });
  });
};

const fillMetadataEnvs = (
  diffMap: Record<string, ActivityAuditDiff[]>,
  value: EnvironmentVariable[] | undefined,
): void => {
  const sorted = normalizeEnvironmentVariables(value);
  sorted.forEach((env, index) => {
    const sectionKey = `${EntityParameterKeys.METADATA}${index}`;
    if (!diffMap[sectionKey]) diffMap[sectionKey] = [];
    envBucketRows(env).forEach((row) => diffMap[sectionKey].push(row));
  });
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

const toRowString = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return value.toString();
  return undefined;
};

const GPU_RESOURCE_KEY = 'nvidia.com/gpu';

const resourceRows = (resources: ContainerResources | undefined): FlatRow[] => {
  const req = resources?.requests ?? {};
  const lim = resources?.limits ?? {};
  return [
    { parameter: 'cpuRequest', value: toRowString(req.cpu) },
    { parameter: 'memoryRequest', value: toRowString(req.memory) },
    { parameter: 'gpuRequest', value: toRowString(req[GPU_RESOURCE_KEY] ?? req.gpu) },
    { parameter: 'cpuLimit', value: toRowString(lim.cpu) },
    { parameter: 'memoryLimit', value: toRowString(lim.memory) },
  ];
};

const scalingRows = (scaling: Autoscaling | undefined): FlatRow[] => {
  const sczs = scaling?.scaleToZeroDelaySeconds;
  const isNever = sczs == null || sczs === 0;
  const min = scaling?.minReplicas;
  const max = scaling?.maxReplicas;
  const minEqualsMax = min != null && max != null && min === max;
  const hideStrategy = isNever && minEqualsMax;

  return [
    { parameter: 'minReplicas', value: isNever ? toRowString(min) : undefined },
    { parameter: 'maxReplicas', value: isNever ? toRowString(max) : undefined },
    { parameter: 'scaleToZeroDelaySeconds', value: toRowString(sczs ?? 0) },
    {
      parameter: 'scalingStrategyType',
      value: hideStrategy ? undefined : toRowString(scaling?.strategy?.$type),
    },
    {
      parameter: 'scalingStrategyThreshold',
      value: hideStrategy ? undefined : toRowString(scaling?.strategy?.threshold),
    },
  ];
};

const probeRows = (pp: ProbeProperties | undefined): FlatRow[] => {
  // When the snapshot includes `probeProperties` at all, force-emit the
  // probeEnabled row (defaulting to false). This ensures the Startup probe
  // section renders for entities like HF that may persist only the flag.
  // Snapshots without the field entirely produce no rows here.
  if (!pp) return [];
  return [
    { parameter: 'probeEnabled', value: toRowString(pp.enabled ?? false) },
    { parameter: 'initialDelaySeconds', value: toRowString(pp.initialDelaySeconds) },
    { parameter: 'periodSeconds', value: toRowString(pp.periodSeconds) },
    { parameter: 'timeoutSeconds', value: toRowString(pp.timeoutSeconds) },
    { parameter: 'failureThreshold', value: toRowString(pp.failureThreshold) },
    { parameter: 'probeType', value: toRowString(pp.probe?.$type) },
    { parameter: 'probePath', value: toRowString(pp.probe?.path) },
    { parameter: 'probePort', value: toRowString(pp.probe?.port) },
  ];
};

const flatHandler = <T>(toRows: (value: T | undefined) => FlatRow[]): SeparateObjectHandler => ({
  compare: (diffs, val1, val2, isCurrent) =>
    compareNestedFlatObject(diffs, toRows(val1 as T | undefined), toRows(val2 as T | undefined), isCurrent),
  fill: (diffs, value) => fillNestedFlatObject(diffs, toRows(value as T | undefined)),
});

const resourcesHandler = flatHandler<ContainerResources>(resourceRows);
const scalingHandler = flatHandler<Autoscaling>(scalingRows);
const probePropertiesHandler = flatHandler<ProbeProperties>(probeRows);

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
  [EntityParameterKeys.RESOURCES]: resourcesHandler,
  [EntityParameterKeys.SCALING]: scalingHandler,
  [EntityParameterKeys.PROBE_PROPERTIES]: probePropertiesHandler,
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
  const sectionNames = [EntityParameterKeys.PROPERTIES, ...CONTAINER_SECTION_ORDER, ...ADMIN_SECTION_ORDER];
  const sections: ActivityAuditSection = {};

  sectionNames.forEach((name) => {
    if (name == EntityParameterKeys.ROLES) {
      setRolesDiffs(sections, current, compare);
    } else if (
      name === EntityParameterKeys.UPSTREAMS ||
      name === EntityParameterKeys.DEFAULTS ||
      name === EntityParameterKeys.APP_PROPERTIES ||
      name === EntityParameterKeys.METADATA
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
