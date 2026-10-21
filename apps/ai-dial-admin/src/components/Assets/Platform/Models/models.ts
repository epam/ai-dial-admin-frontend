import { FeaturesI18nKey } from '@/src/constants/i18n';
import { DialModelResourceFeatures } from '@/src/models/dial/resource';

export interface ModelResourceSwitchFeatureGroup {
  title: FeaturesI18nKey;
  keys: (keyof DialModelResourceFeatures)[];
}
