import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { BaseEntity, EntityDefaults } from '@/src/models/dial/base-entity';

export interface DialInterceptor extends BaseEntity, EntityDefaults {
  configurationEndpoint?: string;
  entities?: string[];
  source?: InterceptorSource;
  endpoint?: string | null;
  forwardAuthToken?: boolean;
  author?: string;
}

export interface InterceptorSource {
  $type: SOURCE_TYPE;
  runnerName?: string;
  containerId?: string;
  completionEndpointPath?: string;
  configurationEndpointPath?: string;
}
