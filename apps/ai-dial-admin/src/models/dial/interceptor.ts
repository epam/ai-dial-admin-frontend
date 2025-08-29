import { DefaultsValue, DefaultTemp, BaseEntity, DialModifiedEntity } from './base-entity';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';

export interface DialInterceptor extends BaseEntity, DialModifiedEntity {
  endpoint?: string;
  configurationEndpoint?: string;
  forwardAuthToken?: boolean;
  entities?: string[];
  author?: string;
  defaults?: Record<string, DefaultsValue>;
  defaultsTemp?: DefaultTemp[];
  source?: {
    $type: SOURCE_TYPE;
    runnerName?: string;
    containerId?: string;
    completionEndpointPath?: string;
    configurationEndpointPath?: string;
  };
}
