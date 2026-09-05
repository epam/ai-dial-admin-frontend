import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { ConnectFormatRule, SnippetValue } from '@/src/components/Analytics/Tables/ConnectPanel/models';

// Shown in place of the endpoint when the deployment configures no public Analytics URL. Deliberately
// not a plausible host: a copied snippet should fail on an obviously unreplaced placeholder rather than
// on a DNS lookup the reader has to diagnose.
export const ANALYTICS_BASE_URL_PLACEHOLDER = '<analytics-base-url>';

// The Flight endpoint cannot be derived from the REST one: different scheme, a separately exposed
// port, and usually a different host.
export const ANALYTICS_FLIGHT_SQL_URL_PLACEHOLDER = 'grpc://<analytics-host>:32010';

export const DIAL_ANALYTICS_BASE_URL_ENV = 'DIAL_ANALYTICS_BASE_URL';
export const DIAL_API_KEY_ENV = 'DIAL_API_KEY';
export const DIAL_ANALYTICS_FLIGHT_SQL_URL_ENV = 'DIAL_ANALYTICS_FLIGHT_SQL_URL';

// The row limit the generated read snippets carry. The REST surface applies this same value when a
// query omits a limit, so an explicit one changes nothing but shows the reader where to raise it.
export const READ_SNIPPET_LIMIT = 100;

// Mock literals, one per column type, chosen so a copied row is valid input for that type.
// Three are not the obvious choice and are load-bearing:
//   Decimal   — a string, so the digits reach the store intact rather than through a JSON float.
//   Timestamp — space-separated; the insert path rejects an ISO-8601 `T` separator or `Z` suffix,
//               even though queries return this column in exactly that form.
//   Enum      — unreachable in practice, and deliberately not a plausible value: an enum column's sample
//               comes from its own declared domain (see `sampleFor`), because no fixed literal can be
//               inside a domain the column chooses. This entry exists because the map is exhaustive over
//               the type enum, and is reached only by a column declaring no values at all.
export const ANALYTICS_FIELD_TYPE_SAMPLE: Record<AnalyticsFieldType, SnippetValue> = {
  [AnalyticsFieldType.Uuid]: '8f14e45f-ceea-4d1b-a1c0-9c1e6d3b7a52',
  [AnalyticsFieldType.String]: 'example',
  [AnalyticsFieldType.Integer]: 42,
  [AnalyticsFieldType.Long]: 42,
  [AnalyticsFieldType.Decimal]: '94.25',
  [AnalyticsFieldType.Boolean]: true,
  [AnalyticsFieldType.Date]: '2026-01-15',
  [AnalyticsFieldType.Timestamp]: '2026-01-15 10:00:00.000',
  [AnalyticsFieldType.Object]: {},
  [AnalyticsFieldType.Array]: [],
  [AnalyticsFieldType.Enum]: 'example',
};

// The column types that carry a value-format rule worth stating. A type absent from this map produces
// no guidance, which is what keeps a table of strings and integers free of format prose.
export const ANALYTICS_FIELD_TYPE_FORMAT_RULE: Partial<Record<AnalyticsFieldType, ConnectFormatRule>> = {
  [AnalyticsFieldType.Timestamp]: ConnectFormatRule.Timestamp,
  [AnalyticsFieldType.Date]: ConnectFormatRule.Date,
  [AnalyticsFieldType.Decimal]: ConnectFormatRule.Decimal,
  [AnalyticsFieldType.Array]: ConnectFormatRule.Array,
};

// Order the notes render in, independent of column order, so two tables with the same types read the
// same way.
export const CONNECT_FORMAT_RULE_ORDER: ConnectFormatRule[] = [
  ConnectFormatRule.Timestamp,
  ConnectFormatRule.Date,
  ConnectFormatRule.Decimal,
  ConnectFormatRule.Array,
];

// Platform-owned columns: the backend fills them and rejects a row that names one.
export const PLATFORM_COLUMN_PREFIX = '_';

// Snippet-bar labels. Language identifiers rather than UI prose, so they stay out of i18n — the same
// reason a file extension is not translated.
export const SNIPPET_LANGUAGE_PYTHON = 'python';
export const SNIPPET_LANGUAGE_SHELL = 'shell';
