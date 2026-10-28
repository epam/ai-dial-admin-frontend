/**
 * One result row as the grid holds it. The grid identifies a row by its content unless told otherwise, so rows that
 * read identically (a projection of a few columns, or a shared `id` value) would collapse to one; each row carries the
 * place it came in.
 */
export interface ResultGridRow {
  index: number;
  values: Record<string, unknown>;
}
