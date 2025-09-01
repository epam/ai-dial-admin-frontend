import { BaseEntity, ModifiedEntity } from '@/src/models/dial/base-entity';
import { DialRoleLimits, DialRoleShare } from '@/src/models/dial/role-limits';

export interface DialRole extends BaseEntity, ModifiedEntity {
  limits?: Record<string, DialRoleLimits>;
  share?: Record<string, DialRoleShare>;
  grantedKeys?: string[];
}
