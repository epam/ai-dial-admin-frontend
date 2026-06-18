import { FeaturesI18nKey } from '@/src/constants/i18n';
import { DialFeatures } from '@/src/models/dial/features';

export interface SwitchFeatureGroup {
  title: FeaturesI18nKey;
  keys: (keyof DialFeatures)[];
}
