import { TabsI18nKey } from '@/src/constants/i18n';
import { TabModel } from '@/src/models/tab';
import { EntityViewTab } from '../entity-view';

export const getAuditTabs = (
  t: (stringToTranslate: string) => string,
  featureFlags: Record<string, boolean>,
): TabModel[] => {
  const tabs: TabModel[] = [];

  if (featureFlags.dashboardEnabled) {
    tabs.push({ id: EntityViewTab.Dashboard, name: t(TabsI18nKey.Dashboard) });
  }

  return tabs;
};
