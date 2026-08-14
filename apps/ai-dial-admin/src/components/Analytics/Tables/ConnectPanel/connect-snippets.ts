import {
  ADAS_API_KEY_ENV,
  ADAS_BASE_URL_ENV,
  ADAS_BASE_URL_PLACEHOLDER,
  ADAS_FLIGHT_URI_ENV,
  ANALYTICS_FIELD_TYPE_FORMAT_RULE,
  ANALYTICS_FIELD_TYPE_SAMPLE,
  CONNECT_FORMAT_RULE_ORDER,
  PLATFORM_COLUMN_PREFIX,
  READ_SNIPPET_LIMIT,
} from '@/src/components/Analytics/Tables/ConnectPanel/constants';
import {
  ConnectFormatNote,
  ConnectSnippets,
  SnippetRow,
  SnippetValue,
} from '@/src/components/Analytics/Tables/ConnectPanel/models';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableColumn } from '@/src/models/analytics/table';

const writableColumns = (table: AnalyticsTable): AnalyticsTableColumn[] =>
  (table.columns ?? []).filter((column) => !column.source_name.startsWith(PLATFORM_COLUMN_PREFIX));

const sampleFor = (column: AnalyticsTableColumn): SnippetValue => {
  if (column.type !== AnalyticsFieldType.Array) {
    return ANALYTICS_FIELD_TYPE_SAMPLE[column.type];
  }
  const element = ANALYTICS_FIELD_TYPE_SAMPLE[column.element_type ?? AnalyticsFieldType.String];
  return [element, element];
};

/**
 * One example row for this table, keyed the way the row-insert endpoint accepts — by each column's
 * physical `source_name`. Callers must not present that identifier to the user: it equals the exposed
 * name on every table this app can create, so naming the distinction would teach a concept the reader
 * cannot act on.
 *
 * An enrichment's grain key leads the row: it is never one of `columns`, and an enrichment row that
 * omits it cannot join to its source.
 */
export const buildSampleRow = (table: AnalyticsTable): SnippetRow => {
  const row: SnippetRow = {};
  const grainKey = table.grain?.grain_key;
  if (grainKey) row[grainKey] = ANALYTICS_FIELD_TYPE_SAMPLE[AnalyticsFieldType.String];
  writableColumns(table).forEach((column) => {
    row[column.source_name] = sampleFor(column);
  });
  return row;
};

const indentLines = (lines: string[], indent: string): string => lines.map((line) => `${indent}${line}`).join('\n');

const toPythonValue = (value: SnippetValue): string => {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (Array.isArray(value)) return `[${value.map(toPythonValue).join(', ')}]`;
  if (typeof value === 'object') return '{}';
  return String(value);
};

export const toPythonLiteral = (row: SnippetRow): string => {
  const entries = Object.entries(row).map(([key, value]) => `"${key}": ${toPythonValue(value)},`);
  return entries.length ? `{\n${indentLines(entries, '    ')}\n}` : '{}';
};

