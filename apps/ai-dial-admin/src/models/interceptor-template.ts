import { DialModifiedEntity } from '@/src/models/dial/base-entity';

export interface InterceptorTemplate extends DialModifiedEntity {
  name: string;
  displayName?: string;
  description?: string;
  completionEndpoint?: string;
  configurationEndpoint?: string;
  interceptors?: string[];
}
