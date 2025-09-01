import { DialBaseNamedEntity } from './base-entity';
import { DialRoleLimits, DialRoleShare } from '@/src/models/dial/role-limits';

export interface DialRole extends DialBaseNamedEntity {
  limits?: Record<string, DialRoleLimits>;
  share?: Record<string, DialRoleShare>;
  grantedKeys?: string[];
}
