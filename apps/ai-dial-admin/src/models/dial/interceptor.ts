import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ChatEntity } from './base-entity';

export interface DialInterceptor extends ChatEntity {
  configurationEndpoint?: string;
  forwardAuthToken?: boolean;
  entities?: string[];
  source?: DialInterceptorSource;
}

export interface DialInterceptorSource {
  $type: SOURCE_TYPE;
  runnerName?: string;
  containerId?: string;
  completionEndpointPath?: string;
  configurationEndpointPath?: string;
}
