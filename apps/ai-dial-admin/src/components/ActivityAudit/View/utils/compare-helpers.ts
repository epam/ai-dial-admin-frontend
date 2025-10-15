import { appRunnerParameterKeys, EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { getHoursFromMs } from '@/src/components/Roles/utils';
import { ModelViewI18nKey } from '@/src/constants/i18n';
import { NO_LIMITS_ACCEPTED_USERS, NO_LIMITS_KEY, NO_LIMITS_VALUE } from '@/src/constants/role';
import { ActivityAuditDiff } from '@/src/models/activity-audit';
import { DialModelPricing, PricingType } from '@/src/models/dial/model';
import { DialRoleLimits, DialRoleShare } from '@/src/models/dial/role-limits';
import { ActivityAuditResourceType, DiffStatus } from '@/src/types/activity-audit';

/**
 * Helper to create string from object key values
 *
 * @param {object} value - initial object
 * @returns {string} - result string
 */
export const generateStringFromObject = (value?: object, t?: (str: string) => string): string => {
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
export const convertPricing = (value: DialModelPricing | undefined, t: (str: string) => string): string => {
  const isToken = value?.unit === PricingType.Token;
  return Object.entries(value || {})
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
 * Convert all limits into one string
 *
 * @param {?DialRoleLimits} [limits] - role limits
 * @returns {string} - result string
 */
export const convertRoleLimitsIntoString = (limits?: DialRoleLimits): string => {
  return limits
    ? Object.entries(limits)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    : '';
};

/**
 * Fill share values with converted value if needed and correct status
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string} key - property key
 * @param {?DialRoleShare} [v1] - first value to compare
 * @param {?DialRoleShare} [v2] - second value to compare
 * @param {?boolean} [isCurrent] - flag if current state is compared
 */
export const fillShareValues = (
  diffs: ActivityAuditDiff[],
  key: string,
  field: string,
  v1?: DialRoleShare,
  v2?: DialRoleShare,
  isCurrent?: boolean,
) => {
  const val1 = v1?.[field as keyof typeof v1];
  const val2 = v2?.[field as keyof typeof v2];
  const value = convertShareValue(v1 && !v2 ? val1 : val2, field);
  const status = getShareStatus(val1, val2, isCurrent);
  diffs.push({
    parameter: `${key}.${field}`,
    value,
    status,
  });
};

/**
 * Generate status for share values
 *
 * @param {?(string | null)} [v1] - first value
 * @param {?(string | null)} [v2] - second value
 * @param {?boolean} [isCurrent] - flag if current state is compared
 * @returns {(DiffStatus | undefined)} - correct status or undefined of no status
 */
export const getShareStatus = (v1?: string | null, v2?: string | null, isCurrent?: boolean): DiffStatus | undefined => {
  if (v1 && v2) {
    return v2 !== v1 ? DiffStatus.CHANGED : void 0;
  }
  if (!v1 && v2) {
    return isCurrent ? DiffStatus.MIRROR : DiffStatus.ADDED;
  }
  return void 0;
};

/**
 * Convert share value into correct string
 *
 * @param {?(string | null)} [value] - value
 * @param {?string} [key] - field key
 * @returns {string} - converted value based on no limits constant
 */
export const convertShareValue = (value?: string | null, key?: string): string => {
  return !value || value === NO_LIMITS_VALUE || value === NO_LIMITS_ACCEPTED_USERS
    ? NO_LIMITS_KEY
    : key === 'invitationTtl'
      ? getHoursFromMs(value).toString()
      : value;
};

/**
 * Generate object with same keys and empty values
 *
 * @template {object} T
 * @param {T} obj - object to copy
 * @returns {T} - object with empty values
 */
export const createEmptyObjectWithKeys = <T extends object>(obj: T): T => {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key as keyof T] = '' as T[keyof T];
    return acc;
  }, {} as T);
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
  const priorityKeys = [
    'displayName',
    'dial:applicationTypeDisplayName',
    'name',
    '$id',
    'version',
    'displayVersion',
    'description',
    'source',
    'endpoint',
  ];

  const aIndex = priorityKeys.indexOf(a);
  const bIndex = priorityKeys.indexOf(b);

  if (aIndex === -1 && bIndex === -1) {
    return a.localeCompare(b);
  }
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
};
