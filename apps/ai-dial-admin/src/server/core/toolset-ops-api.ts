import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { encodeCorePath, stripPrefix } from '@/src/server/publications/path';
import { ResourceType } from '@/src/types/resource-type';
import { isPlatformBucketPath, PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { CoreApi } from './core-api';

const CORE_TOOLSET_TOOLS_URL = 'v1/toolset';
const CORE_TOOLSET_SIGN_IN_URL = 'v1/ops/toolset/signin';
const CORE_TOOLSET_SIGN_OUT_URL = 'v1/ops/toolset/signout';

/**
 * Toolset-only DIAL Core operations that don't fit the generic `AssetApi` (which models the
 * shared CRUD/move shape for all four versioned resource types): discovered-tools, sign-in,
 * and sign-out. The admin backend forwards each of these to Core unchanged — no BE-side
 * secret-holding or token exchange — so this is a direct passthrough client.
 *
 * Core's `v1/toolset/{id}/tools` route resolves `{id}` via `DeploymentService.findDeployment`,
 * which tries the merged config store by bare name *before* falling back to
 * `ResourceDescriptorFactory.fromAnyUrl`'s `{resourceType}/{bucket}/{path}` parse. Platform-bucket
 * toolsets/applications are config-managed and registered there by bare name (see
 * `ToolSetController.mergeToolsets`'s `config.getToolsets()` lookup) — so a platform-bucket `{id}`
 * must be the bare name alone, with neither the resource-type prefix nor the `platform/` bucket
 * segment, unlike a public-bucket resource path (which only the fallback, resource-path branch
 * resolves, and does need `{resourceType}/{path}`).
 */
export class ToolsetOpsApi extends CoreApi {
  /** Fetches a deployment's discovered tools (`GET v1/toolset/{id}/tools`). */
  discoveredTools(
    token: Token,
    path: string,
    resourceType: ResourceType = ResourceType.TOOLSET,
  ): Promise<ServerActionResponse> {
    const id = isPlatformBucketPath(path)
      ? stripPrefix(path, `${PLATFORM_ROOT_FOLDER}/`)
      : `${RESOURCE_TYPE_PREFIX[resourceType]}${path}`;
    const url = `${CORE_TOOLSET_TOOLS_URL}/${encodeCorePath(id)}/tools`;
    return this.getAction(url, token);
  }

  /** Signs in to a toolset (`POST v1/ops/toolset/signin`). */
  signIn(token: Token, body: Record<string, unknown>): Promise<ServerActionResponse> {
    return this.postAction(CORE_TOOLSET_SIGN_IN_URL, body, token);
  }

  /** Signs out of a toolset (`POST v1/ops/toolset/signout`). */
  signOut(token: Token, body: Record<string, unknown>): Promise<ServerActionResponse> {
    return this.postAction(CORE_TOOLSET_SIGN_OUT_URL, body, token);
  }
}
