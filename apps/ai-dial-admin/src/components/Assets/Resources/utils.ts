import { DialToolsetResource, ToolsetAuthCredentialLevel, ToolsetAuthStatus } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { ToolsetTransport } from '@/src/types/toolset';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

const urlKey = 'toolset-auth-redirect-url';
const levelsKey = 'toolset-auth-levels';

export const isUserLoggedInToToolset = (toolset: DialToolsetResource): boolean => {
  const authSettings = toolset.auth_settings;
  return authSettings?.user_level_auth_status === ToolsetAuthStatus.SIGNED_IN;
};

export const isAdminLoggedInToToolset = (toolset: DialToolsetResource): boolean => {
  const authSettings = toolset.auth_settings;
  return authSettings?.global_auth_status === ToolsetAuthStatus.SIGNED_IN;
};
export const isLoggedInToToolset = (toolset: DialToolsetResource): boolean => {
  return isUserLoggedInToToolset(toolset) || isAdminLoggedInToToolset(toolset);
};

export const isFullLoggedInToToolset = (toolset: DialToolsetResource): boolean => {
  return isUserLoggedInToToolset(toolset) && isAdminLoggedInToToolset(toolset);
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

export const setLevels = (levels: ToolsetAuthCredentialLevel[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(levelsKey, JSON.stringify(levels));
  }
};

export const getLevels = (): ToolsetAuthCredentialLevel[] => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(levelsKey);
    localStorage.removeItem(levelsKey);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const setUrl = (view: ApplicationRoute, selectedToolset: unknown) => {
  if (typeof window !== 'undefined') {
    const url = `${getUrnForEntity(view, selectedToolset)}&`;
    localStorage.setItem(urlKey, url);
  }
};

export const getAllowTools = (toolset: DialToolsetResource) => {
  return toolset.allowed_tools?.filter((tool) => tool !== '');
};

export const getTransport = (toolset: DialToolsetResource) => {
  return toolset.transport
    ? toolset.transport
    : toolset.endpoint?.includes('http') || toolset.endpoint?.includes('https')
      ? ToolsetTransport.HTTP.toUpperCase()
      : ToolsetTransport.SSE.toUpperCase();
};
