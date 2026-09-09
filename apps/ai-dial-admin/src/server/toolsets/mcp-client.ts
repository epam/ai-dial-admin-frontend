/**
 * Toolset and application try-out-tool, ported from the admin backend's
 * `ToolCallService.callTool`: a real MCP client session (initialize handshake + a single
 * `callTool`) against DIAL Core's MCP endpoint, opened and closed per request — no persistent
 * session, matching the BE's own lifecycle. Core applies the resource's stored credentials
 * server-side; this client only needs to authenticate as the admin (bearer token), same as
 * every other Core call.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';

import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { encodeCorePath, stripPrefix } from '@/src/server/publications/path';
import { ResourceType } from '@/src/types/resource-type';
import { getAuthorizationHeader } from '@/src/utils/auth/api-headers';
import { isPlatformBucketPath, PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { normalizeUrl } from '@/src/utils/url';

/**
 * Resolves the Core deployment id an MCP route's `{id}`/`{deployment_name}` segment needs for a
 * given resource path. Mirrors `ToolsetOpsApi.discoveredTools`'s doc comment: a platform-bucket
 * toolset/application is config-managed and registered in Core's merged config store by bare
 * name, so its id must be the bare name alone — neither the resource-type prefix nor the
 * `platform/` bucket segment — while a public-bucket resource still needs the full
 * `{resourceType}/{path}` the resource-path fallback resolves.
 */
const buildMcpDeploymentId = (path: string, resourceType: ResourceType): string =>
  isPlatformBucketPath(path)
    ? stripPrefix(path, `${PLATFORM_ROOT_FOLDER}/`)
    : `${RESOURCE_TYPE_PREFIX[resourceType]}${path}`;

/** Builds the absolute Core MCP endpoint URL for a toolset path. */
export const buildToolsetMcpUrl = (host: string, path: string): URL => {
  const id = encodeCorePath(buildMcpDeploymentId(path, ResourceType.TOOLSET));
  return new URL(`${normalizeUrl(host)}v1/toolset/${id}/mcp`);
};

/**
 * Builds the absolute Core MCP endpoint URL for an application path. Core's application MCP
 * route is deployment-scoped (`/v1/deployments/{deployment_name}/mcp`), not resource-path-scoped
 * like the toolset route — but `DeploymentService.findDeployment` resolves a custom
 * application's `deployment_name` as its full resource URL (same as `ToolSetService`), so the
 * same deployment-id resolution as `buildToolsetMcpUrl` applies here too.
 */
export const buildApplicationMcpUrl = (host: string, path: string): URL => {
  const id = encodeCorePath(buildMcpDeploymentId(path, ResourceType.APPLICATION));
  return new URL(`${normalizeUrl(host)}v1/deployments/${id}/mcp`);
};

/**
 * Opens a short-lived MCP client session against Core, issues a single `callTool` request,
 * and closes the session — whether the call succeeds or fails.
 */
export const callToolViaMcp = async (
  url: URL,
  token: Token,
  callToolRequest: CallToolRequest['params'],
): Promise<ServerActionResponse> => {
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: { headers: getAuthorizationHeader(token) },
  });
  const client = new Client({ name: 'ai-dial-admin', version: '1' });

  try {
    await client.connect(transport);
    const response = await client.callTool(callToolRequest);
    return { success: true, response: response as unknown as Record<string, unknown> };
  } catch (error) {
    return {
      success: false,
      errorHeader: 'Tool Call Failed',
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await client.close();
  }
};
