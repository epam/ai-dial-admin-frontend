import { JWT } from 'next-auth/jwt';

import { DialRole } from '@/src/models/dial/role';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';

export const ROLES_URL = `${API}/roles`;
export const ROLE_URL = (name?: string) => `${ROLES_URL}/${name}`;
export const CORE_ROLE_URL = (name?: string) => `${ROLES_URL}/core/${name}`;

export class RolesApi extends BaseApi {
  getRolesList(token: JWT | null): Promise<DialRole[] | null> {
    return this.get(ROLES_URL, token);
  }

  getRole(name: string, token: JWT | null, eTag: string) {
    return this.getActionWithEtag(ROLE_URL(name), eTag || DEFAULT_ETAG, token);
  }

  removeRole(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(ROLE_URL(name), token);
  }

  createRole(role: DialRole, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(ROLES_URL, role, token);
  }

  updateRole(role: DialRole, token: JWT | null, eTag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(ROLE_URL(encodeURIComponent(role.name || '')), role, token, eTag);
  }

  getCoreRole(name: string, token: JWT | null) {
    return this.get(CORE_ROLE_URL(name), token);
  }

  updateCoreRole(role: DialRole, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(CORE_ROLE_URL(encodeURIComponent(role.name || '')), role, token);
  }
}
