import { ColDef } from 'ag-grid-community';
import { isEqual } from 'lodash';

import { NO_LIMITS_KEY } from '@/src/constants/role';
import { ActivityAuditDiff, ActivityAuditDiffSection, ActivityAuditSection } from '@/src/models/dial/activity-audit';
import { DialRoleLimits } from '@/src/models/dial/base-entity';
import { DialModelEndpoint } from '@/src/models/dial/model';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ActivityAuditEntity, ActivityAuditResourceType, DiffStatus } from '@/src/types/activity-audit';
import { formatTimestampToDate } from '@/src/utils/formatting/date';
import {
  ENTITIES_DIFF_COLUMNS,
  EntityParameterKeys,
  INTERCEPTORS_DIFF_COLUMNS,
  RESOURCE_DIFF_COLUMNS,
  ROLE_LIMITS_DIFF_COLUMNS,
} from './activity-audit';

const roleLimitsKeys = ['minute', 'day', 'week', 'month'];
const dateKeys = ['expiresAt', 'keyGeneratedAt', 'createdAt'];
const appRunnerParameterKeys = [
  'properties',
  'dial:applicationTypeEditorUrl',
  'dial:applicationTypeViewerUrl',
  'dial:applicationTypeCompletionEndpoint',
  '$defs',
];

const arrayParameterKeys = [EntityParameterKeys.TOPICS, EntityParameterKeys.PATHS, EntityParameterKeys.METHODS];
const arrayStringParameterKeys = [EntityParameterKeys.PRICING, EntityParameterKeys.RESPONSE];
const arrayObjectParameterKeys = [EntityParameterKeys.UPSTREAMS];
const separateObjectParameterKeys = [
  EntityParameterKeys.INTERCEPTORS,
  EntityParameterKeys.ROLE_LIMITS,
  EntityParameterKeys.DEFAULT_ROLE_LIMIT,
  EntityParameterKeys.FEATURES,
  EntityParameterKeys.APPLICATIONS,
  EntityParameterKeys.ENTITIES,
  EntityParameterKeys.KEYS,
  EntityParameterKeys.ROLES,
  EntityParameterKeys.MODELS,
];

export const getColumnsByParameter = (
  parameter?: string,
  index?: number,
  t?: (stringToTranslate: string) => string,
  type?: ActivityAuditResourceType,
): ColDef[] => {
  if (parameter === EntityParameterKeys.ROLES && (index === 1 || type === ActivityAuditResourceType.ROLE)) {
    return ROLE_LIMITS_DIFF_COLUMNS;
  }
  if (parameter === EntityParameterKeys.INTERCEPTORS) {
    return INTERCEPTORS_DIFF_COLUMNS;
  }
  if (
    parameter === EntityParameterKeys.APPLICATIONS ||
    parameter === EntityParameterKeys.ENTITIES ||
    parameter === EntityParameterKeys.KEYS ||
    (parameter === EntityParameterKeys.ROLES && type === ActivityAuditResourceType.KEY)
  ) {
    return ENTITIES_DIFF_COLUMNS;
  }
  return RESOURCE_DIFF_COLUMNS(t as (stringToTranslate: string) => string);
};

export const getRowDataByParameter = (
  data?: ActivityAuditDiff[],
  parameter?: string,
  index?: number,
  type?: ActivityAuditResourceType,
) => {
  if (parameter === EntityParameterKeys.ROLES && (index === 1 || type === ActivityAuditResourceType.ROLE)) {
    return data?.map((item) => {
      const valueMap: Record<string, string> = {};
      item.value.split(',').forEach((pair) => {
        const [key, val] = pair.split(':').map((s) => s.trim());
        valueMap[key as keyof typeof valueMap] = val;
      });

      const newObj: Record<string, string> = {
        ...item,
      };

      if (item.parameter) {
        roleLimitsKeys.forEach((key) => {
          newObj[key] = valueMap[key] || NO_LIMITS_KEY;
        });
      }

      return newObj as unknown as ActivityAuditDiff;
    });
  }
  return data;
};

/**
 * Generate activity audit diff between two resources, divided into different sections if needed
 *
 * @param {(ActivityAuditEntity | null)} current - current resource
 * @param {(ActivityAuditEntity | null)} compare - compare resource
 * @returns {Record<string, ActivityAuditDiff[]>} - resource diff with status
 */
