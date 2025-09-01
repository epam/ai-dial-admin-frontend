import { BaseEntity } from '@/src/models/dial/base-entity';

export interface DialAdapter extends BaseEntity {
  models?: string[];
  baseEndpoint?: string;
}
