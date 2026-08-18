import {
  DIAL_API_KEY_ENV,
  DIAL_ANALYTICS_BASE_URL_ENV,
  ANALYTICS_BASE_URL_PLACEHOLDER,
  DIAL_ANALYTICS_FLIGHT_SQL_URL_ENV,
  ANALYTICS_FLIGHT_SQL_URL_PLACEHOLDER,
  ANALYTICS_FIELD_TYPE_FORMAT_RULE,
  ANALYTICS_FIELD_TYPE_SAMPLE,
  CONNECT_FORMAT_RULE_ORDER,
  PLATFORM_COLUMN_PREFIX,
  READ_SNIPPET_LIMIT,
} from '@/src/components/Analytics/Tables/ConnectPanel/constants';
import {
  ConnectEndpoints,
  ConnectFormatNote,
  ConnectSnippets,
  SnippetRow,
  SnippetValue,
} from '@/src/components/Analytics/Tables/ConnectPanel/models';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableColumn, AnalyticsTableType } from '@/src/models/analytics/table';

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
 * No grain-key handling: the write path is not offered for enrichment tables, whose rows the
 * enrichment process produces. Their read path is `buildReadSql`.
 */
export const buildSampleRow = (table: AnalyticsTable): SnippetRow => {
  const row: SnippetRow = {};
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

const resolveBaseUrl = (baseUrl: string): string => (baseUrl ?? '').trim() || ANALYTICS_BASE_URL_PLACEHOLDER;

const resolveFlightUri = (flightUri: string): string =>
  (flightUri ?? '').trim() || ANALYTICS_FLIGHT_SQL_URL_PLACEHOLDER;

/**
 * An enrichment is queried through its source table, so it needs one that is actually named. A payload
 * missing it cannot produce a runnable query, and the panel is not offered for such a table; the check
 * keeps this builder total rather than emitting `FROM undefined`.
 */
export const isEnrichmentRead = (table: AnalyticsTable): boolean =>
  table.type === AnalyticsTableType.Enrichment && Boolean(table.source_table);

/**
 * Every projected column is quoted, not only the ones that have to be. An enrichment's column is
 * exposed on the source table under a name that literally contains a dot, so it must be quoted as ONE
 * identifier — `"enrichment.column"`; quoting it as two (`"enrichment"."column"`) makes the service
 * read the first part as a table and answer `Table '<enrichment>' not found`. Quoting the ordinary
 * names alongside it costs nothing and keeps a single SELECT list from looking arbitrarily
 * inconsistent.
 */
const quoteIdentifier = (name: string): string => `"${name}"`;

/**
 * The grain key plus one of the enrichment's own columns. The grain key is an ordinary column of the
 * table being read; the enrichment's column carries the dotted name described above.
 */
const enrichmentProjection = (table: AnalyticsTable): string[] => {
  const projected: string[] = [];
  const grainKey = table.grain?.grain_key;
  if (grainKey) projected.push(quoteIdentifier(grainKey));
  const [column] = writableColumns(table);
  if (column) projected.push(quoteIdentifier(`${table.name}.${column.name}`));
  return projected;
};

/**
 * The ordering key names the columns a reader filters, sorts, and joins on, which makes it a better
 * first example than every column the table declares. Entries are quoted as the payload reports them;
 * a platform column is dropped here as everywhere else in the panel.
 */
const orderingKeyProjection = (table: AnalyticsTable): string[] =>
  (table.ordering_key ?? []).filter((name) => !name.startsWith(PLATFORM_COLUMN_PREFIX)).map(quoteIdentifier);

export const buildReadSql = (table: AnalyticsTable): string => {
  const isEnrichment = isEnrichmentRead(table);
  const projected = isEnrichment ? enrichmentProjection(table) : orderingKeyProjection(table);
  const relation = isEnrichment ? table.source_table : table.name;
  return `SELECT ${projected.length ? projected.join(', ') : '*'} FROM ${relation} LIMIT ${READ_SNIPPET_LIMIT}`;
};

/**
 * A quoted identifier carries double quotes, so the statement cannot sit in a double-quoted literal
 * unescaped. Python takes it in single quotes; a JSON body has to escape it. Table and column
 * identifiers cannot contain either quote character, so neither form can be broken out of.
 */
const toPythonSqlLiteral = (sql: string): string => `'${sql}'`;

const toJsonSqlString = (sql: string): string => sql.replace(/"/g, '\\"');

/**
 * The key alone. It is the one thing every example on both tabs needs; the REST endpoint travels with
 * the `curl` examples that read it, so Flight SQL — which needs the key but not that endpoint — is
 * never asked to set a variable it does not use.
 */
const buildAuthSnippet = (): string => `export ${DIAL_API_KEY_ENV}=dial_xxxxxxxxxxxxxxxx`;

// Shown as its own shell block above each REST example, the way the Flight section already presents
// its own setup. `curl` cannot carry a default at all; the Python examples can, and still do, so the
// export stays optional there rather than becoming a step the script depends on.
const buildRestEndpointExport = (baseUrl: string): string =>
  `export ${DIAL_ANALYTICS_BASE_URL_ENV}=${resolveBaseUrl(baseUrl)}`;

const buildPythonWriteSnippet = (table: AnalyticsTable, baseUrl: string): string =>
  [
    'import json, os, urllib.request',
    '',
    `BASE_URL = os.environ.get("${DIAL_ANALYTICS_BASE_URL_ENV}", "${resolveBaseUrl(baseUrl)}")`,
    `API_KEY  = os.environ["${DIAL_API_KEY_ENV}"]`,
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
    `curl -sS -X POST "$${DIAL_ANALYTICS_BASE_URL_ENV}/v1/tables/${table.name}/rows" \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -H "Api-Key: $${DIAL_API_KEY_ENV}" \\`,
    `  -d '{"rows":[${toJsonLiteral(buildSampleRow(table), '  ')}]}'`,
  ].join('\n');

const buildPythonReadSnippet = (table: AnalyticsTable, baseUrl: string): string =>
  [
    'import json, os, urllib.request',
    '',
    `BASE_URL = os.environ.get("${DIAL_ANALYTICS_BASE_URL_ENV}", "${resolveBaseUrl(baseUrl)}")`,
    `API_KEY  = os.environ["${DIAL_API_KEY_ENV}"]`,
    '',
    `SQL = ${toPythonSqlLiteral(buildReadSql(table))}`,
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
    `curl -sS -X POST "$${DIAL_ANALYTICS_BASE_URL_ENV}/v1/queries/execute-sql" \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -H "Api-Key: $${DIAL_API_KEY_ENV}" \\`,
    `  -d '{"sql":"${toJsonSqlString(buildReadSql(table))}"}'`,
  ].join('\n');

const buildFlightInstallSnippet = (flightUri: string): string =>
  [
    'pip install adbc-driver-flightsql pyarrow pandas',
    `export ${DIAL_ANALYTICS_FLIGHT_SQL_URL_ENV}=${resolveFlightUri(flightUri)}`,
  ].join('\n');

const buildFlightReadSnippet = (table: AnalyticsTable, flightUri: string): string =>
  [
    'import os',
    'import adbc_driver_flightsql.dbapi as flight_sql',
    '',
    `URI = os.environ.get("${DIAL_ANALYTICS_FLIGHT_SQL_URL_ENV}", "${resolveFlightUri(flightUri)}")`,
    '',
    // The driver names the header in lower case because gRPC lower-cases header names on the wire; it
    // is the same Api-Key the REST calls send.
    `db_kwargs = {"adbc.flight.sql.rpc.call_header.api-key": os.environ["${DIAL_API_KEY_ENV}"]}`,
    '',
    'with flight_sql.connect(URI, db_kwargs=db_kwargs, autocommit=True) as connection:',
    '    with connection.cursor() as cursor:',
    `        cursor.execute(${toPythonSqlLiteral(buildReadSql(table))})`,
    '        frame = cursor.fetch_arrow_table().to_pandas()',
    '',
    'print(frame.head())',
  ].join('\n');

export const buildConnectSnippets = (table: AnalyticsTable, endpoints: ConnectEndpoints): ConnectSnippets => ({
  auth: buildAuthSnippet(),
  restEndpoint: buildRestEndpointExport(endpoints.baseUrl),
  pythonWrite: buildPythonWriteSnippet(table, endpoints.baseUrl),
  curlWrite: buildCurlWriteSnippet(table),
  pythonRead: buildPythonReadSnippet(table, endpoints.baseUrl),
  curlRead: buildCurlReadSnippet(table),
  flightInstall: buildFlightInstallSnippet(endpoints.flightUri),
  flightRead: buildFlightReadSnippet(table, endpoints.flightUri),
});
