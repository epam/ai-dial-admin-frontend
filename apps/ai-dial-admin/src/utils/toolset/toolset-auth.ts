import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { ToolsetAuthCredentialLevel, ToolsetAuthStatus, ToolsetAuthType } from '@/src/models/dial/toolset';

export const getToolsetSignInBody = (toolset: AssetToolset, level: ToolsetAuthCredentialLevel, authCode?: string) => {
  const body = { ...getToolsetBasicBody(toolset, level) };

  if (toolset.authSettings?.authenticationType === ToolsetAuthType.OAUTH) {
    return {
      ...body,
      code: authCode,
    };
  }

  return {
    ...body,
    apiKeyHeader: toolset.authSettings?.apiKeyHeader,
  };
};

export const getToolsetBasicBody = (toolset: AssetToolset, level: ToolsetAuthCredentialLevel) => {
  return {
    // url: 'toolsets/{bucket}/{path}', // TODO: ask BE
    credentials_level: level,
    authenticationType: toolset.authSettings?.authenticationType,
  };
};

export const isLoggedInToToolset = (toolset: AssetToolset): boolean => {
  return isUserLoggedInToToolset(toolset) || isAdminLoggedInToToolset(toolset);
};

export const isUserLoggedInToToolset = (toolset: AssetToolset): boolean => {
  const authSettings = toolset.authSettings;
  return authSettings?.userLevelAuthStatus === ToolsetAuthStatus.SIGNED_IN;
};

export const isAdminLoggedInToToolset = (toolset: AssetToolset): boolean => {
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
