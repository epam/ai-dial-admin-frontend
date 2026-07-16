// Analytics — SQL editor autocomplete catalog.
// A hint set for the Monaco completion provider, NOT a validator. The backend
// (`POST /v1/queries/execute-sql`) is authoritative: it accepts only the DSL-expressible SQL
// subset (single read-only SELECT; closed function catalog; no joins/CTEs/subqueries/arithmetic/
// CAST). Keep these lists aligned with what the backend accepts.

// Clause / operator keywords offered as completions.
export const SQL_KEYWORDS: string[] = [
  'SELECT',
  'DISTINCT',
  'FROM',
  'WHERE',
  'GROUP BY',
  'HAVING',
  'ORDER BY',
  'LIMIT',
  'AS',
  'AND',
  'OR',
  'NOT',
  'IN',
  'LIKE',
  'IS NULL',
  'IS NOT NULL',
  'ASC',
  'DESC',
];
