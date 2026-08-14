export enum ConnectTab {
  Write = 'write',
  Read = 'read',
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

export interface ConnectSnippets {
  auth: string;
  pythonWrite: string;
  curlWrite: string;
  pythonRead: string;
  curlRead: string;
  flightInstall: string;
  flightRead: string;
}
