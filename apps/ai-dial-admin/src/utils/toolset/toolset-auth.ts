import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { ToolsetAuthType } from '@/src/models/dial/toolset';

export const getToolsetSignInBody = (toolset: AssetToolset, authCode?: string) => {
  const body = {
    // url: 'toolsets/{bucket}/{path}', // TODO: ask BE
    credentials_level: 'GLOBAL',
    authenticationType: toolset.authSettings?.authenticationType,
  };
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

export const getToolsetSignOutBody = (toolset: AssetToolset) => {
  return {
    // url: 'toolsets/{bucket}/{path}', // TODO: ask BE
    credentials_level: 'GLOBAL',
    authenticationType: toolset.authSettings?.authenticationType,
  };
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
