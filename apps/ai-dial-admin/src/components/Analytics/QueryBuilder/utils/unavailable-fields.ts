import { FilterGroupNode, FilterNode, FilterNodeKind, QueryBuilderState } from '@/src/models/analytics/query-builder';
import { QueryMode } from '@/src/models/analytics/query';

const collectPredicateFields = (node: FilterGroupNode, into: string[]): void => {
  node.children.forEach((child: FilterNode) => {
    if (child.kind === FilterNodeKind.Group) collectPredicateFields(child, into);
    else if (child.field) into.push(child.field);
  });
};

// Every name in the builder state that must resolve to a *schema* column of the loaded entity.
//
// Deliberately excludes the two places a name refers to a query output rather than a catalog column:
// `having` is evaluated against the select outputs, and aggregate-mode sort keys address computed
// aliases. Checking either against the schema would flag correct queries — a `Count` alias is not
// meant to be a column of the source.
export const referencedSchemaFields = (state: QueryBuilderState): string[] => {
  const names: string[] = [];

  collectPredicateFields(state.filter, names);

  if (state.mode === QueryMode.Row) {
    state.select.forEach((name) => names.push(name));
    state.sort.forEach((sort) => {
      if (sort.field) names.push(sort.field);
    });
  } else {
    state.groupBy.forEach((row) => {
      if (!row.fn) {
        if (row.field) names.push(row.field);
        return;
      }
      // Only an expression argument carries a field; a literal argument slot holds `literal` instead.
      row.args.forEach((arg) => {
        if (arg.field) names.push(arg.field);
      });
    });
    state.aggregates.forEach((row) =>
      row.args.forEach((arg) => {
        if (arg.field) names.push(arg.field);
      }),
    );
  }

  return [...new Set(names)];
};

// The names the caller's own resolved schema does not account for — a column dropped from the catalog
// and one this caller may not see are the same answer here, and are repaired the same way.
//
// An empty field list means the schema has not resolved yet (loading, or a failed fetch), not that
// every reference is broken: judging against it would flag an entire query on a transient failure.
export const unresolvedFieldNames = (state: QueryBuilderState): string[] => {
  if (!state.fields.length) return [];
  const known = new Set(state.fields.map((field) => field.name));
  return referencedSchemaFields(state).filter((name) => !known.has(name));
};