export const generateCurrentResource = (
  current: ActivityAuditEntity | null,
  compare: ActivityAuditEntity | null,
  type?: ActivityAuditResourceType,
  isCurrent?: boolean,
): Record<string, ActivityAuditDiff[]> => {
  const result: Record<string, ActivityAuditDiff[]> = {
    properties: [],
  };

  const allKeys = new Set([...Object.keys(current || {}), ...Object.keys(compare || {})].sort(sortKeys));
  if (current && compare) {
    allKeys.forEach((key) => {
      const val1 = current?.[key];
      const val2 = compare?.[key];
      const isObject = typeof val1 === 'object' || typeof val2 === 'object';
      if (!isObject && !isAppRunnerParameter(key, type)) {
        compareSimpleTypes(result.properties, key, val1, val2, isCurrent);
      } else {
        compareObjectTypes(result, key as EntityParameterKeys, val1 as object, val2 as object, type, isCurrent);
      }
    });
  }
  if (!current) {
    allKeys.forEach((key) => {
      const value = compare?.[key];
      const isObject = typeof value === 'object';
      if (!isObject && !isAppRunnerParameter(key, type)) {
        fillSimpleTypes(result.properties, key, value);
      } else {
        fillObjectTypes(result, key as EntityParameterKeys, value as object, type);
      }
    });
  }

  return result;
};

/**
 * Compare simple types string | boolean | number
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string} key - resource key
 * @param {(string | boolean | number)} val1 - first value to compare
 * @param {(string | boolean | number)} val2 - second value to compare
 */
export const compareSimpleTypes = (
  diffs: ActivityAuditDiff[],
  key: string,
  val1?: string | boolean | number,
  val2?: string | boolean | number,
  isCurrent?: boolean,
): void => {
  const isTime = dateKeys.includes(key);
  if (isSimpleValueAddedOrRemoved(val1, val2)) {
    diffs.push({ parameter: key, value: '', status: isCurrent ? void 0 : DiffStatus.REMOVED });
  } else if (isSimpleValueAddedOrRemoved(val2, val1)) {
    diffs.push({
      parameter: key,
      value: isTime ? formatTimestampToDate(val2 as number) : val2?.toString() || '',
      status: isCurrent ? void 0 : DiffStatus.ADDED,
    });
  } else if (isSimpleValueChanged(val1, val2)) {
    diffs.push({
      parameter: key,
      value: isTime ? formatTimestampToDate(val2 as number) : val2?.toString() || '',
      status: DiffStatus.CHANGED,
    });
  } else {
    diffs.push({
      parameter: key,
      value: isTime ? formatTimestampToDate(val1 as number) : val1?.toString() || '',
    });
  }
};

/**
 * Fill diff for simple types string | boolean | number without comparison
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string} key - resource key
 * @param {?(string | boolean | number)} [value] - value to fill
 */
export const fillSimpleTypes = (diffs: ActivityAuditDiff[], key: string, value?: string | boolean | number): void => {
  const isTime = dateKeys.includes(key);
  diffs.push({ parameter: key, value: isTime ? formatTimestampToDate(value as number) : value?.toString() || '' });
};

/**
 * Compare more complex object in different ways
 *
 * @param {Record<string, ActivityAuditDiff[]>} diffMap - map where stored result
 * @param {EntityParameterKeys} key - resource key
 * @param {object} val1 - first value to compare
 * @param {object} val2 - second value to compare
 */
export const compareObjectTypes = (
  diffMap: Record<string, ActivityAuditDiff[]>,
  key: EntityParameterKeys,
  val1: object,
  val2: object,
  type?: ActivityAuditResourceType,
  isCurrent?: boolean,
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
    compareStringArray(diffMap.properties, key, val1, val2, isCurrent);
  } else if (arrayObjectParameterKeys.includes(key)) {
    compareObjectArray(diffMap, key, val1 as object[], val2 as object[], isCurrent);
  } else if (
    !diffMap[key] &&
    (separateObjectParameterKeys.includes(key) ||
      (key === EntityParameterKeys.LIMITS && type === ActivityAuditResourceType.ROLE))
  ) {
    diffMap[key] = [];
    compareSeparateObjects(diffMap[key], key, val1, val2, isCurrent);
  }
};

/**
 * Fill diff for more complex object in different ways
 *
 * @param {Record<string, ActivityAuditDiff[]>} diffMap - map where stored result
 * @param {EntityParameterKeys} key - resource key
 * @param {object} value - value to fill
 */
