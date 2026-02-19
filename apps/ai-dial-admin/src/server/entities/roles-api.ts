import { Token } from '@/src/models/auth';
import { DialRole } from '@/src/models/dial/role';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';

export const ROLES_URL = `${API}/roles`;
export const ROLE_URL = (name?: string) => `${ROLES_URL}/${name || ''}`;
export const CORE_ROLE_URL = (name: string) => `${ROLES_URL}/core/${name}`;

export class RolesApi extends BaseApi {
  getRolesList(token: Token): Promise<DialRole[] | null> {
    return this.get(ROLES_URL, token);
  }

  getRole(name: string, token: Token, eTag: string) {
    return this.getActionWithEtag(ROLE_URL(name), eTag, token);
  }

  removeRole(token: Token, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(ROLE_URL(name), token);
  }

  createRole(role: DialRole, token: Token): Promise<ServerActionResponse> {
    return this.postAction(ROLES_URL, role, token);
  }

  updateRole(role: DialRole, token: Token, eTag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(ROLE_URL(encodeURIComponent(role.name || '')), role, token, eTag);
  }

  getCoreRole(name: string, token: Token): Promise<ServerActionResponse<DialRole>> {
    return this.getActionWithEtag(CORE_ROLE_URL(name), DEFAULT_ETAG, token);
  }

  updateCoreRole(role: DialRole, name: string, eTag: string, token: Token): Promise<ServerActionResponse> {
    return this.putActionWithEtag(CORE_ROLE_URL(encodeURIComponent(name)), role, token, eTag);
  }
}
