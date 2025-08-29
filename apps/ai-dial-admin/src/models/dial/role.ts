import { BaseEntity, DialRoleLimits, DialRoleShare } from './base-entity';

export interface DialRole extends BaseEntity {
  limits?: Record<string, DialRoleLimits>;
  share?: Record<string, DialRoleShare>;
  grantedKeys?: string[];
}
