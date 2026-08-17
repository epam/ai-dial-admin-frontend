import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import {
  ComparisonNode,
  ComparisonOp,
  Expr,
  ExprType,
  FilterNode,
  LogicalNode,
  LogicalOp,
  StructuredQuery,
  ValueType,
} from '@/src/models/evaluation/structured-query';
import { TestCaseItemType } from '@/src/types/evaluation';
import { and, col, eq, field, fn, offsetPage, rowQuery, value } from '@/src/utils/structured-query/build';
import { v4 as uuidv4 } from 'uuid';

import {
  ARRAY_RUN_CONDITION_OPERATOR_OPTIONS,
  BASE_RUN_CONDITION_FIELDS,
  DATA_FIELD_PREFIX,
  INCLUDED_IDS_PAGE_SIZE,
  RUN_CONDITION_OPERATOR_OPTIONS,
} from './constants';
import {
  RunConditionFieldOption,
  RunConditionFilter,
  RunConditionLogicalOp,
  RunConditionOperator,
  RunConditionPredicate,
} from './models';

const COMPARISON_OPS = new Set<string>(Object.values(ComparisonOp));
const RUN_CONDITION_OPS = new Set<string>(Object.values(RunConditionOperator));

const LEGACY_FIELD_ALIASES: Record<string, string> = {
  testCaseName: 'test_case_name',
};

const normalizeFieldName = (fieldName: string): string => LEGACY_FIELD_ALIASES[fieldName] ?? fieldName;

export const getRunConditionFieldOptions = (schema?: TestCaseSchema[]): RunConditionFieldOption[] => {
  const schemaFields = (schema ?? []).map((item) => ({
    field: `${DATA_FIELD_PREFIX}${item.name}`,
    displayName: item.name,
    isArray: item.type === TestCaseItemType.ARRAY,
  }));
  return [...BASE_RUN_CONDITION_FIELDS, ...schemaFields];
};

export const getRunConditionOperatorOptions = (isArray: boolean) =>
  isArray ? ARRAY_RUN_CONDITION_OPERATOR_OPTIONS : RUN_CONDITION_OPERATOR_OPTIONS;

/** Coerce Equal/NotEqual to Contain — only used when the field is already known to be an array. */
export const sanitizeRunConditionOperator = (operator: RunConditionOperator): RunConditionOperator =>
  operator === RunConditionOperator.Contain || operator === RunConditionOperator.NotContains
    ? operator
    : RunConditionOperator.Contain;

const isComparisonNode = (node: FilterNode): node is ComparisonNode => COMPARISON_OPS.has(node.op);

const isLogicalNode = (node: FilterNode): node is LogicalNode =>
  node.op === LogicalOp.And || node.op === LogicalOp.Or || node.op === LogicalOp.Not;

const usesArrayContains = (isArray: boolean, operator: RunConditionOperator): boolean =>
  isArray && (operator === RunConditionOperator.Contain || operator === RunConditionOperator.NotContains);

const predicateToComparison = (
  fieldName: string,
  predicate: RunConditionPredicate,
  isArray: boolean,
): ComparisonNode => {
  const normalized = normalizeFieldName(fieldName);
  const leftExpr = usesArrayContains(isArray, predicate.operator)
    ? fn('lower', [field(normalized)])
    : field(normalized);
  return {
    op: predicate.operator as unknown as ComparisonOp,
    args: [leftExpr, value(ValueType.String, predicate.value)],
  };
};

const filterToNode = (filter: RunConditionFilter): FilterNode | null => {
  const predicates = filter.predicates.filter((p) => p.value.trim() !== '');
  if (predicates.length === 0) {
    return null;
  }
  if (predicates.length === 1) {
    return predicateToComparison(filter.field, predicates[0], filter.isArray);
  }
  return {
    op: filter.logicalOp as unknown as LogicalOp,
    args: predicates.map((p) => predicateToComparison(filter.field, p, filter.isArray)),
  };
};

export const serializeRunConditionFilters = (filters: RunConditionFilter[]): FilterNode | null => {
  const nodes = filters.map(filterToNode).filter((n): n is FilterNode => n != null);
  if (nodes.length === 0) {
    return null;
  }
  if (nodes.length === 1) {
    return nodes[0];
  }
  return { op: LogicalOp.And, args: nodes };
};

const comparisonToPredicate = (node: ComparisonNode): RunConditionPredicate | null => {
  if (!RUN_CONDITION_OPS.has(node.op)) {
    return null;
  }
  const right = node.args[1];
  if (!right || right.type !== ExprType.Value) {
    return null;
  }
  return {
    operator: node.op as unknown as RunConditionOperator,
    value: right.value ?? '',
  };
};

