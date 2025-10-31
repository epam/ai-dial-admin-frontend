import { TabModel } from '@epam/ai-dial-ui-kit';

import {
  dependenciesTabs,
  featuresTabs,
  interceptorsTabs,
  parametersTabs,
  propertiesTabs,
} from '@/src/components/EntityView/View/utils';

export const getTabsForAssetApp = (t: (stringToTranslate: string) => string): TabModel[] => {
  return [propertiesTabs(t), featuresTabs(t), parametersTabs(t), interceptorsTabs(t), dependenciesTabs(t)];
};
