import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ChatEntity, ModifiedEntity } from './base-entity';

export interface DialInterceptor extends ChatEntity, ModifiedEntity {
  endpoint?: string;
  configurationEndpoint?: string;
  forwardAuthToken?: boolean;
  entities?: string[];
  author?: string;
  source?: {
    $type: SOURCE_TYPE;
    runnerName?: string;
    containerId?: string;
    completionEndpointPath?: string;
    configurationEndpointPath?: string;
  };
}
