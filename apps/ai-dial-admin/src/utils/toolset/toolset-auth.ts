import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialToolsetResource, ToolsetAuthType as ResourceToolsetAuthType } from '@/src/models/dial/resource';
import { Toolset, ToolsetAuthStatus, ToolsetAuthType } from '@/src/models/dial/toolset';
import { stripPrefix } from '@/src/server/publications/path';
import { isPlatformBucketPath, PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';

export const getToolsetSignInBody = (
  toolset: Toolset | DialToolsetResource,
  level: string,
  apiKey?: string,
  authCode?: string,
  redirectUri?: string,
) => {
  const authType =
    (toolset as Toolset).authSettings?.authenticationType ||
    (toolset as DialToolsetResource).auth_settings?.authentication_type;
  const body = { ...getToolsetBasicBody(toolset, level) };

  if (authType === ToolsetAuthType.OAUTH || authType === ResourceToolsetAuthType.OAUTH) {
    return { ...body, code: authCode, redirectUri };
  }

  return { ...body, apiKey };
};

/**
 * `url` feeds Core's `DeploymentService.findDeployment`, which resolves a platform-bucket
 * toolset by bare name via the merged config store — before ever reaching the resource-path
 * parse a public-bucket toolset needs `toolsets/{path}` for (see `ToolsetOpsApi`'s doc comment).
 * So a platform-bucket `.path` must have its `platform/` segment stripped and skip the
 * `toolsets/` prefix entirely, unlike a public-bucket path.
 */
export const getToolsetBasicBody = (toolset: Toolset | DialToolsetResource, level: string) => {
  const authType =
    (toolset as Toolset).authSettings?.authenticationType ||
    (toolset as DialToolsetResource).auth_settings?.authentication_type;
  const path = (toolset as AssetToolset).path;
  const url = isPlatformBucketPath(path)
    ? stripPrefix(path as string, `${PLATFORM_ROOT_FOLDER}/`)
    : path
      ? `toolsets/${path}`
      : toolset.name;
  return {
    url,
    credentialsLevel: level,
    authenticationType: authType,
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
