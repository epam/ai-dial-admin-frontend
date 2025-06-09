import { JWT } from 'next-auth/jwt';

import { DialRole } from '@/src/models/dial/role';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const ROLES_URL = `${API}/roles`;
export const ROLE_URL = (name?: string) => `${ROLES_URL}/${name}`;

export class RolesApi extends BaseApi {
  getRolesList(token: JWT | null): Promise<DialRole[] | null> {
    return this.get(ROLES_URL, token);
  }

  getRole(name: string, token: JWT | null): Promise<DialRole | null> {
    return this.get(ROLE_URL(name), token);
  }

  removeRole(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(ROLE_URL(name), token);
  }

  createRole(role: DialRole, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(ROLES_URL, role, token);
  }

  updateRole(role: DialRole, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(ROLE_URL(role.name), role, token);
  }
}
