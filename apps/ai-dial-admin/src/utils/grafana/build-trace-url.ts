import { buildExploreUrl } from './build-application-traces-urls';
import { GrafanaConfig } from './models';

/** Builds the Grafana Explore link to one trace. `traceId` is the 32-character hex id from a `traceparent`. */
export const buildTraceUrl = (config: GrafanaConfig, traceId: string): string => buildExploreUrl(config, traceId);
