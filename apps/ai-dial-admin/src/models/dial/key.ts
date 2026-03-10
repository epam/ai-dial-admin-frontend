import { BaseEntity, EntityValidityState } from '@/src/models/dial/base-entity';

export interface DialKey extends BaseEntity, EntityValidityState {
  key?: string;
  project?: string;
  projectContactPoint?: string;
  secured?: boolean;
  roles?: string[];
  owner?: string;
  expiresAt?: string;
  keyGeneratedAt?: string;
  allowedIpAddressRanges?: string[];
}