export const fillObjectTypes = (
  diffMap: Record<string, ActivityAuditDiff[]>,
  key: EntityParameterKeys,
  value: object,
  type?: ActivityAuditResourceType,
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
    fillStringArray(diffMap.properties, key, value);
  } else if (arrayObjectParameterKeys.includes(key)) {
    fillObjectArray(diffMap, key, value as object[]);
  } else if (
    !diffMap[key] &&
    (separateObjectParameterKeys.includes(key) ||
      (key === EntityParameterKeys.LIMITS && type === ActivityAuditResourceType.ROLE))
  ) {
    diffMap[key] = [];
    fillSeparateObjects(diffMap[key], key, value);
  }
};

/**
 * Compare object values by key
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {object} val1 - first value to compare
 * @param {object} val2 - second value to compare
 */
export const compareSimpleObjects = (
  diffs: ActivityAuditDiff[],
  val1: object,
  val2: object,
  isCurrent?: boolean,
): void => {
  const allKeys = new Set([...Object.keys(val1 || {}), ...Object.keys(val2 || {})].sort());
  allKeys.forEach((key) => {
    const value1 = val1?.[key as keyof typeof val1];
    const value2 = val2?.[key as keyof typeof val2];
    compareSimpleTypes(diffs, key, value1 as string, value2 as string, isCurrent);
  });
};

/**
 * Fill diff object values by key
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {object} value - value to fill
 */
export const fillSimpleObjects = (diffs: ActivityAuditDiff[], value: object): void => {
  const allKeys = Object.keys(value).sort();
  allKeys.forEach((key) => {
    const val = value?.[key as keyof typeof value];
    fillSimpleTypes(diffs, key, val);
  });
};

/**
 * Compare object by creating one string
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string} key - resource key
 * @param {object} val1 - first value to compare
 * @param {object} val2 - second value to compare
 */
export const compareStringArray = (
  diffs: ActivityAuditDiff[],
  key: string,
  val1?: object,
  val2?: object,
  isCurrent?: boolean,
) => {
  const value1 = generateStringFromObject(val1);
  const value2 = generateStringFromObject(val2);
  compareSimpleTypes(diffs, key, value1, value2, isCurrent);
};

/**
 * Fill diff object by creating one string
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string} key - resource key
 * @param {object} value - value to fill
 */
export const fillStringArray = (diffs: ActivityAuditDiff[], key: string, value: object) => {
  const val = generateStringFromObject(value);
  fillSimpleTypes(diffs, key, val);
};

/**
 * Helper to create string from object key values
 *
 * @param {object} value - initial object
 * @returns {string} - result string
 */
