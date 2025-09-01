import { BaseEntity, ModifiedEntity } from './base-entity';

export interface DialKey extends BaseEntity, ModifiedEntity {
  key: string;
  project: string;
  projectContactPoint?: string;
  secured: boolean;
  roles?: string[];
  owner?: string;
  expiresAt?: string;
  keyGeneratedAt?: string;
}
