import { ApplicationRoute } from '@/src/types/routes';

export const getCoreSyncStatusUrl = (type?: ApplicationRoute, id?: string): string | null => {
  switch (type) {
    case ApplicationRoute.Models:
      return `/models/${id}/sync-state`;
    case ApplicationRoute.Applications:
      return `/applications/${id}/sync-state`;
    case ApplicationRoute.Interceptors:
      return `/interceptors/${id}/sync-state`;
    case ApplicationRoute.Roles:
      return `/roles/${id}/sync-state`;
    case ApplicationRoute.Routes:
      return `/routes/${id}/sync-state`;
    case ApplicationRoute.Toolsets:
      return `/toolSets/${id}/sync-state`;
    case ApplicationRoute.ApplicationRunners:
      return `/applicationTypeSchemas/sync-state?id=${id}`;
    default:
      return null;
  }
};
