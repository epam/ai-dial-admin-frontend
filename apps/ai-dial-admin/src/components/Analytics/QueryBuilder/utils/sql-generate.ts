import {
  QueryExpr,
  QueryExprType,
  QueryFilterNode,
  QueryGroup,
  QueryLogicalOperator,
  QueryOperator,
  QueryPageType,
  QueryPredicate,
  QuerySortNulls,
  QueryValueExpr,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';

const LOGICAL_OPS = new Set<string>([QueryLogicalOperator.And, QueryLogicalOperator.Or, QueryLogicalOperator.Not]);

const isGroup = (node: QueryFilterNode): node is QueryGroup => LOGICAL_OPS.has((node as QueryGroup).op);

const escapeString = (value: string): string => value.replace(/'/g, "''");

const literal = (expr: QueryValueExpr): string => {
  if (expr.value === null || expr.value_type === QueryValueType.Null) return 'NULL';
  switch (expr.value_type) {
    case QueryValueType.Integer:
    case QueryValueType.Long:
    case QueryValueType.Decimal:
    case QueryValueType.Boolean:
      return expr.value;
    case QueryValueType.Timestamp:
      // Own serialization is epoch millis (a numeric literal); anything else stays quoted.
      return /^\d+$/.test(expr.value) ? expr.value : `'${escapeString(expr.value)}'`;
    default:
      return `'${escapeString(expr.value)}'`;
  }
};

const exprSql = (expr: QueryExpr): string => {
  switch (expr.type) {
    case QueryExprType.Field:
      return expr.name;
    case QueryExprType.Value:
      return literal(expr);
    case QueryExprType.Fn:
      return `${expr.name}(${expr.distinct ? 'DISTINCT ' : ''}${expr.args.map(exprSql).join(', ')})`;
    case QueryExprType.Array:
      return `(${expr.items.map(literal).join(', ')})`;
  }
};

const OP_SQL: Record<QueryOperator, string> = {
  [QueryOperator.Eq]: '=',
  [QueryOperator.Ne]: '!=',
  [QueryOperator.Co]: 'LIKE',
  [QueryOperator.Nc]: 'NOT LIKE',
  [QueryOperator.Lt]: '<',
  [QueryOperator.Gt]: '>',
  [QueryOperator.Le]: '<=',
  [QueryOperator.Ge]: '>=',
  [QueryOperator.In]: 'IN',
};

const predicateSql = (pred: QueryPredicate): string => {
  const [left, right] = pred.args;
  if (right?.type === QueryExprType.Value && (right.value === null || right.value_type === QueryValueType.Null)) {
    return `${exprSql(left)} ${pred.op === QueryOperator.Ne ? 'IS NOT NULL' : 'IS NULL'}`;
  }
  if (pred.op === QueryOperator.Co || pred.op === QueryOperator.Nc) {
    const raw = right?.type === QueryExprType.Value ? escapeString(right.value ?? '') : exprSql(right);
    return `${exprSql(left)} ${OP_SQL[pred.op]} '%${raw}%'`;
  }
  return `${exprSql(left)} ${OP_SQL[pred.op]} ${exprSql(right)}`;
};

const filterSql = (node: QueryFilterNode): string => {
  if (!isGroup(node)) return predicateSql(node);
  const parts = node.args.map((child) => (isGroup(child) ? `(${filterSql(child)})` : filterSql(child)));
  if (node.op === QueryLogicalOperator.Not) {
    return `NOT (${parts.join(' AND ')})`;
  }
  return parts.join(` ${node.op.toUpperCase()} `);
};

// Renders the structured query as the bounded SQL subset the execute-sql endpoint accepts. Used to
// seed the SQL view from the builder — the reverse direction (SQL → builder) intentionally does
// not exist, which is why leaving an edited SQL buffer for the Builder is guarded.
export const sqlFromQuery = (query: StructuredQuery): string => {
  const lines: string[] = [];

  const select = query.select?.length
    ? query.select.map((col) => (col.as ? `${exprSql(col.expr)} AS ${col.as}` : exprSql(col.expr))).join(',\n  ')
    : '*';
  lines.push(`SELECT${query.distinct ? ' DISTINCT' : ''}\n  ${select}`);
  lines.push(`FROM ${query.entity}`);

  if (query.filter) lines.push(`WHERE ${filterSql(query.filter)}`);
  if (query.group_by?.length) lines.push(`GROUP BY ${query.group_by.join(', ')}`);
  if (query.having) lines.push(`HAVING ${filterSql(query.having)}`);

  if (query.sort?.length) {
    const keys = query.sort.map((s) => {
      const nulls = s.nulls && s.nulls !== QuerySortNulls.Default ? ` NULLS ${s.nulls.toUpperCase()}` : '';
      return `${s.field} ${s.dir.toUpperCase()}${nulls}`;
    });
    lines.push(`ORDER BY ${keys.join(', ')}`);
  }

  if (query.page?.type === QueryPageType.Offset) {
    lines.push(`LIMIT ${query.page.limit}${query.page.offset ? ` OFFSET ${query.page.offset}` : ''}`);
  } else if (query.page?.type === QueryPageType.Cursor) {
    // Cursor paging is not expressible in SQL; the limit still bounds the statement.
    lines.push(`LIMIT ${query.page.limit}`);
  }

  return lines.join('\n');
};
