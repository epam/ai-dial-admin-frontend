import { format } from 'sql-formatter';

// Backend/AI-provided SQL should always be well-formed, but a formatting failure must never block
// the editor from showing the query as-is — fall back to the original text rather than throwing.
export const formatSql = (sql: string): string => {
  try {
    return format(sql, { language: 'sql' });
  } catch {
    return sql;
  }
};
