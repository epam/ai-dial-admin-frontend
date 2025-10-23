import { shareEntities, shareKeys } from '@/src/components/ActivityAudit/constants';
import { ActivityAuditDiff } from '@/src/models/activity-audit';
import { DialRoleLimits, DialRoleShare } from '@/src/models/dial/role-limits';
import { DiffStatus } from '@/src/types/activity-audit';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { convertRoleLimitsIntoString, convertShareValue, fillShareValues } from './compare-helpers';

/**
 * Compare models
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string[]} val1 - first value to compare
 * @param {string[]} val2 - second value to compare
 */
export const compareModels = (diffs: ActivityAuditDiff[], val1: string[], val2: string[], isCurrent?: boolean) => {
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
 * Fill entities diff
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {string[]} value - value to fill
 */
export const fillEntities = (diffs: ActivityAuditDiff[], value: string[]) => {
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
 * Compare sharing
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {Record<string, DialRoleShare>} val1 - first value to compare
 * @param {Record<string, DialRoleShare>} val2 - second value to compare
 * @param {?boolean} [isCurrent] - flag if current state is compared
 */
export const compareShare = (
  diffs: ActivityAuditDiff[],
  val1: Record<string, DialRoleShare>,
  val2: Record<string, DialRoleShare>,
  isCurrent?: boolean,
): void => {
  shareEntities.forEach((key) => {
    const value1 = val1?.[key];
    const value2 = val2?.[key];
    if (value1 != null && value2 == null) {
      shareKeys.forEach((k) => {
        diffs.push({
          parameter: `${key}.${k}`,
          value: convertShareValue('', k, key),
          status: isCurrent ? DiffStatus.MIRROR : DiffStatus.REMOVED,
        });
      });
    } else if (value1 == null && value2 != null) {
      shareKeys.forEach((k) => {
        fillShareValues(diffs, key, k, void 0, value2, isCurrent);
      });
    } else if (value1 != null && value2 != null && !isEqualSkippingUndefined(value1, value2)) {
      shareKeys.forEach((k) => {
        fillShareValues(diffs, key, k, value1, value2);
      });
    } else {
      shareKeys.forEach((k) => {
        fillShareValues(diffs, key, k, value1);
      });
    }
  });
};

/**
 * Fill sharing diff
 *
 * @param {ActivityAuditDiff[]} diffs - result array
 * @param {Record<string, DialRoleShare>} value - value to compare
 */
export const fillShare = (diffs: ActivityAuditDiff[], value?: Record<string, DialRoleShare>) => {
  shareEntities.forEach((key) => {
    const val = value?.[key];
    shareKeys.forEach((k) => {
      fillShareValues(diffs, key, k, val);
    });
  });
};
