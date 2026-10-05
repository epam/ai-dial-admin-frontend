/**
 * DIAL Core's wire shape for `dial:applicationTypeRoutes` — an object keyed by route name whose
 * fields are all `dial:`-prefixed. This is the native shape used by Core-owned App Routes UI.
 */
export interface CoreAppRunnerRoute extends Record<string, unknown> {
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

export type CoreAppRunnerRoutes = Record<string, Record<string, unknown>>;
