import { TabModel } from '@/src/models/tab';
import { featuresTabs, parametersTabs, propertiesTabs } from '@/src/components/EntityView/View/utils';

export const getTabsForAssetApp = (
  t: (stringToTranslate: string) => string,
  isParametersTabAvailable: boolean,
): TabModel[] => {
  const tabs: TabModel[] = [propertiesTabs(t), featuresTabs(t)];

  if (isParametersTabAvailable) {
    tabs.splice(2, 0, parametersTabs(t));
  }

  return tabs;
};
