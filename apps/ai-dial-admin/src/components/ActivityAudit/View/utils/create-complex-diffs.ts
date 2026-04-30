import { dateKeys, EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { roleLimitsKeys } from '@/src/components/ActivityAudit/View/DiffReport/utils';
import { NO_LIMITS_KEY } from '@/src/constants/role';
import { ActivityAuditDiff } from '@/src/models/activity-audit';
import { DialModelEndpoint } from '@/src/models/dial/model';
import { DialRoleLimits } from '@/src/models/dial/role-limits';
import { DiffStatus } from '@/src/types/activity-audit';
import {
  createEmptyObjectWithKeys,
  generateStringFromObject,
  isPathKey,
  isSimpleValueAddedOrRemoved,
  isSimpleValueChanged,
} from './compare-helpers';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

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
    diffs.push({ parameter: key, value: '', diffStatus: isCurrent ? DiffStatus.MIRROR : DiffStatus.REMOVED });
  } else if (isSimpleValueAddedOrRemoved(val2, val1)) {
    diffs.push({
      parameter: key,
      value: isTime ? formatDateTimeToLocalString(val2 as number) : val2?.toString() || '',
      diffStatus: isCurrent ? DiffStatus.MIRROR : DiffStatus.ADDED,
    });
  } else if (isSimpleValueChanged(val1, val2)) {
    diffs.push({
      parameter: key,
      value: isTime ? formatDateTimeToLocalString(val2 as number) : val2?.toString() || '',
      diffStatus: DiffStatus.CHANGED,
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
export const fillStringArray = (
  diffs: ActivityAuditDiff[],
  key: string,
  value: object,
  t?: (str: string) => string,
) => {
  const val = generateStringFromObject(value, key === EntityParameterKeys.PRICING ? t : void 0);
  fillSimpleTypes(diffs, key, val);
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
 * @param {?boolean} [isCurrent] - flag if current state is compared
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
 * Compare defaults
 *
 * @param {Record<string, ActivityAuditDiff[]>} diffMap - result map
 * @param {string} key - resource key
 * @param {Record<string, unknown>} val1 - first value to compare
 * @param {Record<string, unknown>} val2 - second value to compare
 * @param {?boolean} [isCurrent] - flag if current state is compared
 */
export const compareDefaults = (
  diffMap: Record<string, ActivityAuditDiff[]>,
  key: string,
  val1: Record<string, unknown> = {},
  val2: Record<string, unknown> = {},
  isCurrent?: boolean,
): void => {
  const allKeys = [...new Set([...Object.keys(val1), ...Object.keys(val2)])].sort();
  allKeys.forEach((defaultKey, index) => {
    const sectionKey = `${key}${index}`;
    if (!diffMap[sectionKey]) diffMap[sectionKey] = [];
    const v1 = val1[defaultKey];
    const v2 = val2[defaultKey];
    const v1Type = typeof v1;
    const v2Type = typeof v2;
    const correctV1 = v1Type === 'object' ? JSON.stringify(v1) : v1;
    const correctV2 = v2Type === 'object' ? JSON.stringify(v2) : v2;
    if (v1 != null && v2 == null) {
      const valueObject = { key: defaultKey, value: correctV1, type: v1Type };
      compareSimpleObjects(diffMap[sectionKey], valueObject, createEmptyObjectWithKeys(valueObject), isCurrent);
    } else if (v1 == null && v2 != null) {
      const valueObject = { key: defaultKey, value: correctV2, type: v2Type };
      compareSimpleObjects(diffMap[sectionKey], createEmptyObjectWithKeys(valueObject), valueObject, isCurrent);
    } else if (v1 != null && v2 != null) {
      const v1Object = { key: defaultKey, value: correctV1, type: v1Type };
      const v2Object = { key: defaultKey, value: correctV2, type: v2Type };
      compareSimpleObjects(diffMap[sectionKey], v1Object, v2Object, isCurrent);
    }
  });
};

/**
 * Fill defaults diff
 *
 * @param {Record<string, ActivityAuditDiff[]>} diffMap - result map
 * @param {string} key - resource key
 * @param {Record<string, unknown>} value - value to fill
 */
export const fillDefaults = (
  diffMap: Record<string, ActivityAuditDiff[]>,
  key: string,
  value: Record<string, unknown>,
) => {
  Object.keys(value).forEach((val, index) => {
    const sectionKey = `${key}${index}`;
    if (!diffMap[sectionKey]) diffMap[sectionKey] = [];
    const rawValue = value[val];
    const valueType = typeof rawValue;
    const correctValue = valueType === 'object' ? JSON.stringify(rawValue) : rawValue;
    fillSimpleObjects(diffMap[sectionKey], { key: val, value: correctValue, type: valueType });
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
