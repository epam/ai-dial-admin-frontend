import { activitiesTabs, dashboardTabs } from '@/src/components/EntityView/entity-view';
import { TabModel } from '@/src/models/tab';

export const getAuditTabs = (
  t: (stringToTranslate: string) => string,
  featureFlags: Record<string, boolean>,
): TabModel[] => {
  const tabs: TabModel[] = [];

  if (featureFlags.dashboardEnabled) {
    tabs.push(dashboardTabs(t));
  }

  tabs.push(activitiesTabs(t));

  return tabs;
};
