import { BaseEntity } from './base-entity';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DefaultsValue, DefaultTemp } from '@/src/models/dial/default';

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
