import { JWT } from 'next-auth/jwt';

import { Toolset, Tool, ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';
import { API } from '../api';
import { BaseApi } from '../base-api';
import { ServerActionResponse } from '@/src/models/server-action';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { getToolsetBasicBody, getToolsetSignInBody } from '@/src/utils/toolset/toolset-auth';

export const TOOLSETS_URL = `${API}/toolSets`;
export const TOOLSET_URL = (name?: string) => `${TOOLSETS_URL}/${name || ''}`;
export const CORE_TOOLSET_URL = (name: string) => `${TOOLSETS_URL}/core/${name}`;
export const TOOLS_URL = (name: string) => `${TOOLSET_URL(name)}/discovered-tools`;
export const TOOLS_TRY_OUT_URL = (name: string) => `${TOOLSET_URL(name)}/call-tool`;
export const TOOLSET_SIGN_IN_URL = `${TOOLSETS_URL}/sign-in`;
export const TOOLSET_SIGN_OUT_URL = `${TOOLSETS_URL}/sign-out`;

export class ToolsetsApi extends BaseApi {
  getToolsetList(token: JWT | null): Promise<Toolset[] | null> {
    return this.get(TOOLSETS_URL, token);
  }

  getToolset(name: string, token: JWT | null, eTag: string) {
    return this.getActionWithEtag(TOOLSET_URL(name), eTag, token);
  }

  getTools(name: string, token: JWT | null): Promise<Tool[] | null> {
    return this.get(TOOLS_URL(name), token).then((res) => (res as { tools: Tool[] })?.tools || []);
  }

  tryOutTool(
    name: string,
    body: Record<string, unknown>,
    token: JWT | null,
  ): Promise<ServerActionResponse<Record<string, unknown>>> {
    return this.postAction(TOOLS_TRY_OUT_URL(name), body, token);
  }

  signInToolset(
    toolset: Toolset,
    type: ToolsetAuthCredentialLevel,
    token: JWT | null,
    apiKey?: string,
    authCode?: string,
  ) {
    return this.postAction(TOOLSET_SIGN_IN_URL, getToolsetSignInBody(toolset, type, apiKey, authCode), token);
  }

  signOutToolset(toolset: Toolset, type: ToolsetAuthCredentialLevel, token: JWT | null) {
    return this.postAction(TOOLSET_SIGN_OUT_URL, getToolsetBasicBody(toolset, type), token);
  }

  removeToolset(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(TOOLSET_URL(name), token);
  }

  createToolset(toolset: Toolset, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(TOOLSETS_URL, toolset, token);
  }

  updateToolset(toolset: Toolset, token: JWT | null, eTag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(TOOLSET_URL(encodeURIComponent(toolset.name || '')), toolset, token, eTag);
  }

  getCoreToolset(name: string, token: JWT | null) {
    return this.getActionWithEtag(CORE_TOOLSET_URL(name), DEFAULT_ETAG, token);
  }

  updateCoreToolset(toolset: Toolset, name: string, eTag: string, token: JWT | null): Promise<ServerActionResponse> {
    return this.putActionWithEtag(CORE_TOOLSET_URL(encodeURIComponent(name)), toolset, token, eTag);
  }
}
