import { BaseEntity } from '@/src/models/dial/base-entity';

export interface InterceptorTemplate extends BaseEntity {
  completionEndpoint?: string;
  configurationEndpoint?: string;
  interceptors?: string[];
}
