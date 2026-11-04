import { AdminAccess, UserOrgUnit } from '@/src/models/user-access';

/** Raw shape of DIAL Core's `GET /v1/user/role-assignments` response (404 while org units are off). */
export interface CoreUserOrgUnitsResponse {
  adminAccess: AdminAccess;
  items?: UserOrgUnit[];
}
