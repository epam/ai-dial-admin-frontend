import { DialRoleLimitsMap } from '@/src/models/dial/role-limits';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialModelEndpoint } from './model';

export interface DialRoute extends BaseEntity {
  rewritePath?: boolean;
  response?: RouteResponse;
  paths?: string[];
  methods?: string[];
  order?: number;
  maxRetryAttempts?: number;
  roleLimits?: DialRoleLimitsMap;
  upstreams?: DialModelEndpoint[];
}

// AppRoute - routes in the application or app runner
export interface DialAppRoute extends DialRoute {
  permissions?: RoutePermission[];
  attachmentPaths?: AttachmentPaths;
}

export interface AttachmentPaths {
  requestBody: string[];
  responseBody: string[];
}
export interface RouteResponse {
  status?: number | string;
  body?: string;
}

export enum RoutePermission {
  READ = 'read',
  WRITE = 'write',
}

export enum RouteOutput {
  UPSTREAMS = 'upstreams',
  RESPONSE = 'response',
}
