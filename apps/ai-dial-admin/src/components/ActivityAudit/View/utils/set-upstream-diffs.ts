import { ActivityAuditDiff, ActivityAuditSection } from '@/src/models/activity-audit';
import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';

export const setUpstreamDiffs = (
  sections: ActivityAuditSection,
  current: Record<string, ActivityAuditDiff[]>,
  compare: Record<string, ActivityAuditDiff[]>,
) => {
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
};
