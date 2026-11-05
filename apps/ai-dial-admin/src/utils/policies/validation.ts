import { PoliciesI18nKey, PolicyAssignmentsI18nKey } from '@/src/constants/i18n';
import { DialPolicyResource } from '@/src/models/dial/resource';
import { PolicyAmounts } from '@/src/models/dial/policy';

/** Core's own form of the `object` "all deployments" value. */
export const POLICY_OBJECT_ALL = '*';

// Date, `T`, time with optional seconds/fraction, then `Z` or a numeric offset — Core rejects a bare local time.
const OFFSET_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

export const isIntegerValue = (value: unknown): boolean => typeof value === 'number' && Number.isInteger(value);

export const isPositiveAmount = (value: unknown): boolean => typeof value === 'number' && value > 0;

export const isOffsetDateTime = (value?: string): boolean =>
  !!value && OFFSET_DATE_TIME.test(value) && !Number.isNaN(Date.parse(value));

export const hasCostWindow = (cost?: PolicyAmounts): boolean => cost?.day != null || cost?.month != null;

/** The first problem with one cost amount, or `undefined` for an unset window or a valid amount. */
export const getAmountError = (value?: number): PoliciesI18nKey | undefined =>
  value == null || isPositiveAmount(value) ? undefined : PoliciesI18nKey.AmountInvalid;

export interface PolicyFormErrors {
  priority?: PoliciesI18nKey;
  object?: PoliciesI18nKey;
  costDay?: PoliciesI18nKey;
  costMonth?: PoliciesI18nKey;
  costWindow?: PoliciesI18nKey;
}

/**
 * Shape checks only — what the form can know without other records. Whether a priority ties with another
 * budget, or the cost object matches the folder, stays with Core.
 */
export const getPolicyFormErrors = (policy: DialPolicyResource): PolicyFormErrors => {
  const errors: PolicyFormErrors = {};

  if (!isIntegerValue(policy.priority)) {
    errors.priority = PoliciesI18nKey.PriorityInvalid;
  }
  if (Array.isArray(policy.object) && policy.object.length === 0) {
    errors.object = PoliciesI18nKey.ObjectListRequired;
  }
  if (policy.object == null) {
    errors.object = PoliciesI18nKey.ObjectListRequired;
  }

  errors.costDay = getAmountError(policy.cost?.day);
  errors.costMonth = getAmountError(policy.cost?.month);
  if (!hasCostWindow(policy.cost)) {
    errors.costWindow = PoliciesI18nKey.CostWindowRequired;
  }

  return Object.fromEntries(Object.entries(errors).filter(([, value]) => value != null));
};

export const getExpiresAtError = (value?: string): PolicyAssignmentsI18nKey | undefined =>
  !value || isOffsetDateTime(value) ? undefined : PolicyAssignmentsI18nKey.ExpiresAtInvalid;
