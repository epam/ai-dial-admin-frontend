import { DialBaseNamedEntity } from './base-entity';

export interface DialKey extends DialBaseNamedEntity {
  key: string;
  project: string;
  projectContactPoint?: string;
  secured: boolean;
  roles?: string[];
  owner?: string;
  createdAt?: number;
  expiresAt?: number;
  keyGeneratedAt?: number;
}
