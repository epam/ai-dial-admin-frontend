import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { Toolset, ToolsetAuthStatus, ToolsetAuthType } from '@/src/models/dial/toolset';

export const getToolsetSignInBody = (
  toolset: Toolset,
  level: string,
  apiKey?: string,
  authCode?: string,
  redirectUri?: string,
) => {
  const body = { ...getToolsetBasicBody(toolset, level) };

  if (toolset.authSettings?.authenticationType === ToolsetAuthType.OAUTH) {
    return { ...body, code: authCode, redirectUri };
  }

  return { ...body, apiKey };
};

export const getToolsetBasicBody = (toolset: Toolset, level: string) => {
  return {
    url: (toolset as AssetToolset).path ? `toolsets/${(toolset as AssetToolset).path}` : toolset.name,
    credentialsLevel: level,
    authenticationType: toolset.authSettings?.authenticationType,
  };
};

export const isLoggedInToToolset = (toolset: Toolset): boolean => {
  return isUserLoggedInToToolset(toolset) || isAdminLoggedInToToolset(toolset);
};

export const isFullLoggedInToToolset = (toolset: Toolset): boolean => {
  return isUserLoggedInToToolset(toolset) && isAdminLoggedInToToolset(toolset);
};

export const isUserLoggedInToToolset = (toolset: Toolset): boolean => {
  const authSettings = toolset.authSettings;
  return authSettings?.userLevelAuthStatus === ToolsetAuthStatus.SIGNED_IN;
};

export const isAdminLoggedInToToolset = (toolset: Toolset): boolean => {
  const authSettings = toolset.authSettings;
  return authSettings?.globalAuthStatus === ToolsetAuthStatus.SIGNED_IN;
};

export const encodeToolsetRedirectState = (state: Record<string, string | undefined>): string => {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) {
    bin += String.fromCharCode(b);
  }
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
