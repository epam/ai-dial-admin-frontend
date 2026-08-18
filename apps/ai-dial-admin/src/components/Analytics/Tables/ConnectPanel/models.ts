export enum ConnectTab {
  Write = 'write',
  Read = 'read',
}

// Why a table gets the read-only panel — the two reasons differ in what the panel must say, so the
// state carries its cause rather than being a bare boolean: a system table's row endpoint refuses
// every write, while an enrichment's rows come from the enrichment process.
export enum ConnectReadOnlyReason {
  SystemTable = 'system-table',
  Enrichment = 'enrichment',
}

// The two tables an enrichment's read note has to name apart: the enrichment whose page this is, and
// the table its query actually reads. Naming both is what keeps the note free of an ambiguous "that
// table".
export interface ConnectEnrichmentRead {
  name: string;
  sourceTable: string;
}

// A value-format rule the panel states against the columns it applies to. Which rules exist is fixed;
// which appear for a given table is derived from its declared column types.
export enum ConnectFormatRule {
  Timestamp = 'timestamp',
  Date = 'date',
  Decimal = 'decimal',
  Array = 'array',
}

// A row value in a generated snippet, before it is serialized into a language's literal syntax.
export type SnippetValue = string | number | boolean | SnippetValue[] | Record<string, never>;

export type SnippetRow = Record<string, SnippetValue>;

export interface ConnectFormatNote {
  rule: ConnectFormatRule;
  columns: string[];
}

// The endpoints a copied snippet points at. Kept as one object so the two URLs cannot be swapped at a
// call site; they are unrelated addresses — different scheme, port, and often host.
export interface ConnectEndpoints {
  baseUrl: string;
  flightUri: string;
}

export interface ConnectSnippets {
  auth: string;
  restEndpoint: string;
  pythonWrite: string;
  curlWrite: string;
  pythonRead: string;
  curlRead: string;
  flightInstall: string;
  flightRead: string;
}
