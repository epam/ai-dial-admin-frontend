import { BaseEntity, ModifiedEntity } from '@/src/models/dial/base-entity';

export interface InterceptorTemplate extends BaseEntity, ModifiedEntity {
  completionEndpoint?: string;
  configurationEndpoint?: string;
  interceptors?: string[];
}
