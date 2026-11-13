export const DEFAULT_GRAFANA_TEMPO_DATASOURCE_UID = 'tempo';
export const DEFAULT_GRAFANA_ORG_ID = 1;

export const GRAFANA_EXPLORE_PATH = '/explore';
export const GRAFANA_SCHEMA_VERSION = 1;
export const GRAFANA_PANE_ID = 'a';
export const GRAFANA_QUERY_REF_ID = 'A';
export const GRAFANA_DATASOURCE_TYPE = 'tempo';
export const GRAFANA_QUERY_TYPE = 'traceql';
/** Groups search results per trace; without it Explore falls back to a flat spans table. */
export const GRAFANA_TABLE_TYPE_TRACES = 'traces';

export const GRAFANA_RANGE_FROM = 'now-24h';
export const GRAFANA_RANGE_TO = 'now';

/** The span attribute carrying an application's Core path, matched as `".*<path>"`. */
export const DEPLOYMENT_SPAN_ATTRIBUTE = 'span.dial.deployment';
/** Appended to the deployment selector with `>>` so an error anywhere beneath the application counts. */
export const ERROR_SPAN_SELECTOR = '{ status = error }';
