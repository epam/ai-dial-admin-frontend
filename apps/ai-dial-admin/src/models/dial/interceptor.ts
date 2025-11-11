import { SOURCE_FIELD } from '@/src/components/SourceField/types';
import { BaseEntity, EntityDefaults } from '@/src/models/dial/base-entity';
import { DialFeatures } from './features';

export interface DialInterceptor extends BaseEntity, EntityDefaults {
  configurationEndpoint?: string;
  entities?: string[];
  source?: SOURCE_FIELD;
  endpoint?: string | null;
  forwardAuthToken?: boolean;
  author?: string;
  features?: DialFeatures;
  applicationRunners?: string[];
}
