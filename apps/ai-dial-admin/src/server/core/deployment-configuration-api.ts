import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { CoreApi } from './core-api';

const CORE_DEPLOYMENT_CONFIGURATION_URL = 'v1/deployments';

/**
 * Core's generic deployment-configuration read (`GET /v1/deployments/{name}/configuration`), which
 * proxies to whatever `features.configurationEndpoint` the resolved deployment declares
 * (`DeploymentFeatureController`/`ControllerSelector`'s `RouteTemplate.CONFIGURATION` route). Core
 * resolves the name against models, applications, toolsets, and interceptors in turn
 * (`Config.selectDeployment`), so this works for an interceptor's plain Core name too — unlike the
 * admin-BE's `InterceptorsApi.getConfigurationSchema`, which requires an admin-BE-tracked row and
 * hits `{admin-be}/api/deployments/{name}/configuration` (same shape, one path segment prefix apart).
 */
export class DeploymentConfigurationApi extends CoreApi {
  getConfigurationSchema(token: Token, name: string): Promise<ServerActionResponse> {
    return this.getAction(`${CORE_DEPLOYMENT_CONFIGURATION_URL}/${encodeURIComponent(name)}/configuration`, token);
  }
}
