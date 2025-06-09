import { DialBaseNamedEntity, DialRoleLimitsMap } from './base-entity';
import { DialModelEndpoint } from './model';

export interface DialRoute extends DialBaseNamedEntity {
  rewritePath?: boolean;
  roleLimits?: DialRoleLimitsMap;
  response?: RouteResponse;
  paths?: string[];
  methods?: string[];
  upstreams?: DialModelEndpoint[];
  maxRetryAttempts?: number;
}

export interface RouteResponse {
  status?: number | string;
  body?: string;
}

export enum RouteOutput {
  UPSTREAMS = 'upstreams',
  RESPONSE = 'response',
}
