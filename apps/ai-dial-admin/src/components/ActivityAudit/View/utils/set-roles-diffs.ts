import { ActivityAuditDiff, ActivityAuditSection } from '@/src/models/activity-audit';
import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';

export const setRolesDiffs = (
  sections: ActivityAuditSection,
  current: Record<string, ActivityAuditDiff[]>,
  compare: Record<string, ActivityAuditDiff[]>,
) => {
  const currentDefault = current[EntityParameterKeys.DEFAULT_ROLE_LIMIT];
  const compareDefault = compare[EntityParameterKeys.DEFAULT_ROLE_LIMIT];

  const currentLimits = current[EntityParameterKeys.ROLE_LIMITS];
  const compareLimits = compare[EntityParameterKeys.ROLE_LIMITS];

  if (currentDefault?.length || compareDefault?.length) {
    if (!sections[EntityParameterKeys.ROLES]) {
      sections[EntityParameterKeys.ROLES] = [];
    }
    sections[EntityParameterKeys.ROLES].push({
      current: [...(currentDefault || [])],
      compare: [...(compareDefault || [])],
    });
  }

  if (currentLimits?.length || compareLimits?.length) {
    if (!sections[EntityParameterKeys.ROLES]) {
      sections[EntityParameterKeys.ROLES] = [];
    }
    sections[EntityParameterKeys.ROLES].push({
      current: currentLimits || [],
      compare: compareLimits || [],
    });
  }

  // case for role where limits stored into 'limits' property instead of entities 'roleLimits' or 'defaultRoleLimit'
  if (!currentDefault && !compareDefault && !currentLimits && !compareLimits) {
    const currentRoleLimits = current[EntityParameterKeys.LIMITS];
    const compareRoleLimits = compare[EntityParameterKeys.LIMITS];

    if (currentRoleLimits?.length || compareRoleLimits?.length) {
      if (!sections[EntityParameterKeys.ROLES]) {
        sections[EntityParameterKeys.ROLES] = [];
      }
      sections[EntityParameterKeys.ROLES].push({
        current: currentRoleLimits || [],
        compare: compareRoleLimits || [],
      });
    }

    // case for key where only role EntityParameterKeys.ROLESs stored into 'roles' property
    const currentRoles = current[EntityParameterKeys.ROLES];
    const compareRoles = compare[EntityParameterKeys.ROLES];
    if (currentRoles?.length || compareRoles?.length) {
      if (!sections[EntityParameterKeys.ROLES]) {
        sections[EntityParameterKeys.ROLES] = [];
      }
      sections[EntityParameterKeys.ROLES].push({ current: currentRoles, compare: compareRoles });
    }
  }
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
