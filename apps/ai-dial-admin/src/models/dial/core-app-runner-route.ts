/**
 * DIAL Core's wire shape for `dial:applicationTypeRoutes` — an object keyed by route name whose
 * fields are all `dial:`-prefixed. Distinct from `DialAppRoute`, which is the flat array shape the
 * route editors work on; `core-app-routes.ts` converts between the two.
 */
export interface CoreAppRunnerRoute {
  ['dial:paths']: string[];
  ['dial:methods']: string[];
  ['dial:upstreams']: CoreAppRunnerUpstream[];
  ['dial:userRoles']?: string[];
  ['dial:rewritePath']?: boolean;
  ['dial:order']?: number;
  ['dial:maxRetryAttempts']?: number;
  ['dial:permissions']?: CoreAppRunnerRoutePermission[];
  ['dial:response']?: CoreAppRunnerRouteResponse;
  ['dial:attachmentPaths']?: CoreAppRunnerRouteAttachmentPaths;
}

export interface CoreAppRunnerUpstream {
  ['dial:endpoint']: string;
  ['dial:key']?: string;
  ['dial:extraData']?: string;
  ['dial:weight']?: number;
  ['dial:tier']?: number;
}

export interface CoreAppRunnerRouteResponse {
  ['dial:status']: number;
  ['dial:body']: string;
}

export interface CoreAppRunnerRouteAttachmentPaths {
  ['dial:requestBody']?: string[];
  ['dial:responseBody']?: string[];
}

export enum CoreAppRunnerRoutePermission {
  READ = 'READ',
  WRITE = 'WRITE',
}

export type CoreAppRunnerRoutes = Record<string, CoreAppRunnerRoute>;
