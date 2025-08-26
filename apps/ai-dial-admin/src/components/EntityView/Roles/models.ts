import { DialRoleLimits, DialRoleShare } from '@/src/models/dial/base-entity';

export interface RolesGridData extends DialRoleLimits, DialRoleShare {
  name?: string;
}
