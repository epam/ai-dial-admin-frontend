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
