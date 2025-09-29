import { TabModel } from '@/src/models/tab';
import {
  dependenciesTabs,
  featuresTabs,
  interceptorsTabs,
  parametersTabs,
  propertiesTabs,
} from '@/src/components/EntityView/View/utils';

export const getTabsForAssetApp = (
  t: (stringToTranslate: string) => string,
  isParametersTabAvailable: boolean,
): TabModel[] => {
  const tabs: TabModel[] = [propertiesTabs(t), featuresTabs(t), interceptorsTabs(t), dependenciesTabs(t)];

  if (isParametersTabAvailable) {
    tabs.splice(2, 0, parametersTabs(t));
  }

  return tabs;
};
