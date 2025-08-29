import { DialBaseNamedEntity } from './base-entity';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DefaultsValue, DefaultTemp } from '@/src/models/dial/default';

export interface DialInterceptor extends DialBaseNamedEntity {
  endpoint?: string;
  configurationEndpoint?: string;
  forwardAuthToken?: boolean;
  entities?: string[];
  author?: string;
  createdAt?: number;
  updatedAt?: number;
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
