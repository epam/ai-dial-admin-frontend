import { BaseEntity } from '@/src/models/dial/base-entity';

export interface DialKey extends BaseEntity {
  key?: string;
  project?: string;
  projectContactPoint?: string;
  secured?: boolean;
  roles?: string[];
  owner?: string;
  expiresAt?: string;
  keyGeneratedAt?: string;
}
