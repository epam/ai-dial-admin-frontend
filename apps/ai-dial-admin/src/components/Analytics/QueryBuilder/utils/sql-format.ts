import { format } from 'sql-formatter';

// The analytics service runs its SQL on ClickHouse, so the formatter reads it in that dialect: the generic
// `sql` one splits ClickHouse function calls from their parentheses (`now ()`).
// Backend/AI-provided SQL should always be well-formed, but a formatting failure must never block
// the editor from showing the query as-is — fall back to the original text rather than throwing.
export const formatSql = (sql: string): string => {
  try {
    return format(sql, { language: 'clickhouse' });
  } catch {
    return sql;
  }
};
