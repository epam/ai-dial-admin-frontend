import { ApplicationRoute } from '@/src/types/routes';

/**
 * The six views `config-file-entity-views` covers — Keys and App Runners are excluded because
 * neither has a config-file population to switch to (Core refuses the config-file `keys` route
 * unconditionally, and App Runners have no config-file type at all).
 */
export const CONFIG_FILE_ENTITY_VIEWS: ReadonlySet<ApplicationRoute> = new Set([
  ApplicationRoute.PlatformModels,
  ApplicationRoute.PlatformInterceptors,
  ApplicationRoute.PlatformRoutes,
  ApplicationRoute.PlatformRoles,
  ApplicationRoute.AssetsApplications,
  ApplicationRoute.AssetsToolsets,
]);

/**
 * Maps a config-file-sourced detail route (the "hidden" admin-grid route, e.g. `/models/{id}`) back
 * to the platform/asset list route a `?configFile=true` row was reached from. Used to fix up the
 * detail page's own breadcrumb: the hidden route's list segment (`/models`) redirects home without
 * the admin backend, so it must not be offered as the "back to list" link in config-file mode.
 */
export const CONFIG_FILE_DETAIL_TO_LIST_ROUTE: Partial<Record<ApplicationRoute, ApplicationRoute>> = {
  [ApplicationRoute.Models]: ApplicationRoute.PlatformModels,
  [ApplicationRoute.Interceptors]: ApplicationRoute.PlatformInterceptors,
  [ApplicationRoute.Routes]: ApplicationRoute.PlatformRoutes,
  [ApplicationRoute.Roles]: ApplicationRoute.PlatformRoles,
  [ApplicationRoute.Applications]: ApplicationRoute.AssetsApplications,
  [ApplicationRoute.Toolsets]: ApplicationRoute.AssetsToolsets,
};
