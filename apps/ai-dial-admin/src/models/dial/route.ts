import { DialRoleLimitsMap } from '@/src/models/dial/role-limits';
import { DialBaseNamedEntity } from './base-entity';
import { DialModelEndpoint } from './model';

export interface DialRoute extends DialBaseNamedEntity {
  rewritePath?: boolean;
  roleLimits?: DialRoleLimitsMap;
  response?: RouteResponse;
  paths?: string[];
  methods?: string[];
  upstreams?: DialModelEndpoint[];
  maxRetryAttempts?: number;
  order?: number;
}

// AppRoute - routes in the application or app runner
export interface DialAppRoute extends DialRoute {
  isPublic?: boolean;
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