export const generateStringFromObject = (value?: object): string => {
  return value
    ? Object.entries(value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    : '';
};

/**
 * Compare complex objects based on type
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string} key - resource key
 * @param {object} val1 - first value to compare
 * @param {object} val2 - second value to compare
 */
export const compareSeparateObjects = (
  diffs: ActivityAuditDiff[],
  key: string,
  val1: object,
  val2: object,
  isCurrent?: boolean,
): void => {
  if (key === EntityParameterKeys.INTERCEPTORS) {
    compareInterceptors(diffs, val1 as string[], val2 as string[], isCurrent);
  }
  if (key === EntityParameterKeys.ROLE_LIMITS || key === EntityParameterKeys.LIMITS) {
    compareRoleLimits(diffs, val1 as Record<string, DialRoleLimits>, val2 as Record<string, DialRoleLimits>, isCurrent);
  }
  if (key === EntityParameterKeys.DEFAULT_ROLE_LIMIT) {
    compareDefaultLimits(diffs, val1, val2, isCurrent);
  }
  if (key === EntityParameterKeys.FEATURES) {
    compareSimpleObjects(diffs, val1, val2, isCurrent);
  }
  if (
    key === EntityParameterKeys.APPLICATIONS ||
    key === EntityParameterKeys.ENTITIES ||
    key === EntityParameterKeys.KEYS ||
    key === EntityParameterKeys.ROLES ||
    key === EntityParameterKeys.MODELS
  ) {
    compareEntities(diffs, val1 as string[], val2 as string[], isCurrent);
  }
};

/**
 * Fill diff for complex objects based on type
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string} key key - resource key
 * @param {object} value - value to fill
 */
export const fillSeparateObjects = (diffs: ActivityAuditDiff[], key: string, value: object) => {
  if (key === EntityParameterKeys.INTERCEPTORS) {
    fillInterceptors(diffs, value as string[]);
  }
  if (key === EntityParameterKeys.ROLE_LIMITS || key === EntityParameterKeys.LIMITS) {
    fillRoleLimits(diffs, value as Record<string, DialRoleLimits>);
  }
  if (key === EntityParameterKeys.DEFAULT_ROLE_LIMIT) {
    fillDefaultLimits(diffs, value);
  }
  if (key === EntityParameterKeys.FEATURES) {
    fillSimpleObjects(diffs, value);
  }
  if (
    key === EntityParameterKeys.APPLICATIONS ||
    key === EntityParameterKeys.ENTITIES ||
    key === EntityParameterKeys.KEYS ||
    key === EntityParameterKeys.ROLES
  ) {
    fillApplications(diffs, value as string[]);
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
  val1: object[],
  val2: object[],
  isCurrent?: boolean,
): void => {
  if (key === EntityParameterKeys.UPSTREAMS) {
    compareUpstreams(diffMap, val1 as DialModelEndpoint[], val2 as DialModelEndpoint[], isCurrent);
  }
};

/**
 * Fill most complex object where can be multiple values to fill diff
 *
 * @param {Record<string, ActivityAuditDiff[]>} diffMap - result map
 * @param {string} key - resource key
 * @param {object[]} value - value to fill
 */
export const fillObjectArray = (diffMap: Record<string, ActivityAuditDiff[]>, key: string, value: object[]): void => {
  if (key === EntityParameterKeys.UPSTREAMS) {
    fillUpstreams(diffMap, value as DialModelEndpoint[]);
  }
};

/**
 * Compare entities
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string[]} val1 - first value to compare
 * @param {string[]} val2 - second value to compare
 */
export const compareEntities = (diffs: ActivityAuditDiff[], val1: string[], val2: string[], isCurrent?: boolean) => {
  const len = Math.max(val1?.length || 0, val2?.length || 0);
  for (let i = 0; i < len; i++) {
    const value1 = val1?.[i];
    const value2 = val2?.[i];

    if (value1 != null && value2 == null) {
      diffs.push({ parameter: '', value: '', status: isCurrent ? void 0 : DiffStatus.REMOVED });
    } else if (value1 == null && value2 != null) {
      diffs.push({ parameter: value2 || '', value: value2 || '', status: isCurrent ? void 0 : DiffStatus.ADDED });
    } else if (value1 != null && value2 != null && value1 !== value2) {
      diffs.push({ parameter: value2 || '', value: value2 || '', status: DiffStatus.CHANGED });
    } else {
      diffs.push({ parameter: value1 || '', value: value1 || '' });
    }
  }
};

/**
 * Fill entities diff
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string[]} value - value to fill
 */
export const fillApplications = (diffs: ActivityAuditDiff[], value: string[]) => {
  const result = (value || []).map((val) => ({
    parameter: val || '',
    value: val || '',
  }));
  diffs.push(...result);
};

/**
 * Compare interceptors
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string[]} val1 - first value to compare
 * @param {string[]} val2 - second value to compare
 */
export const compareInterceptors = (
  diffs: ActivityAuditDiff[],
  val1: string[],
  val2: string[],
  isCurrent?: boolean,
) => {
  const len = Math.max(val1?.length || 0, val2?.length || 0);
  for (let i = 0; i < len; i++) {
    const value1 = val1?.[i];
    const value2 = val2?.[i];
    const parameter = i.toString();

    if (value1 != null && value2 == null) {
      diffs.push({ parameter, value: '', status: isCurrent ? void 0 : DiffStatus.REMOVED });
    } else if (value1 == null && value2 != null) {
      diffs.push({ parameter, value: value2 || '', status: isCurrent ? void 0 : DiffStatus.ADDED });
    } else if (value1 != null && value2 != null && value1 !== value2) {
      diffs.push({ parameter, value: value2 || '', status: DiffStatus.CHANGED });
    } else {
      diffs.push({ parameter, value: value1 || '' });
    }
  }
};

/**
 * Fill interceptors diff
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string[]} value - value to fill
 */
export const fillInterceptors = (diffs: ActivityAuditDiff[], value: string[]) => {
  const result = (value || []).map((val, i) => ({
    parameter: i.toString(),
    value: val || '',
  }));
  diffs.push(...result);
};

/**
 * Compare role limits
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {Record<string, DialRoleLimits>} val1 - first value to compare
 * @param {Record<string, DialRoleLimits>} val2 - second value to compare
 */
export const compareRoleLimits = (
  diffs: ActivityAuditDiff[],
  val1: Record<string, DialRoleLimits>,
  val2: Record<string, DialRoleLimits>,
  isCurrent?: boolean,
): void => {
  const allKeys = new Set([...Object.keys(val1 || {}), ...Object.keys(val2 || {})].sort());
  allKeys.forEach((key) => {
    const value1 = val1?.[key as keyof typeof val1];
    const value2 = val2?.[key as keyof typeof val2];
    if (value1 != null && value2 == null) {
      diffs.push({ parameter: '', value: '', status: isCurrent ? void 0 : DiffStatus.REMOVED });
    } else if (value1 == null && value2 != null) {
      diffs.push({
        parameter: key,
        value: convertRoleLimitsIntoString(value2),
        status: isCurrent ? void 0 : DiffStatus.ADDED,
      });
    } else if (value1 != null && value2 != null && !isEqual(value1, value2)) {
      diffs.push({ parameter: key, value: convertRoleLimitsIntoString(value2), status: DiffStatus.CHANGED });
    } else {
      diffs.push({ parameter: key, value: convertRoleLimitsIntoString(value1) });
    }
  });
};

/**
 * Fill role limits diff
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {Record<string, DialRoleLimits>} value - value to fill
 */
export const fillRoleLimits = (diffs: ActivityAuditDiff[], value: Record<string, DialRoleLimits>) => {
  const allKeys = Object.keys(value || {}).sort();
  allKeys.forEach((key) => {
    const val = value[key];
    diffs.push({ parameter: key, value: convertRoleLimitsIntoString(val) });
  });
};

/**
 * Convert all limits into one string
 *
 * @param {?DialRoleLimits} [limits] - role limits
 * @returns {string} - result string
 */
export const convertRoleLimitsIntoString = (limits?: DialRoleLimits): string => {
  return limits
    ? Object.entries(limits)
        .filter(([key]) => key !== EntityParameterKeys.ENABLED)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    : '';
};

/**
 * Compare default role limits
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {DialRoleLimits} val1 - first value to compare
 * @param {DialRoleLimits} val2 - second value to compare
 */
export const compareDefaultLimits = (
  diffs: ActivityAuditDiff[],
  val1: DialRoleLimits,
  val2: DialRoleLimits,
  isCurrent?: boolean,
): void => {
  roleLimitsKeys.forEach((key) => {
    const value1 = val1?.[key as keyof typeof val1] || NO_LIMITS_KEY;
    const value2 = val2?.[key as keyof typeof val2] || NO_LIMITS_KEY;
    compareSimpleTypes(diffs, key, value1, value2, isCurrent);
  });
};

/**
 * Fill default role limits diff
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {DialRoleLimits} value - value to fill
 */
export const fillDefaultLimits = (diffs: ActivityAuditDiff[], value: DialRoleLimits): void => {
  roleLimitsKeys.forEach((key) => {
    const val = value?.[key as keyof typeof value] || NO_LIMITS_KEY;
    fillSimpleTypes(diffs, key, val);
  });
};

/**
 * Compare upstreams
 *
 * @param {Record<string, ActivityAuditDiff[]>} diffMap - result map
 * @param {DialModelEndpoint[]} val1 - first value to compare
 * @param {DialModelEndpoint[]} val2 - second value to compare
 */
export const compareUpstreams = (
  diffMap: Record<string, ActivityAuditDiff[]>,
  val1: DialModelEndpoint[],
  val2: DialModelEndpoint[],
  isCurrent?: boolean,
): void => {
  const allEndpoints = [...new Set([...val1, ...val2].map((endpoint) => endpoint.endpoint))].sort();
  allEndpoints.forEach((endpointKey, index) => {
    const sectionKey = `${EntityParameterKeys.UPSTREAMS}${index}`;
    if (!diffMap[sectionKey]) diffMap[sectionKey] = [];

    const v1 = val1.find((e) => e.endpoint === endpointKey);
    const v2 = val2.find((e) => e.endpoint === endpointKey);

    if (v1 && !v2) {
      compareSimpleObjects(diffMap[sectionKey], v1, createEmptyObjectWithKeys(v1), isCurrent);
    } else if (!v1 && v2) {
      compareSimpleObjects(diffMap[sectionKey], createEmptyObjectWithKeys(v2), v2, isCurrent);
    } else if (v1 && v2 && v1 !== v2) {
      compareSimpleObjects(diffMap[sectionKey], v1, v2, isCurrent);
    }
  });
};

/**
 * Fill upstreams diff
 *
 * @param {Record<string, ActivityAuditDiff[]>} diffMap - result map
 * @param {DialModelEndpoint[]} value - value to fill
 */
export const fillUpstreams = (diffMap: Record<string, ActivityAuditDiff[]>, value: DialModelEndpoint[]) => {
  value.forEach((val, index) => {
    const sectionKey = `${EntityParameterKeys.UPSTREAMS}${index}`;
    if (!diffMap[sectionKey]) diffMap[sectionKey] = [];
    fillSimpleObjects(diffMap[sectionKey], val);
  });
};

/**
 * Compare app runner parameters
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string} key - property key
 * @param {(string | object)} val1 - first value to compare
 * @param {(object | string)} val2 - second value to compare
 */
export const compareAppRunnerParameters = (
  diffs: ActivityAuditDiff[],
  key: string,
  val1: string | object,
  val2: object | string,
) => {
  if (isPathKey(key)) {
    compareSimpleTypes(diffs, key, val1 as string, val2 as string);
  } else {
    compareStringArray(diffs, key, val1 as object, val2 as object);
  }
};

/**
 * Fill app runner parameter diff
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string} key - property key
 * @param {(object | string)} value - value to fill
 */
export const fillAppRunnerParameters = (diffs: ActivityAuditDiff[], key: string, value: object | string) => {
  if (isPathKey(key)) {
    fillSimpleTypes(diffs, key, value as string);
  } else {
    fillStringArray(diffs, key, value as object);
  }
};

/**
 * Generate object with same keys and empty values
 *
 * @template {object} T
 * @param {T} obj - object to copy
 * @returns {T} - object with empty values
 */
const createEmptyObjectWithKeys = <T extends object>(obj: T): T => {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key as keyof T] = '' as T[keyof T];
    return acc;
  }, {} as T);
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
    EntityParameterKeys.FEATURES,
    EntityParameterKeys.ROLES,
    EntityParameterKeys.INTERCEPTORS,
    EntityParameterKeys.APPLICATIONS,
    EntityParameterKeys.ENTITIES,
    EntityParameterKeys.KEYS,
    EntityParameterKeys.PARAMETERS,
    EntityParameterKeys.MODELS,
  ];
  const sections: ActivityAuditSection = {};
  sectionNames.forEach((name) => {
    if (name == EntityParameterKeys.ROLES) {
      const currentDefault = current[EntityParameterKeys.DEFAULT_ROLE_LIMIT];
      const compareDefault = compare[EntityParameterKeys.DEFAULT_ROLE_LIMIT];
      const currentLimits = current[EntityParameterKeys.ROLE_LIMITS];
      const compareLimits = compare[EntityParameterKeys.ROLE_LIMITS];
      if (currentDefault?.length || compareDefault?.length) {
        if (!sections[name]) {
          sections[name] = [];
        }
        sections[name].push({ current: currentDefault, compare: compareDefault });
      }
      if (currentLimits?.length || compareLimits?.length) {
        if (!sections[name]) {
          sections[name] = [];
        }
        sections[name].push({ current: currentLimits, compare: compareLimits });
      }
      // case for role where limits stored into 'limits' property instead of entities 'roleLimits' or 'defaultRoleLimit'
      if (!currentDefault && !compareDefault && !currentLimits && !compareLimits) {
        const currentRoleLimits = current[EntityParameterKeys.LIMITS];
        const compareRoleLimits = compare[EntityParameterKeys.LIMITS];
        if (currentRoleLimits?.length || compareRoleLimits?.length) {
          if (!sections[name]) {
            sections[name] = [];
          }
          sections[name].push({ current: currentRoleLimits, compare: compareRoleLimits });
        }
        // case for key where only role names stored into 'roles' property
        const currentRoles = current[EntityParameterKeys.ROLES];
        const compareRoles = compare[EntityParameterKeys.ROLES];
        if (currentRoles?.length || compareRoles?.length) {
          if (!sections[name]) {
            sections[name] = [];
          }
          sections[name].push({ current: currentRoles, compare: compareRoles });
        }
      }
    } else if (name === EntityParameterKeys.UPSTREAMS) {
      const [largerObj] = [current, compare].sort((a, b) => Object.keys(b).length - Object.keys(a).length);
      Object.keys(largerObj)
        .filter((key) => key.includes('upstreams'))
        .forEach((upstreamKey) => {
          const currentUpstream = current[upstreamKey];
          const compareUpstream = compare[upstreamKey];
          if (currentUpstream?.length || compareUpstream?.length) {
            if (!sections[EntityParameterKeys.UPSTREAMS]) {
              sections[EntityParameterKeys.UPSTREAMS] = [];
            }
            sections[EntityParameterKeys.UPSTREAMS].push({ current: currentUpstream, compare: compareUpstream });
          }
        });
    } else {
      const currentItem = current[name];
      const compareItem = compare[name];
      if (currentItem?.length || compareItem?.length) {
        sections[name] = [];
        sections[name].push({ current: currentItem, compare: compareItem });
      }
    }
  });
  return sections;
};

