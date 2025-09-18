import { activitiesTabs, conversationsTabs, dashboardTabs, tracesTabs } from '@/src/components/EntityView/View/utils';
import { TabModel } from '@/src/models/tab';
import { ApplicationRoute } from '@/src/types/routes';

export const getAuditTabs = (
  t: (stringToTranslate: string) => string,
  featureFlags: Record<string, boolean>,
  view: ApplicationRoute,
): TabModel[] => {
  const tabs: TabModel[] = [];

  if (featureFlags.dashboardEnabled && (view === ApplicationRoute.Models || view === ApplicationRoute.Applications)) {
    tabs.push(dashboardTabs(t), tracesTabs(t), conversationsTabs(t));
  }

  tabs.push(activitiesTabs(t));

  return tabs;
};
