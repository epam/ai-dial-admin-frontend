import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialRoleLimits, DialRoleShare } from '@/src/models/dial/role-limits';

export interface DialRole extends BaseEntity {
  limits?: Record<string, DialRoleLimits>;
  share?: Record<string, DialRoleShare>;
  grantedKeys?: string[];
  costLimit?: DialRoleLimits;
}
