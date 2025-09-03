import { DialRoleLimits, DialRoleShare } from '@/src/models/dial/role-limits';

export interface RolesGridData extends DialRoleLimits, DialRoleShare {
  name?: string;
}