const getComparisonFieldName = (node: ComparisonNode): string | null => {
  const left = node.args[0];
  if (!left) {
    return null;
  }
  if (left.type === ExprType.Field) {
    return left.name ? normalizeFieldName(left.name) : null;
  }
  if (left.type === ExprType.Fn && left.name === 'lower' && left.args[0]?.type === ExprType.Field) {
    return left.args[0].name ? normalizeFieldName(left.args[0].name) : null;
  }
  return null;
};

const fieldDisplayName = (fieldName: string, options: RunConditionFieldOption[]): string =>
  options.find((o) => o.field === fieldName)?.displayName ?? fieldName.replace(DATA_FIELD_PREFIX, '');

const fieldIsArray = (fieldName: string, options: RunConditionFieldOption[]): boolean =>
  options.find((o) => o.field === fieldName)?.isArray ?? fieldName.startsWith(DATA_FIELD_PREFIX);

const groupToFilter = (
  fieldName: string,
  predicates: RunConditionPredicate[],
  logicalOp: RunConditionLogicalOp,
  options: RunConditionFieldOption[],
): RunConditionFilter => ({
  id: uuidv4(),
  field: fieldName,
  displayName: fieldDisplayName(fieldName, options),
  isArray: fieldIsArray(fieldName, options) || predicates.length > 1,
  logicalOp,
  predicates,
});

const nodeToFilters = (node: FilterNode, options: RunConditionFieldOption[]): RunConditionFilter[] => {
  if (isComparisonNode(node)) {
    const fieldName = getComparisonFieldName(node);
    const predicate = comparisonToPredicate(node);
    if (!fieldName || !predicate) {
      return [];
    }
    return [groupToFilter(fieldName, [predicate], RunConditionLogicalOp.And, options)];
  }

  if (!isLogicalNode(node) || node.op === LogicalOp.Not) {
    return [];
  }

  const logicalOp = node.op === LogicalOp.Or ? RunConditionLogicalOp.Or : RunConditionLogicalOp.And;
  const comparisons = node.args.filter(isComparisonNode);
  const nested = node.args.filter((arg) => !isComparisonNode(arg));

  if (comparisons.length === node.args.length && comparisons.length > 0) {
    const fieldNames = comparisons.map(getComparisonFieldName);
    const sameField = fieldNames.every((name) => name != null && name === fieldNames[0]);
    if (sameField && fieldNames[0]) {
      const predicates = comparisons.map(comparisonToPredicate).filter((p): p is RunConditionPredicate => p != null);
      if (predicates.length > 0) {
        return [groupToFilter(fieldNames[0], predicates, logicalOp, options)];
      }
    }
  }

  return [
    ...comparisons.flatMap((c) => nodeToFilters(c, options)),
    ...nested.flatMap((n) => nodeToFilters(n, options)),
  ];
};

export const deserializeRunConditionFilters = (
  filter: FilterNode | null | undefined,
  schema?: TestCaseSchema[],
): RunConditionFilter[] => {
  if (!filter) {
    return [];
  }
  return nodeToFilters(filter, getRunConditionFieldOptions(schema));
};

const rewriteFilterFields = (node: FilterNode): FilterNode => {
  if (isComparisonNode(node)) {
    const left = node.args[0];
    if (left?.type === ExprType.Field) {
      return {
        ...node,
        args: [{ ...left, name: normalizeFieldName(left.name) }, ...node.args.slice(1)],
      };
    }
    return node;
  }
  return {
    ...node,
    args: node.args.map(rewriteFilterFields),
  };
};

export const buildIncludedIdsQuery = (datasetId: string, filter: FilterNode | null | undefined): StructuredQuery => {
  const datasetEq = eq('dataset_id', ValueType.Uuid, datasetId);
  const normalizedFilter = filter ? rewriteFilterFields(filter) : null;
  const combinedFilter = normalizedFilter ? and([datasetEq, normalizedFilter]) : datasetEq;

  return rowQuery({
    entity: 'test_cases',
    select: [col(field('id'))],
    filter: combinedFilter,
    page: offsetPage(0, INCLUDED_IDS_PAGE_SIZE, false),
  });
};

export const parseIncludedIds = (rows: Record<string, unknown>[] | null | undefined): Set<string> => {
  const ids = new Set<string>();
  (rows ?? []).forEach((row) => {
    const id = row.id;
    if (id != null) {
      ids.add(String(id));
    }
  });
  return ids;
};

export const resolveRowFieldValue = (row: Record<string, unknown>, fieldName: string): unknown => {
  const normalized = normalizeFieldName(fieldName);
  if (normalized === 'id') {
    return row.id;
  }
  if (normalized === 'test_case_name') {
    return row.testCaseName ?? row.test_case_name;
  }
  if (normalized.startsWith(DATA_FIELD_PREFIX)) {
    const dataField = normalized.slice(DATA_FIELD_PREFIX.length);
    const rowData = row.data as Record<string, unknown> | undefined;
    return rowData?.[dataField] ?? row[dataField];
  }
  return row[normalized];
};

