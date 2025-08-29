import { DialBaseNamedEntity, DialModifiedEntity } from './base-entity';

export interface DialKey extends DialBaseNamedEntity, DialModifiedEntity {
  key: string;
  project: string;
  projectContactPoint?: string;
  secured: boolean;
  roles?: string[];
  owner?: string;
  expiresAt?: number;
  keyGeneratedAt?: number;
}
