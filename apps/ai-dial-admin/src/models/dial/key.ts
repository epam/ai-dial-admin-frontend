import { BaseEntity, ModifiedEntity } from '@/src/models/dial/base-entity';

export interface DialKey extends BaseEntity, ModifiedEntity {
  key?: string;
  project?: string;
  projectContactPoint?: string;
  secured?: boolean;
  roles?: string[];
  owner?: string;
  expiresAt?: string;
  keyGeneratedAt?: string;
}
