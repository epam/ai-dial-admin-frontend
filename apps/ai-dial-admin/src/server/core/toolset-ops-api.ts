import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { encodeCorePath } from '@/src/server/publications/path';
import { ResourceType } from '@/src/types/resource-type';
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
 * Core's `v1/toolset/{id}/tools` route resolves the deployment by name regardless of type, so
 * it already serves MCP-enabled Applications as well as Toolsets — `discoveredTools` accepts
 * either resource type and encodes the matching path prefix.
 */
export class ToolsetOpsApi extends CoreApi {
  /** Fetches a deployment's discovered tools (`GET v1/toolset/{path}/tools`). */
  discoveredTools(
    token: Token,
    path: string,
    resourceType: ResourceType = ResourceType.TOOLSET,
  ): Promise<ServerActionResponse> {
    const url = `${CORE_TOOLSET_TOOLS_URL}/${encodeCorePath(`${RESOURCE_TYPE_PREFIX[resourceType]}${path}`)}/tools`;
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
