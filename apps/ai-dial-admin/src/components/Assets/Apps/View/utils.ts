import { TabModel } from '@/src/models/tab';
import { featuresTabs, parametersTabs, propertiesTabs } from '@/src/components/EntityView/View/utils';

export const getTabsForAssetApp = (t: (stringToTranslate: string) => string): TabModel[] => {
  const tabs: TabModel[] = [propertiesTabs(t), featuresTabs(t), parametersTabs(t)];

  return tabs;
};
