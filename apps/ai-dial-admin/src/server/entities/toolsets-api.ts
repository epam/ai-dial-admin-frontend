import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { Token } from '@/src/models/auth';
import { Tool, Toolset, ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';
import { ServerActionResponse } from '@/src/models/server-action';
import { getToolsetBasicBody, getToolsetSignInBody } from '@/src/utils/toolset/toolset-auth';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const TOOLSETS_URL = `${API}/toolSets`;
export const TOOLSET_URL = (name?: string) => `${TOOLSETS_URL}/${name || ''}`;
export const CORE_TOOLSET_URL = (name: string) => `${TOOLSETS_URL}/core/${name}`;
export const TOOLS_URL = (name: string) => `${TOOLSET_URL(name)}/discovered-tools`;
export const TOOLS_TRY_OUT_URL = (name: string) => `${TOOLSET_URL(name)}/call-tool`;
export const TOOLSET_SIGN_IN_URL = `${TOOLSETS_URL}/sign-in`;
export const TOOLSET_SIGN_OUT_URL = `${TOOLSETS_URL}/sign-out`;

export class ToolsetsApi extends BaseApi {
  getToolsetList(token: Token): Promise<Toolset[] | null> {
    return this.get(TOOLSETS_URL, token);
  }

  getToolset(name: string, token: Token, eTag: string) {
    return this.getActionWithEtag(TOOLSET_URL(name), eTag, token);
  }

  getTools(name: string, token: Token): Promise<ServerActionResponse<{ tools: Tool[] }>> {
    return this.getAction(TOOLS_URL(name), token);
  }

  tryOutTool(
    name: string,
    body: Record<string, unknown>,
    token: Token,
  ): Promise<ServerActionResponse<Record<string, unknown>>> {
    return this.postAction(TOOLS_TRY_OUT_URL(name), body, token);
  }

  signInToolset(
    toolset: Toolset,
    redirectUri: string,
    type: ToolsetAuthCredentialLevel,
    token: Token,
    apiKey?: string,
    authCode?: string,
  ) {
    return this.postAction(
      TOOLSET_SIGN_IN_URL,
      getToolsetSignInBody(toolset, type, apiKey, authCode, redirectUri),
      token,
    );
  }

  signOutToolset(toolset: Toolset, type: ToolsetAuthCredentialLevel, token: Token) {
    return this.postAction(TOOLSET_SIGN_OUT_URL, getToolsetBasicBody(toolset, type), token);
  }

  removeToolset(token: Token, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(TOOLSET_URL(name), token);
  }

  createToolset(toolset: Toolset, token: Token): Promise<ServerActionResponse> {
    return this.postAction(TOOLSETS_URL, toolset, token);
  }

  updateToolset(toolset: Toolset, token: Token, eTag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(TOOLSET_URL(encodeURIComponent(toolset.name || '')), toolset, token, eTag);
  }

  getCoreToolset(name: string, token: Token) {
    return this.getActionWithEtag(CORE_TOOLSET_URL(name), DEFAULT_ETAG, token);
  }

  updateCoreToolset(toolset: Toolset, name: string, eTag: string, token: Token): Promise<ServerActionResponse> {
    return this.putActionWithEtag(CORE_TOOLSET_URL(encodeURIComponent(name)), toolset, token, eTag);
  }
}
