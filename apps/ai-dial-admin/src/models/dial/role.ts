import { DialBaseNamedEntity, DialRoleLimits } from './base-entity';

export interface DialRole extends DialBaseNamedEntity {
  limits?: Record<string, DialRoleLimits>;
  grantedKeys?: string[];
}
