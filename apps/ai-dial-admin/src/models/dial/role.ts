import { DialBaseNamedEntity, DialRoleLimits, DialRoleShare } from './base-entity';

export interface DialRole extends DialBaseNamedEntity {
  limits?: Record<string, DialRoleLimits>;
  share?: Record<string, DialRoleShare>;
  grantedKeys?: string[];
}
