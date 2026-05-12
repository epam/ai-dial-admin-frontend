import { DOMAIN_ACCESS_POLICY_KEY, shareEntities, shareKeys } from '@/src/components/ActivityAudit/constants';
import { ALLOW_ALL_DOMAINS } from '@/src/components/Deployments/Common/Whitelists/Whitelists';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ActivityAuditDiff } from '@/src/models/activity-audit';
import { DialRoleLimits, DialRoleShare } from '@/src/models/dial/role-limits';
import { DiffStatus } from '@/src/types/activity-audit';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { convertRoleLimitsIntoString, convertShareValue, fillShareValues } from './compare-helpers';

const ALLOWED_DOMAIN_PARAMETER = 'allowedDomain';

const hasAllDomains = (domains: string[] | undefined): boolean =>
  Array.isArray(domains) && domains.includes(ALLOW_ALL_DOMAINS);

const policyKey = (domains: string[] | undefined): string =>
  hasAllDomains(domains) ? EntityFieldsI18nKey.allDomains : EntityFieldsI18nKey.specificDomains;

const visibleDomains = (domains: string[] | undefined): string[] =>
  hasAllDomains(domains) ? [] : Array.isArray(domains) ? domains : [];

interface ArrayDiffRowFactory {
  match: (value: string) => ActivityAuditDiff;
  placeholder: () => ActivityAuditDiff;
  added: (value: string) => ActivityAuditDiff;
  removed: (value: string) => ActivityAuditDiff;
}

const walkSortedArrayDiff = (
  diffs: ActivityAuditDiff[],
  val1: string[] | undefined,
  val2: string[] | undefined,
  isCurrent: boolean | undefined,
  factory: ArrayDiffRowFactory,
): void => {
  const sortedVal1 = (val1 || []).slice().sort();
  const sortedVal2 = (val2 || []).slice().sort();
  let i = 0;
  let j = 0;
  while (i < sortedVal1.length || j < sortedVal2.length) {
    const value1 = sortedVal1[i];
    const value2 = sortedVal2[j];
    if (value1 === value2) {
      diffs.push(factory.match(value1 || ''));
      i++;
      j++;
    } else if (value1 != null && (value2 == null || value1 < value2)) {
      diffs.push(factory.placeholder());
      i++;
    } else if (value2 != null && (value1 == null || value1 > value2)) {
      diffs.push(isCurrent ? factory.removed(value2 || '') : factory.added(value2 || ''));
      j++;
    }
  }
};

export const compareEntities = (diffs: ActivityAuditDiff[], val1: string[], val2: string[], isCurrent?: boolean) => {
  const sortedVal1 = (val1 || []).slice().sort();
  const sortedVal2 = (val2 || []).slice().sort();

  let i = 0;
  let j = 0;

  while (i < sortedVal1.length || j < sortedVal2.length) {
    const value1 = sortedVal1[i];
    const value2 = sortedVal2[j];

    if (value1 === value2) {
      diffs.push({ parameter: value1 || '', value: value1 || '' });
      i++;
      j++;
    } else if (value1 != null && (value2 == null || value1 < value2)) {
      diffs.push({ parameter: '', value: '', diffStatus: DiffStatus.MIRROR });
      i++;
    } else if (value2 != null && (value1 == null || value1 > value2)) {
      diffs.push({
        parameter: value2 || '',
        value: value2 || '',
        diffStatus: isCurrent ? DiffStatus.REMOVED : DiffStatus.ADDED,
      });
      j++;
    } else {
      diffs.push({ parameter: value2 || '', value: value2 || '', diffStatus: DiffStatus.CHANGED });
      i++;
      j++;
    }
  }

  while (i < sortedVal1.length) {
    diffs.push({ parameter: '', value: '', diffStatus: DiffStatus.MIRROR });
    i++;
  }

  while (j < sortedVal2.length) {
    diffs.push({
      parameter: sortedVal2[j] || '',
      value: sortedVal2[j] || '',
      diffStatus: isCurrent ? DiffStatus.REMOVED : DiffStatus.ADDED,
    });
    j++;
  }
};

export const fillEntities = (diffs: ActivityAuditDiff[], value: string[]) => {
  const result = (value || []).map((val) => ({
    parameter: val || '',
    value: val || '',
  }));
  diffs.push(...result);
};

const ALLOWED_DOMAIN_FACTORY: ArrayDiffRowFactory = {
  match: (value) => ({ parameter: ALLOWED_DOMAIN_PARAMETER, value }),
  placeholder: () => ({ parameter: '', value: '', diffStatus: DiffStatus.MIRROR }),
  added: (value) => ({ parameter: ALLOWED_DOMAIN_PARAMETER, value, diffStatus: DiffStatus.ADDED }),
  removed: (value) => ({ parameter: ALLOWED_DOMAIN_PARAMETER, value, diffStatus: DiffStatus.REMOVED }),
};

