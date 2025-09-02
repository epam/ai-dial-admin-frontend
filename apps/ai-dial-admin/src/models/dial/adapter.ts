import { BaseEntity, ModifiedEntity } from '@/src/models/dial/base-entity';

export interface DialAdapter extends BaseEntity, ModifiedEntity {
  models?: string[];
  baseEndpoint?: string;
}