/**
 * Calculate number of changes in diff section
 *
 * @param {ActivityAuditDiffSection[]} sections - section where need to check changes
 * @param {?DiffStatus} [status] - status which need to check
 * @returns {number} - result of status changes count
 */
export const getDiffCount = (sections: ActivityAuditDiffSection[], status?: DiffStatus): number => {
  let count = 0;

  sections.forEach((section) => {
    Object.values(section).forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item.status === status) {
            count++;
          }
        });
      }
    });
  });
  return status === DiffStatus.CHANGED ? count / 2 : count;
};

/**
 * Helper to compare values and set correct status after
 *
 * @param {?(string | boolean | number)} [value1] - first value
 * @param {?(string | boolean | number)} [value2] - second value
 * @returns {boolean} - compare result
 */
export const isSimpleValueAddedOrRemoved = (
  value1?: string | boolean | number,
  value2?: string | boolean | number,
): boolean => {
  return value1 !== '' && value1! != null && (value2 === '' || value2 == null);
};

/**
 * Helper to compare values and set correct status after
 *
 * @param {?(string | boolean | number)} [value1] - first value
 * @param {?(string | boolean | number)} [value2] - second value
 * @returns {boolean} - compare result
 */
export const isSimpleValueChanged = (
  value1?: string | boolean | number,
  value2?: string | boolean | number,
): boolean => {
  return value1 != null && value2 != null && value1 !== value2;
};