const toJsonValue = (value: SnippetValue): string => {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(toJsonValue).join(', ')}]`;
  if (typeof value === 'object') return '{}';
  return String(value);
};

export const toJsonLiteral = (row: SnippetRow, indent: string): string => {
  const entries = Object.entries(row).map(([key, value]) => `"${key}": ${toJsonValue(value)},`);
  if (!entries.length) return '{}';
  const body = entries.map((entry, index) => (index === entries.length - 1 ? entry.slice(0, -1) : entry));
  return `{\n${indentLines(body, `${indent}  `)}\n${indent}}`;
};

/**
 * The value-format rules this table's columns actually carry, each naming the columns it applies to.
 * A rule no column's type uses is absent, so a table of strings and integers yields nothing — the
 * reader is never asked to work out which of their columns an abstract rule covers.
 */
export const buildFormatNotes = (table: AnalyticsTable): ConnectFormatNote[] => {
  const byRule = new Map<string, string[]>();
  writableColumns(table).forEach((column) => {
    const rule = ANALYTICS_FIELD_TYPE_FORMAT_RULE[column.type];
    if (!rule) return;
    byRule.set(rule, [...(byRule.get(rule) ?? []), column.name]);
  });
  return CONNECT_FORMAT_RULE_ORDER.filter((rule) => byRule.has(rule)).map((rule) => ({
    rule,
    columns: byRule.get(rule) ?? [],
  }));
};

const resolveBaseUrl = (baseUrl: string): string => (baseUrl ?? '').trim() || ADAS_BASE_URL_PLACEHOLDER;

const projection = (table: AnalyticsTable): string => {
  const names = writableColumns(table).map((column) => column.name);
  return names.length ? names.join(', ') : '*';
};

const buildAuthSnippet = (baseUrl: string): string =>
  [`export ${ADAS_API_KEY_ENV}=dial_xxxxxxxxxxxxxxxx`, `export ${ADAS_BASE_URL_ENV}=${resolveBaseUrl(baseUrl)}`].join(
    '\n',
  );

const buildPythonWriteSnippet = (table: AnalyticsTable, baseUrl: string): string =>
  [
    'import json, os, urllib.request',
    '',
    `BASE_URL = os.environ.get("${ADAS_BASE_URL_ENV}", "${resolveBaseUrl(baseUrl)}")`,
    `API_KEY  = os.environ["${ADAS_API_KEY_ENV}"]`,
    `TABLE    = "${table.name}"`,
    '',
    `ROW = ${toPythonLiteral(buildSampleRow(table))}`,
    '',
    'request = urllib.request.Request(',
    '    f"{BASE_URL}/v1/tables/{TABLE}/rows",',
    '    data=json.dumps({"rows": [ROW]}).encode(),',
    '    headers={"Content-Type": "application/json", "Api-Key": API_KEY},',
    '    method="POST",',
    ')',
    'with urllib.request.urlopen(request, timeout=30) as response:',
    '    print(json.load(response))',
  ].join('\n');

const buildCurlWriteSnippet = (table: AnalyticsTable): string =>
  [
    `curl -sS -X POST "$${ADAS_BASE_URL_ENV}/v1/tables/${table.name}/rows" \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -H "Api-Key: $${ADAS_API_KEY_ENV}" \\`,
    `  -d '{"rows":[${toJsonLiteral(buildSampleRow(table), '  ')}]}'`,
  ].join('\n');

const buildPythonReadSnippet = (table: AnalyticsTable, baseUrl: string): string =>
  [
    'import json, os, urllib.request',
    '',
    `BASE_URL = os.environ.get("${ADAS_BASE_URL_ENV}", "${resolveBaseUrl(baseUrl)}")`,
    `API_KEY  = os.environ["${ADAS_API_KEY_ENV}"]`,
    '',
    `SQL = "SELECT ${projection(table)} FROM ${table.name} LIMIT ${READ_SNIPPET_LIMIT}"`,
    '',
    'request = urllib.request.Request(',
    '    f"{BASE_URL}/v1/queries/execute-sql",',
    '    data=json.dumps({"sql": SQL}).encode(),',
    '    headers={"Content-Type": "application/json", "Api-Key": API_KEY},',
    '    method="POST",',
    ')',
    'with urllib.request.urlopen(request, timeout=30) as response:',
    '    for row in json.load(response)["rows"]:',
    '        print(row)',
  ].join('\n');

const buildCurlReadSnippet = (table: AnalyticsTable): string =>
  [
    `curl -sS -X POST "$${ADAS_BASE_URL_ENV}/v1/queries/execute-sql" \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -H "Api-Key: $${ADAS_API_KEY_ENV}" \\`,
    `  -d '{"sql":"SELECT ${projection(table)} FROM ${table.name} LIMIT ${READ_SNIPPET_LIMIT}"}'`,
  ].join('\n');

const buildFlightInstallSnippet = (): string =>
  ['pip install adbc-driver-flightsql pyarrow pandas', `export ${ADAS_FLIGHT_URI_ENV}=grpc://<adas-host>:32010`].join(
    '\n',
  );

const buildFlightReadSnippet = (table: AnalyticsTable): string =>
  [
    'import os',
    'import adbc_driver_flightsql.dbapi as flight_sql',
    '',
    `URI = os.environ["${ADAS_FLIGHT_URI_ENV}"]`,
    '',
    // The driver names the header in lower case because gRPC lower-cases header names on the wire; it
    // is the same Api-Key the REST calls send.
    `db_kwargs = {"adbc.flight.sql.rpc.call_header.api-key": os.environ["${ADAS_API_KEY_ENV}"]}`,
    '',
    'with flight_sql.connect(URI, db_kwargs=db_kwargs, autocommit=True) as connection:',
    '    with connection.cursor() as cursor:',
    `        cursor.execute("SELECT ${projection(table)} FROM ${table.name} LIMIT ${READ_SNIPPET_LIMIT}")`,
    '        frame = cursor.fetch_arrow_table().to_pandas()',
    '',
    'print(frame.head())',
  ].join('\n');

export const buildConnectSnippets = (table: AnalyticsTable, baseUrl: string): ConnectSnippets => ({
  auth: buildAuthSnippet(baseUrl),
  pythonWrite: buildPythonWriteSnippet(table, baseUrl),
  curlWrite: buildCurlWriteSnippet(table),
  pythonRead: buildPythonReadSnippet(table, baseUrl),
  curlRead: buildCurlReadSnippet(table),
  flightInstall: buildFlightInstallSnippet(),
  flightRead: buildFlightReadSnippet(table),
});
