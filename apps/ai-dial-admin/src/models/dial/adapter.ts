import { BaseEntity, ModifiedEntity } from './base-entity';

export interface DialAdapter extends BaseEntity, ModifiedEntity {
  baseEndpoint?: string;
  models?: string[];
}
