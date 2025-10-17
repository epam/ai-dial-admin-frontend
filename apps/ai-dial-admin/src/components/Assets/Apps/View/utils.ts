import { TabModel } from '@epam/ai-dial-ui-kit';

import { featuresTabs, parametersTabs, propertiesTabs } from '@/src/components/EntityView/View/utils';

export const getTabsForAssetApp = (t: (stringToTranslate: string) => string): TabModel[] => {
  return [propertiesTabs(t), featuresTabs(t), parametersTabs(t)];
};