/**
 * Check if need to put property in different section
 *
 * @param {string} key - property key
 * @param {?ActivityAuditResourceType} [type] - resource type
 * @returns {boolean} - check result
 */
export const isAppRunnerParameter = (key: string, type?: ActivityAuditResourceType): boolean => {
  return type === ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA && appRunnerParameterKeys.includes(key);
};

/**
 * Check if key related to path
 *
 * @param {string} key - property key
 * @returns {boolean} - check result
 */
export const isPathKey = (key: string): boolean => {
  return key.startsWith('dial:');
};

/**
 * Sorting function for parameter keys to put some keys not in alphabetical order
 *
 * @param {string} a - first key
 * @param {string} b - second key
 * @returns {number} - compare result
 */
export const sortKeys = (a: string, b: string): number => {
  const priorityKeys = ['displayName', 'dial:applicationTypeDisplayName', 'name', '$id', 'version', 'displayVersion'];

  const aIndex = priorityKeys.indexOf(a);
  const bIndex = priorityKeys.indexOf(b);

  if (aIndex === -1 && bIndex === -1) {
    return a.localeCompare(b);
  }
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
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
        return { ...currentEntity, status: isCurrent ? DiffStatus.ADDED : DiffStatus.REMOVED };
      }

      if (!currentEntity && previousEntity) {
        return { status: void 0 };
      }

      if (currentEntity && previousEntity) {
        if (isEqual(currentEntity, previousEntity)) {
          return currentEntity as unknown as EntitiesGridData;
        } else {
          return { ...currentEntity, status: DiffStatus.CHANGED };
        }
      }

      return {} as EntitiesGridData;
    });

    result.set(resourceType, mergedEntities);
  }
  return result;
};