const parseArrayValue = (value: unknown): unknown[] | null => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
  }
  return null;
};

const scalarContains = (left: unknown, right: string): boolean => {
  if (left == null) {
    return false;
  }
  return String(left).toLowerCase().includes(right.toLowerCase());
};

const arrayContainsElement = (left: unknown, right: string): boolean => {
  const parsed = parseArrayValue(left);
  if (parsed != null) {
    return parsed.some((item) => scalarContains(item, right));
  }
  return scalarContains(left, right);
};

const arrayNotContainsElement = (left: unknown, right: string): boolean => !arrayContainsElement(left, right);

const getFieldNameFromLeftExpr = (expr: Expr): string | null => {
  if (expr.type === ExprType.Field) {
    return expr.name ? normalizeFieldName(expr.name) : null;
  }
  if (expr.type === ExprType.Fn && expr.name === 'lower' && expr.args[0]?.type === ExprType.Field) {
    return expr.args[0].name ? normalizeFieldName(expr.args[0].name) : null;
  }
  return null;
};

const evaluateComparison = (
  node: ComparisonNode,
  row: Record<string, unknown>,
  fieldOptions: RunConditionFieldOption[],
): boolean => {
  const leftExpr = node.args[0];
  const rightExpr = node.args[1];
  if (!leftExpr || !rightExpr || rightExpr.type !== ExprType.Value) {
    return false;
  }
  const fieldName = getFieldNameFromLeftExpr(leftExpr);
  if (!fieldName) {
    return false;
  }
  const rightValue = rightExpr.value ?? '';
  const leftValue = resolveRowFieldValue(row, fieldName);
  const isArray =
    fieldOptions.find((option) => option.field === fieldName)?.isArray ?? fieldName.startsWith(DATA_FIELD_PREFIX);

  switch (node.op) {
    case ComparisonOp.Co:
      return isArray ? arrayContainsElement(leftValue, rightValue) : scalarContains(leftValue, rightValue);
    case ComparisonOp.Nc:
      return isArray ? arrayNotContainsElement(leftValue, rightValue) : !scalarContains(leftValue, rightValue);
    case ComparisonOp.Eq:
      return String(leftValue ?? '') === rightValue;
    case ComparisonOp.Ne:
      return String(leftValue ?? '') !== rightValue;
    default:
      return false;
  }
};

export const rowMatchesFilter = (
  row: Record<string, unknown>,
  filter: FilterNode,
  schema?: TestCaseSchema[],
): boolean => {
  const fieldOptions = getRunConditionFieldOptions(schema);

  if (isComparisonNode(filter)) {
    return evaluateComparison(filter, row, fieldOptions);
  }
  if (!isLogicalNode(filter)) {
    return false;
  }
  if (filter.op === LogicalOp.Not) {
    const child = filter.args[0];
    return child ? !rowMatchesFilter(row, child, schema) : false;
  }
  if (filter.op === LogicalOp.And) {
    return filter.args.every((arg) => rowMatchesFilter(row, arg, schema));
  }
  return filter.args.some((arg) => rowMatchesFilter(row, arg, schema));
};

export const computeIncludedIdsFromRows = (
  rows: Record<string, unknown>[],
  filter: FilterNode | null | undefined,
  schema?: TestCaseSchema[],
): Set<string> | null => {
  if (!filter) {
    return null;
  }
  const rowsById = new Map<string, Record<string, unknown>[]>();
  rows.forEach((row) => {
    if (row.id == null) {
      return;
    }
    const id = String(row.id);
    const group = rowsById.get(id) ?? [];
    group.push(row);
    rowsById.set(id, group);
  });
  const ids = new Set<string>();
  rowsById.forEach((group, id) => {
    if (group.every((row) => rowMatchesFilter(row, filter, schema))) {
      ids.add(id);
    }
  });
  return ids;
};

export const createEmptyRunConditionFilter = (): RunConditionFilter => ({
  id: uuidv4(),
  field: '',
  displayName: '',
  isArray: false,
  logicalOp: RunConditionLogicalOp.And,
  predicates: [{ operator: RunConditionOperator.Contain, value: '' }],
});

export const getOperatorIcon = (operator: RunConditionOperator) =>
  RUN_CONDITION_OPERATOR_OPTIONS.find((o) => o.value === operator)?.icon;

export const isRunConditionFilterComplete = (filter: RunConditionFilter): boolean =>
  filter.field.trim() !== '' && filter.predicates.some((p) => p.value.trim() !== '');
