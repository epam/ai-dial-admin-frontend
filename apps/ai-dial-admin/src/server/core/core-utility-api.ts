import { Token } from '@/src/models/auth';
import { CoreUserInfoResponse } from '@/src/models/dial/core-user-info';
import { ServerActionResponse } from '@/src/models/server-action';
import { UserInfo } from '@/src/models/user-info';
import { CoreApi } from './core-api';
import { Deployment } from '@/src/models/evaluation/deployment';

export const DEPLOYMENTS_URL = 'v1/deployments';
export const DEPLOYMENT_URL = (name: string) => `${DEPLOYMENTS_URL}/${name}`;
export const USER_INFO_URL = 'v1/user/info';
export const VERSION_URL = 'version';

/** Claim Core reports the caller's email under, inside `/v1/user/info`'s `userClaims` map. */
const EMAIL_CLAIM = 'email';

/**
 * Direct-to-Core replacements for the admin-backend endpoints that only ever proxied Core
 * unchanged: deployment listing/lookup, the caller's own identity, and the current Core version.
 * The global-settings singleton lives on {@link SettingsApi} instead, which already owns that
 * resource. {@link UtilityApi} keeps the Admin-backend-owned import/export, version configuration,
 * and config-sync operations so those aren't duplicated or moved here.
 */
export class CoreUtilityApi extends CoreApi {
  checkDeploymentByName(name: string, token: Token): Promise<Deployment | null> {
    return this.get(DEPLOYMENT_URL(name), token);
  }

  getAllDeployments(token: Token): Promise<ServerActionResponse> {
    return this.getAction(DEPLOYMENTS_URL, token);
  }

  getCoreVersion(token: Token): Promise<string | null> {
    return this.get(VERSION_URL, token, { Accept: 'text/plain' }).catch(() => null) as Promise<string | null>;
  }

  async getUserInfo(token: Token): Promise<ServerActionResponse<{ userInfo: UserInfo }>> {
    const result = (await this.getAction(USER_INFO_URL, token)) as ServerActionResponse<CoreUserInfoResponse>;
    if (!result.success) {
      return { ...result, response: undefined };
    }

    const raw = result.response;
    const userInfo: UserInfo = {
      id: raw?.userId || raw?.project || '',
      email: raw?.userClaims?.[EMAIL_CLAIM]?.[0] || '',
      // Core's raw DIAL roles aren't used here — role checks are out of scope for this identity read.
      roles: [],
    };

    return { ...result, response: { userInfo } };
  }
}