const DOMAIN_FACTORY: ArrayDiffRowFactory = {
  match: (value) => ({ parameter: '', value }),
  placeholder: () => ({ parameter: '', value: '', diffStatus: DiffStatus.MIRROR }),
  added: (value) => ({ parameter: '', value, diffStatus: DiffStatus.ADDED }),
  removed: (value) => ({ parameter: '', value, diffStatus: DiffStatus.REMOVED }),
};

export const compareAllowedDomains = (
  diffs: ActivityAuditDiff[],
  val1: string[],
  val2: string[],
  isCurrent?: boolean,
) => {
  const key1 = policyKey(val1);
  const key2 = policyKey(val2);
  if (key1 === key2) {
    diffs.push({ parameter: DOMAIN_ACCESS_POLICY_KEY, value: key1 });
  } else {
    diffs.push({ parameter: DOMAIN_ACCESS_POLICY_KEY, value: key2, diffStatus: DiffStatus.CHANGED });
  }
  walkSortedArrayDiff(diffs, visibleDomains(val1), visibleDomains(val2), isCurrent, ALLOWED_DOMAIN_FACTORY);
};

export const fillAllowedDomains = (diffs: ActivityAuditDiff[], value: string[]) => {
  diffs.push({ parameter: DOMAIN_ACCESS_POLICY_KEY, value: policyKey(value) });
  visibleDomains(value).forEach((domain) => {
    diffs.push({ parameter: ALLOWED_DOMAIN_PARAMETER, value: domain || '' });
  });
};

export const compareDomains = (diffs: ActivityAuditDiff[], val1: string[], val2: string[], isCurrent?: boolean) => {
  walkSortedArrayDiff(diffs, val1, val2, isCurrent, DOMAIN_FACTORY);
};

export const fillDomains = (diffs: ActivityAuditDiff[], value: string[]) => {
  (value || []).forEach((domain) => {
    diffs.push({ parameter: '', value: domain || '' });
  });
};

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
    const parameter = (i + 1).toString();

    if (value1 != null && value2 == null) {
      diffs.push({ parameter, value: '', diffStatus: isCurrent ? DiffStatus.MIRROR : DiffStatus.REMOVED });
    } else if (value1 == null && value2 != null) {
      diffs.push({ parameter, value: value2 || '', diffStatus: isCurrent ? DiffStatus.MIRROR : DiffStatus.ADDED });
    } else if (value1 != null && value2 != null && value1 !== value2) {
      diffs.push({ parameter, value: value2 || '', diffStatus: DiffStatus.CHANGED });
    } else {
      diffs.push({ parameter, value: value1 || '' });
    }
  }
};

export const fillInterceptors = (diffs: ActivityAuditDiff[], value: string[]) => {
  const result = (value || []).map((val, i) => ({
    parameter: (i + 1).toString(),
    value: val || '',
  }));
  diffs.push(...result);
};

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
      diffs.push({ parameter: '', value: '', diffStatus: isCurrent ? DiffStatus.MIRROR : DiffStatus.REMOVED });
    } else if (value1 == null && value2 != null) {
      diffs.push({
        parameter: key,
        value: convertRoleLimitsIntoString(value2),
        diffStatus: isCurrent ? DiffStatus.MIRROR : DiffStatus.ADDED,
      });
    } else if (value1 != null && value2 != null && !isEqualSkippingUndefined(value1, value2)) {
      diffs.push({ parameter: key, value: convertRoleLimitsIntoString(value2), diffStatus: DiffStatus.CHANGED });
    } else {
      diffs.push({ parameter: key, value: convertRoleLimitsIntoString(value1) });
    }
  });
};

export const fillRoleLimits = (diffs: ActivityAuditDiff[], value: Record<string, DialRoleLimits>) => {
  const allKeys = Object.keys(value || {}).sort();
  allKeys.forEach((key) => {
    const val = value[key];
    diffs.push({ parameter: key, value: convertRoleLimitsIntoString(val) });
  });
};

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
          diffStatus: isCurrent ? DiffStatus.MIRROR : DiffStatus.REMOVED,
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

export const fillShare = (diffs: ActivityAuditDiff[], value?: Record<string, DialRoleShare>) => {
  shareEntities.forEach((key) => {
    const val = value?.[key];
    shareKeys.forEach((k) => {
      fillShareValues(diffs, key, k, val);
    });
  });
};
