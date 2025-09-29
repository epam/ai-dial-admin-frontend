import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { ActivityAuditDiff, ActivityAuditSection } from '@/src/models/activity-audit';

export const setAuthDiffs = (
  sections: ActivityAuditSection,
  current: Record<string, ActivityAuditDiff[]>,
  compare: Record<string, ActivityAuditDiff[]>,
) => {
  const currentAuth = current[EntityParameterKeys.AUTH];
  const compareAuth = compare[EntityParameterKeys.AUTH];

  sections[EntityParameterKeys.AUTH] = [
    {
      current: [...currentAuth],
      compare: [...compareAuth],
    },
  ];
};
