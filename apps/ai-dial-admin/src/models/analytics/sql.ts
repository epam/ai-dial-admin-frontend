// Analytics — SQL editor autocomplete descriptors.
// A Monaco-free description of a completion suggestion, produced by the pure `buildSqlCompletions`
// util and mapped to a real `monaco.languages.CompletionItem` (kind enum + range) at registration
// time. Kept free of the Monaco runtime so the builder stays unit-testable.

export enum SqlCompletionKind {
  Field = 'field',
  Entity = 'entity',
  Keyword = 'keyword',
  Function = 'function',
}

export interface SqlCompletion {
  label: string;
  kind: SqlCompletionKind;
  insertText: string;
  // Shown to the right of the label in the suggestion list (e.g. a field's type, "table", "keyword").
  detail?: string;
}
