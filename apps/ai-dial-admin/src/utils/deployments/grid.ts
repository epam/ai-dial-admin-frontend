import { ApplicationRoute } from '@/src/types/routes';

export const getAdminEntityPath = (route: ApplicationRoute, data: unknown): string => {
  switch (route) {
    case ApplicationRoute.InterceptorContainers:
      return `${ApplicationRoute.Interceptors}/${encodeURIComponent((data as { name: string }).name || '')}`;
    case ApplicationRoute.McpContainers:
      return `${ApplicationRoute.Toolsets}/${encodeURIComponent((data as { name: string }).name || '')}`;
    case ApplicationRoute.ModelServings:
      return `${ApplicationRoute.Models}/${encodeURIComponent((data as { name: string }).name || '')}`;
    default:
      return '';
  }
};

export const getAdminAssetPath = (route: ApplicationRoute, data: unknown): string => {
  const asset = data as { folderId: string; name: string; version: string };
  const path = `${asset.folderId}${asset.name}__${asset.version}`;
  switch (route) {
    case ApplicationRoute.McpContainers:
      return `${ApplicationRoute.AssetsToolsets}/${encodeURIComponent(asset.name)}?path=${encodeURIComponent(path)}`;
    default:
      return '';
  }
};
