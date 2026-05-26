import { ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { isValueTruthy } from '@/src/utils/types';

const key = 'toolset-auth-is-user';
const urlKey = 'toolset-auth-redirect-url';
const levelsKey = 'toolset-auth-levels';

export const setIsUser = (type: ToolsetAuthCredentialLevel) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, String(type === ToolsetAuthCredentialLevel.USER));
  }
};

export const getIsUser = () => {
  if (typeof window !== 'undefined') {
    const isUser = localStorage.getItem(key);
    localStorage.removeItem(key);
    return isValueTruthy(isUser);
  }
  return null;
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
    const url =
      view === ApplicationRoute.Toolsets
        ? `${getUrnForEntity(view, selectedToolset)}?`
        : `${getUrnForEntity(view, selectedToolset)}&`;
    localStorage.setItem(urlKey, url);
  }
};

export const getUrl = () => {
  const url = localStorage.getItem(urlKey);
  localStorage.removeItem(urlKey);
  return url;
};
