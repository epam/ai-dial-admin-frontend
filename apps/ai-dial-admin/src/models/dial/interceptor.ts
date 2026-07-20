import { SOURCE_FIELD } from '@/src/components/SourceField/types';
import { BaseEntity, EntityDefaults } from '@/src/models/dial/base-entity';
import { InterceptorStatus } from '@/src/types/interceptor-status';
import { DialFeatures } from './features';
import { DialDeploymentInterface } from './interfaces';

export interface DialInterceptor extends BaseEntity, EntityDefaults {
  configurationEndpoint?: string;
  entities?: string[];
  source?: SOURCE_FIELD;
  endpoint?: string | null;
  forwardAuthToken?: boolean;
  author?: string;
  features?: DialFeatures;
  applicationTypeSchemas?: string[];
  status?: InterceptorStatus;
  interfaces?: Record<string, DialDeploymentInterface>;
}
