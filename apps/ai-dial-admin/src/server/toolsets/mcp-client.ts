/**
 * Toolset try-out-tool, ported from the admin backend's `ToolCallService.callTool`: a real
 * MCP client session (initialize handshake + a single `callTool`) against DIAL Core's MCP
 * endpoint, opened and closed per request — no persistent session, matching the BE's own
 * lifecycle. Core applies the toolset's stored credentials server-side; this client only
 * needs to authenticate as the admin (bearer token), same as every other Core call.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';

import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { encodeCorePath } from '@/src/server/publications/path';
import { ResourceType } from '@/src/types/resource-type';
import { getAuthorizationHeader } from '@/src/utils/auth/api-headers';
import { normalizeUrl } from '@/src/utils/url';

/** Builds the absolute Core MCP endpoint URL for a toolset path. */
export const buildToolsetMcpUrl = (host: string, path: string): URL => {
  const prefixedPath = encodeCorePath(`${RESOURCE_TYPE_PREFIX[ResourceType.TOOLSET]}${path}`);
  return new URL(`${normalizeUrl(host)}v1/toolset/${prefixedPath}/mcp`);
};

/**
 * Opens a short-lived MCP client session against Core, issues a single `callTool` request,
 * and closes the session — whether the call succeeds or fails.
 */
export const callToolViaMcp = async (
  host: string,
  token: Token,
  path: string,
  callToolRequest: CallToolRequest['params'],
): Promise<ServerActionResponse> => {
  const url = buildToolsetMcpUrl(host, path);
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
