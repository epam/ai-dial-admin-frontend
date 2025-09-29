import { ActivityAuditDiff, ActivityAuditSection } from '@/src/models/activity-audit';

export const setObjectsArrayDiff = (
  sections: ActivityAuditSection,
  sectionName: string,
  current: Record<string, ActivityAuditDiff[]>,
  compare: Record<string, ActivityAuditDiff[]>,
) => {
  const [largerObj] = [current, compare].sort((a, b) => Object.keys(b).length - Object.keys(a).length);
  Object.keys(largerObj)
    .filter((key) => key.includes(sectionName))
    .forEach((upstreamKey) => {
      const currentUpstream = current[upstreamKey];
      const compareUpstream = compare[upstreamKey];
      if (currentUpstream?.length || compareUpstream?.length) {
        if (!sections[sectionName]) {
          sections[sectionName] = [];
        }
        sections[sectionName].push({ current: currentUpstream, compare: compareUpstream });
      }
    });
};
