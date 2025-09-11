import { ModelViewI18nKey } from '@/src/constants/i18n';
import { NO_LIMITS_KEY } from '@/src/constants/role';
import { ActivityAuditDiff, ActivityAuditSection } from '@/src/models/activity-audit';
import { DialRoleLimits } from '@/src/models/dial/role-limits';
import { DialModelEndpoint, DialModelPricing, PricingType } from '@/src/models/dial/model';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ActivityAuditEntity, ActivityAuditResourceType, DiffStatus } from '@/src/types/activity-audit';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { roleLimitsKeys, roleShareLimitsKeys } from '@/src/components/ActivityAudit/View/DiffReport/utils';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';

const dateKeys = ['expiresAt', 'keyGeneratedAt', 'createdAt', 'updatedAt'];
const appRunnerParameterKeys = ['properties', '$defs'];

const arrayParameterKeys = [
  EntityParameterKeys.TOPICS,
  EntityParameterKeys.HASHING_ORDER,
  EntityParameterKeys.PATHS,
  EntityParameterKeys.METHODS,
];
const arrayStringParameterKeys = [EntityParameterKeys.PRICING, EntityParameterKeys.RESPONSE];
const arrayObjectParameterKeys = [EntityParameterKeys.UPSTREAMS];
const separateObjectParameterKeys = [
  EntityParameterKeys.INTERCEPTORS,
  EntityParameterKeys.ROLE_LIMITS,
  EntityParameterKeys.DEFAULT_ROLE_LIMIT,
  EntityParameterKeys.ROLE_SHARE_LIMITS,
  EntityParameterKeys.DEFAULT_ROLE_SHARE_LIMIT,
  EntityParameterKeys.FEATURES,
  EntityParameterKeys.APPLICATIONS,
  EntityParameterKeys.ENTITIES,
  EntityParameterKeys.ROUTES,
  EntityParameterKeys.KEYS,
  EntityParameterKeys.ROLES,
  EntityParameterKeys.MODELS,
  EntityParameterKeys.DEPENDENCIES,
];

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
  t?: (str: string) => string,
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
        compareObjectTypes(result, key as EntityParameterKeys, val1 as object, val2 as object, type, isCurrent, t);
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
        fillObjectTypes(result, key as EntityParameterKeys, value as object, type, t);
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
    diffs.push({ parameter: key, value: '', status: isCurrent ? DiffStatus.MIRROR : DiffStatus.REMOVED });
  } else if (isSimpleValueAddedOrRemoved(val2, val1)) {
    diffs.push({
      parameter: key,
      value: isTime ? formatDateTimeToLocalString(val2 as number) : val2?.toString() || '',
      status: isCurrent ? DiffStatus.MIRROR : DiffStatus.ADDED,
    });
  } else if (isSimpleValueChanged(val1, val2)) {
    diffs.push({
      parameter: key,
      value: isTime ? formatDateTimeToLocalString(val2 as number) : val2?.toString() || '',
      status: DiffStatus.CHANGED,
    });
  } else {
    diffs.push({
      parameter: key,
      value: isTime ? formatDateTimeToLocalString(val1 as number) : val1?.toString() || '',
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
  diffs.push({
    parameter: key,
    value: isTime ? formatDateTimeToLocalString(value as number) : value?.toString() || '',
  });
};

/**
 * Compare more complex object in different ways
 *
 * @param {Record<string, ActivityAuditDiff[]>} diffMap - map where stored result
 * @param {EntityParameterKeys} key - resource key
 * @param {object} val1 - first value to compare
 * @param {object} val2 - second value to compare
 */
const compareObjectTypes = (
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
  } else if (
    !diffMap[key] &&
    (separateObjectParameterKeys.includes(key) ||
      (type === ActivityAuditResourceType.ROLE &&
        (key === EntityParameterKeys.LIMITS || key === EntityParameterKeys.SHARE)))
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
const fillObjectTypes = (
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
const compareSimpleObjects = (diffs: ActivityAuditDiff[], val1: object, val2: object, isCurrent?: boolean): void => {
  const allKeys = new Set([...Object.keys(val1 || {}), ...Object.keys(val2 || {})].sort());
  allKeys.forEach((key) => {
    const value1 = val1?.[key as keyof typeof val1];
    const value2 = val2?.[key as keyof typeof val2];
    if (typeof value1 === 'object' || typeof value2 === 'object') {
      compareStringArray(diffs, key, value1, value2, isCurrent);
    } else {
      compareSimpleTypes(diffs, key, value1 as string, value2 as string, isCurrent);
    }
  });
};

/**
 * Fill diff object values by key
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {object} value - value to fill
 */
const fillSimpleObjects = (diffs: ActivityAuditDiff[], value: object): void => {
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
const compareStringArray = (
  diffs: ActivityAuditDiff[],
  key: string,
  val1?: object,
  val2?: object,
  isCurrent?: boolean,
  t?: (str: string) => string,
) => {
  const value1 = generateStringFromObject(val1, key === EntityParameterKeys.PRICING ? t : void 0);
  const value2 = generateStringFromObject(val2, key === EntityParameterKeys.PRICING ? t : void 0);
  compareSimpleTypes(diffs, key, value1, value2, isCurrent);
};

/**
 * Fill diff object by creating one string
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string} key - resource key
 * @param {object} value - value to fill
 */
const fillStringArray = (diffs: ActivityAuditDiff[], key: string, value: object, t?: (str: string) => string) => {
  const val = generateStringFromObject(value, key === EntityParameterKeys.PRICING ? t : void 0);
  fillSimpleTypes(diffs, key, val);
};

/**
 * Helper to create string from object key values
 *
 * @param {object} value - initial object
 * @returns {string} - result string
 */
const generateStringFromObject = (value?: object, t?: (str: string) => string): string => {
  if (t) {
    return convertPricing(value as DialModelPricing, t);
  }
  return value
    ? Object.entries(value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    : '';
};

/**
 * Helper to create correct pricing string
 *
 * @param {DialModelPricing} value - pricing object
 * @param {(str: string) => string} t - translation
 * @returns {string} - string with values and translation
 */
const convertPricing = (value: DialModelPricing, t: (str: string) => string): string => {
  const isToken = value.unit === PricingType.Token;
  return Object.entries(value)
    .map(([key, value]) => {
      return key === EntityParameterKeys.UNIT
        ? value === PricingType.Token
          ? `${t?.(ModelViewI18nKey.Tokens)} ${t?.(ModelViewI18nKey.PerMillion)}`
          : `${t?.(ModelViewI18nKey.CharWithoutWhitespace)}`
        : `${key}: ${isToken ? value * 1000000 : value}`;
    })
    .join(', ');
};

/**
 * Compare complex objects based on type
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string} key - resource key
 * @param {object} val1 - first value to compare
 * @param {object} val2 - second value to compare
 */
const compareSeparateObjects = (
  diffs: ActivityAuditDiff[],
  key: string,
  val1: object,
  val2: object,
  isCurrent?: boolean,
): void => {
  if (key === EntityParameterKeys.INTERCEPTORS) {
    compareInterceptors(diffs, val1 as string[], val2 as string[], isCurrent);
  }
  if (
    key === EntityParameterKeys.ROLE_LIMITS ||
    key === EntityParameterKeys.LIMITS ||
    key === EntityParameterKeys.ROLE_SHARE_LIMITS ||
    key === EntityParameterKeys.SHARE
  ) {
    compareRoleLimits(diffs, val1 as Record<string, DialRoleLimits>, val2 as Record<string, DialRoleLimits>, isCurrent);
  }
  if (key === EntityParameterKeys.DEFAULT_ROLE_LIMIT) {
    compareDefaultLimits(diffs, val1, val2, isCurrent);
  }
  if (key === EntityParameterKeys.DEFAULT_ROLE_SHARE_LIMIT) {
    compareDefaultShareLimits(diffs, val1, val2, isCurrent);
  }
  if (key === EntityParameterKeys.FEATURES) {
    compareSimpleObjects(diffs, val1, val2, isCurrent);
  }
  if (
    key === EntityParameterKeys.APPLICATIONS ||
    key === EntityParameterKeys.ENTITIES ||
    key === EntityParameterKeys.KEYS ||
    key === EntityParameterKeys.ROLES ||
    key === EntityParameterKeys.ROUTES ||
    key === EntityParameterKeys.DEPENDENCIES
  ) {
    compareEntities(diffs, val1 as string[], val2 as string[], isCurrent);
  }
  if (key === EntityParameterKeys.MODELS) {
    compareModels(diffs, val1 as string[], val2 as string[], isCurrent);
  }
};

/**
 * Fill diff for complex objects based on type
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string} key key - resource key
 * @param {object} value - value to fill
 */
const fillSeparateObjects = (diffs: ActivityAuditDiff[], key: string, value: object) => {
  if (key === EntityParameterKeys.INTERCEPTORS) {
    fillInterceptors(diffs, value as string[]);
  }
  if (
    key === EntityParameterKeys.ROLE_LIMITS ||
    key === EntityParameterKeys.LIMITS ||
    key === EntityParameterKeys.ROLE_SHARE_LIMITS ||
    key === EntityParameterKeys.SHARE
  ) {
    fillRoleLimits(diffs, value as Record<string, DialRoleLimits>);
  }
  if (key === EntityParameterKeys.DEFAULT_ROLE_LIMIT) {
    fillDefaultLimits(diffs, value);
  }
  if (key === EntityParameterKeys.DEFAULT_ROLE_SHARE_LIMIT) {
    fillDefaultShareLimits(diffs, value);
  }
  if (key === EntityParameterKeys.FEATURES) {
    fillSimpleObjects(diffs, value);
  }
  if (
    key === EntityParameterKeys.APPLICATIONS ||
    key === EntityParameterKeys.ENTITIES ||
    key === EntityParameterKeys.KEYS ||
    key === EntityParameterKeys.ROLES ||
    key === EntityParameterKeys.ROUTES ||
    key === EntityParameterKeys.MODELS ||
    key === EntityParameterKeys.DEPENDENCIES
  ) {
    fillEntities(diffs, value as string[]);
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
const compareObjectArray = (
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
const fillObjectArray = (diffMap: Record<string, ActivityAuditDiff[]>, key: string, value: object[]): void => {
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
const compareEntities = (diffs: ActivityAuditDiff[], val1: string[], val2: string[], isCurrent?: boolean) => {
  const len = Math.max(val1?.length || 0, val2?.length || 0);
  for (let i = 0; i < len; i++) {
    const value1 = val1?.[i];
    const value2 = val2?.[i];

    if (value1 != null && value2 == null) {
      diffs.push({ parameter: '', value: '', status: isCurrent ? DiffStatus.MIRROR : DiffStatus.REMOVED });
    } else if (value1 == null && value2 != null) {
      diffs.push({
        parameter: value2 || '',
        value: value2 || '',
        status: isCurrent ? DiffStatus.MIRROR : DiffStatus.ADDED,
      });
    } else if (value1 != null && value2 != null && value1 !== value2) {
      diffs.push({ parameter: value2 || '', value: value2 || '', status: DiffStatus.CHANGED });
    } else {
      diffs.push({ parameter: value1 || '', value: value1 || '' });
    }
  }
};

/**
 * Compare models
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string[]} val1 - first value to compare
 * @param {string[]} val2 - second value to compare
 */
const compareModels = (diffs: ActivityAuditDiff[], val1: string[], val2: string[], isCurrent?: boolean) => {
  const sortedVal1 = [...val1].sort();
  const sortedVal2 = [...val2].sort();

  let i = 0;
  let j = 0;

  while (i < sortedVal1.length || j < sortedVal2.length) {
    const value1 = sortedVal1[i] || '';
    const value2 = sortedVal2[j] || '';

    if (value1 === value2) {
      diffs.push({ parameter: value1, value: value1, status: DiffStatus.MIRROR });
      i++;
      j++;
    } else if (value1 < value2) {
      diffs.push({
        parameter: '',
        value: value1,
        status: isCurrent ? DiffStatus.MIRROR : DiffStatus.REMOVED,
      });
      i++;
    } else {
      diffs.push({
        parameter: value2,
        value: value2,
        status: isCurrent ? DiffStatus.MIRROR : DiffStatus.ADDED,
      });
      j++;
    }
  }

  while (i < sortedVal1.length) {
    diffs.push({
      parameter: '',
      value: sortedVal1[i],
      status: isCurrent ? DiffStatus.MIRROR : DiffStatus.REMOVED,
    });
    i++;
  }

  while (j < sortedVal2.length) {
    diffs.push({
      parameter: '',
      value: sortedVal2[j],
      status: isCurrent ? DiffStatus.MIRROR : DiffStatus.ADDED,
    });
    j++;
  }
};

/**
 * Fill entities diff
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string[]} value - value to fill
 */
const fillEntities = (diffs: ActivityAuditDiff[], value: string[]) => {
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
      diffs.push({ parameter, value: '', status: isCurrent ? DiffStatus.MIRROR : DiffStatus.REMOVED });
    } else if (value1 == null && value2 != null) {
      diffs.push({ parameter, value: value2 || '', status: isCurrent ? DiffStatus.MIRROR : DiffStatus.ADDED });
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
    const value1 = val1?.[key];
    const value2 = val2?.[key];
    if (value1 != null && value2 == null) {
      diffs.push({ parameter: '', value: '', status: isCurrent ? DiffStatus.MIRROR : DiffStatus.REMOVED });
    } else if (value1 == null && value2 != null) {
      diffs.push({
        parameter: key,
        value: convertRoleLimitsIntoString(value2),
        status: isCurrent ? DiffStatus.MIRROR : DiffStatus.ADDED,
      });
    } else if (value1 != null && value2 != null && !isEqualSkippingUndefined(value1, value2)) {
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
 * Compare default role share limits
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {DialRoleLimits} val1 - first value to compare
 * @param {DialRoleLimits} val2 - second value to compare
 */
export const compareDefaultShareLimits = (
  diffs: ActivityAuditDiff[],
  val1: DialRoleLimits,
  val2: DialRoleLimits,
  isCurrent?: boolean,
): void => {
  roleShareLimitsKeys.forEach((key) => {
    const value1 = val1?.[key as keyof typeof val1] || NO_LIMITS_KEY;
    const value2 = val2?.[key as keyof typeof val2] || NO_LIMITS_KEY;
    compareSimpleTypes(diffs, key, value1, value2, isCurrent);
  });
};

/**
 * Fill default role share limits diff
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {DialRoleLimits} value - value to fill
 */
export const fillDefaultShareLimits = (diffs: ActivityAuditDiff[], value: DialRoleLimits): void => {
  roleShareLimitsKeys.forEach((key) => {
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

export const mergeLimits = (limits: ActivityAuditDiff[], shareLimits: ActivityAuditDiff[]) => {
  const mergedMap = new Map();

  const mergeValues = (value1: string, value2: string) => {
    return `${value1}, ${value2}`;
  };

  limits.forEach(({ parameter, value, status }) => {
    mergedMap.set(parameter, { value, status });
  });

  shareLimits.forEach(({ parameter, value, status }) => {
    if (mergedMap.has(parameter)) {
      const current = mergedMap.get(parameter);
      current.value = mergeValues(current.value, value);
      current.status = status || current.status;
    } else {
      mergedMap.set(parameter, { value, status });
    }
  });

  return Array.from(mergedMap, ([parameter, { value, status }]) => ({
    parameter,
    value,
    status,
  }));
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
    EntityParameterKeys.DEPENDENCIES,
  ];
  const sections: ActivityAuditSection = {};
  sectionNames.forEach((name) => {
    if (name == EntityParameterKeys.ROLES) {
      const currentDefault = current[EntityParameterKeys.DEFAULT_ROLE_LIMIT];
      const compareDefault = compare[EntityParameterKeys.DEFAULT_ROLE_LIMIT];
      const currentLimits = current[EntityParameterKeys.ROLE_LIMITS];
      const compareLimits = compare[EntityParameterKeys.ROLE_LIMITS];
      const currentDefaultShare = current[EntityParameterKeys.DEFAULT_ROLE_SHARE_LIMIT];
      const compareDefaultShare = compare[EntityParameterKeys.DEFAULT_ROLE_SHARE_LIMIT];
      const currentLimitsShare = current[EntityParameterKeys.ROLE_SHARE_LIMITS];
      const compareLimitsShare = compare[EntityParameterKeys.ROLE_SHARE_LIMITS];
      if (currentDefault?.length || compareDefault?.length) {
        if (!sections[name]) {
          sections[name] = [];
        }
        sections[name].push({
          current: [...(currentDefault || []), ...(currentDefaultShare || [])],
          compare: [...(compareDefault || []), ...(compareDefaultShare || [])],
        });
      }
      if (currentLimits?.length || compareLimits?.length) {
        if (!sections[name]) {
          sections[name] = [];
        }
        sections[name].push({
          current: mergeLimits(currentLimits || [], currentLimitsShare || []),
          compare: mergeLimits(compareLimits || [], compareLimitsShare || []),
        });
      }
      // case for role where limits stored into 'limits' property instead of entities 'roleLimits' or 'defaultRoleLimit'
      if (!currentDefault && !compareDefault && !currentLimits && !compareLimits) {
        const currentRoleLimits = current[EntityParameterKeys.LIMITS];
        const compareRoleLimits = compare[EntityParameterKeys.LIMITS];
        const currentLimitsShare = current[EntityParameterKeys.SHARE];
        const compareLimitsShare = compare[EntityParameterKeys.SHARE];
        if (currentRoleLimits?.length || compareRoleLimits?.length) {
          if (!sections[name]) {
            sections[name] = [];
          }
          sections[name].push({
            current: mergeLimits(currentRoleLimits || [], currentLimitsShare || []),
            compare: mergeLimits(compareRoleLimits || [], compareLimitsShare || []),
          });
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
  return value1 !== '' && value1 != null && (value2 === '' || value2 == null);
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
        return { status: DiffStatus.MIRROR };
      }

      if (currentEntity && previousEntity) {
        if (isEqualSkippingUndefined(currentEntity, previousEntity)) {
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
