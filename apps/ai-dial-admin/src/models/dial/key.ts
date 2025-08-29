import { BaseEntity, DialModifiedEntity } from './base-entity';

export interface DialKey extends BaseEntity, DialModifiedEntity {
  key: string;
  project: string;
  projectContactPoint?: string;
  secured: boolean;
  roles?: string[];
  owner?: string;
  expiresAt?: number;
  keyGeneratedAt?: number;
}
