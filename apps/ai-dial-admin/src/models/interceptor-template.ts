import { ModifiedEntity } from '@/src/models/dial/base-entity';

export interface InterceptorTemplate extends ModifiedEntity {
  name: string;
  displayName?: string;
  description?: string;
  completionEndpoint?: string;
  configurationEndpoint?: string;
  interceptors?: string[];
}
