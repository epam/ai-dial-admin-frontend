import { BaseEntity } from './base-entity';
import { DialRoleLimits, DialRoleShare } from '@/src/models/dial/role-limits';

export interface DialRole extends BaseEntity {
  limits?: Record<string, DialRoleLimits>;
  share?: Record<string, DialRoleShare>;
  grantedKeys?: string[];
}
