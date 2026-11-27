import type { DeploymentData } from '@epam/ai-dial-typescript-sdk';

import { Token } from '@/src/models/auth';
import { ConfigHealthResponse } from '@/src/models/dial/config-health';
import { CoreCallerDeploymentsResponse } from '@/src/models/dial/core-caller-options';
import { CoreUserInfoResponse } from '@/src/models/dial/core-user-info';
import { CoreUserOrgUnitsResponse } from '@/src/models/dial/core-user-org-units';
import { ServerActionResponse } from '@/src/models/server-action';
import { UserInfo } from '@/src/models/user-info';
import { encodeCorePath } from '@/src/server/publications/path';
import { CoreApi } from './core-api';

export const USER_ROLE_ASSIGNMENTS_URL = 'v1/user/role-assignments';
export const VERSION_URL = 'version';
export const APPLICATION_TYPE_SCHEMAS_URL = 'v1/application_type_schemas/schemas';
export const CONFIG_HEALTH_URL = 'v1/admin/health/config';

export enum CallerDeploymentKind {
  Models = 'models',
  Applications = 'applications',
}

/** Claim Core reports the caller's email under, inside `/v1/user/info`'s `userClaims` map. */
const EMAIL_CLAIM = 'email';

/**
 * Direct-to-Core replacements for the admin-backend endpoints that only ever proxied Core
 * unchanged: deployment lookup, the caller's own identity, and the current Core version.
 * The global-settings singleton lives on {@link SettingsApi} instead, which already owns that
 * resource. {@link UtilityApi} keeps the Admin-backend-owned import/export, version configuration,
 * and config-sync operations so those aren't duplicated or moved here.
 *
 * `getUserInfo` and the deployment lookups go through the SDK; `getCoreVersion` stays hand-written because it
 * reads `text/plain`.
 */
export class CoreUtilityApi extends CoreApi {
  /**
   * Looks up a deployment by a name a user typed. Encoded per segment, so `?`, `#`, `%` or a space stay part of
   * the name while `/` stays a separator.
   */
  checkDeploymentByName(name: string, token: Token): Promise<DeploymentData | null | undefined> {
    return this.getDeploymentInfo(encodeCorePath(name), token);
  }

  /**
   * Looks up a deployment by an id Core issued, such as a conversation's `model.id`. Sent unchanged: the id is
   * already percent-encoded, and encoding it again would turn `My%20App` into `My%2520App` and miss.
   */
  getDeploymentById(id: string, token: Token): Promise<DeploymentData | null | undefined> {
    return this.getDeploymentInfo(id, token);
  }

  /**
   * {@link checkDeploymentByName} for a caller that has to tell why a lookup failed: the envelope keeps Core's
   * `status`, where the lookup above folds a 404, a 5xx and an unreachable Core into `null`. A call that throws
   * (Core unreachable) is the caller's to catch.
   */
  getDeploymentInfoResult(name: string, token: Token): Promise<ServerActionResponse<DeploymentData>> {
    return this.sdkAction<DeploymentData>(token, (init) => this.sdk.getDeploymentInfo(encodeCorePath(name), init));
  }

  getCoreVersion(token: Token): Promise<string | null> {
    return this.getText(VERSION_URL, token, { Accept: 'text/plain' }).catch(() => null);
  }

  async getUserInfo(token: Token): Promise<ServerActionResponse<{ userInfo: UserInfo }>> {
    // The SDK's `UserInfoResponse` marks `roles` optional; Core always sends it, as `CoreUserInfoResponse` says.
    const result = await this.sdkAction<CoreUserInfoResponse>(token, (init) => this.sdk.getUserInfo(init));
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
  getUserRoleAssignments(token: Token): Promise<ServerActionResponse<CoreUserOrgUnitsResponse>> {
    return this.getAction(USER_ROLE_ASSIGNMENTS_URL, token);
  }

  /** Every runner schema, config-file and platform folder alike. Readable by any caller, unlike the config-file read. */
  getRunnerSchemas(token: Token): Promise<ServerActionResponse> {
    return this.getAction(APPLICATION_TYPE_SCHEMAS_URL, token);
  }

  /** The entities Core keeps but cannot serve, with why. Admins only: Core answers 403 to anyone else. */
  getConfigHealth(token: Token): Promise<ServerActionResponse<ConfigHealthResponse>> {
    return this.getAction(CONFIG_HEALTH_URL, token);
  }

  /** The deployments the caller may use — exactly what Core accepts as a dependency from them. */
  getCallerDeployments(
    token: Token,
    kind: CallerDeploymentKind,
  ): Promise<ServerActionResponse<CoreCallerDeploymentsResponse>> {
    return this.getAction(`openai/${kind}`, token);
  }

  /**
   * `/v1/deployments/{…}`, not the SDK's `getDeployment`, which reads `/openai/deployments/{…}`. `null` when Core has
   * no such deployment or the call fails, `undefined` on 403 — typed here because `sdkGet` hides it behind `R | null`.
   */
  private getDeploymentInfo(path: string, token: Token): Promise<DeploymentData | null | undefined> {
    return this.sdkGet<DeploymentData>(token, (init) => this.sdk.getDeploymentInfo(path, init));
  }
}
