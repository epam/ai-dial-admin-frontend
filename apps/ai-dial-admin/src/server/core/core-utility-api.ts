import { Token } from '@/src/models/auth';
import { CoreCallerDeploymentsResponse } from '@/src/models/dial/core-caller-options';
import { CoreUserInfoResponse } from '@/src/models/dial/core-user-info';
import { CoreUserOrgUnitsResponse } from '@/src/models/dial/core-user-org-units';
import { ServerActionResponse } from '@/src/models/server-action';
import { UserInfo } from '@/src/models/user-info';
import { CoreApi } from './core-api';
import { Deployment } from '@/src/models/evaluation/deployment';

export const DEPLOYMENTS_URL = 'v1/deployments';
export const DEPLOYMENT_URL = (name: string) => `${DEPLOYMENTS_URL}/${name}`;
export const USER_INFO_URL = 'v1/user/info';
export const USER_ORG_UNITS_URL = 'v1/user/org-units';
export const VERSION_URL = 'version';
export const APPLICATION_TYPE_SCHEMAS_URL = 'v1/application_type_schemas/schemas';

export enum CallerDeploymentKind {
  Models = 'models',
  Applications = 'applications',
}

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
    };

    return { ...result, response: { userInfo } };
  }

  /** The caller's admin access and units. Answers 404 while org units are off, so callers keep the `status`. */
  getUserOrgUnits(token: Token): Promise<ServerActionResponse<CoreUserOrgUnitsResponse>> {
    return this.getAction(USER_ORG_UNITS_URL, token);
  }

  /** Every runner schema, config-file and platform folder alike. Readable by any caller, unlike the config-file read. */
  getRunnerSchemas(token: Token): Promise<ServerActionResponse> {
    return this.getAction(APPLICATION_TYPE_SCHEMAS_URL, token);
  }

  /** The deployments the caller may use — exactly what Core accepts as a dependency from them. */
  getCallerDeployments(
    token: Token,
    kind: CallerDeploymentKind,
  ): Promise<ServerActionResponse<CoreCallerDeploymentsResponse>> {
    return this.getAction(`openai/${kind}`, token);
  }
}
