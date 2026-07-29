import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import {
  ComparisonNode,
  ComparisonOp,
  ExprType,
  FilterNode,
  LogicalNode,
  LogicalOp,
  StructuredQuery,
  ValueType,
} from '@/src/models/evaluation/structured-query';
import { TestCaseItemType } from '@/src/types/evaluation';
import { and, col, eq, field, offsetPage, rowQuery, value } from '@/src/utils/structured-query/build';
import { v4 as uuidv4 } from 'uuid';

import {
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

const isComparisonNode = (node: FilterNode): node is ComparisonNode => COMPARISON_OPS.has(node.op);

const isLogicalNode = (node: FilterNode): node is LogicalNode =>
  node.op === LogicalOp.And || node.op === LogicalOp.Or || node.op === LogicalOp.Not;

const predicateToComparison = (fieldName: string, predicate: RunConditionPredicate): ComparisonNode => ({
  op: predicate.operator as unknown as ComparisonOp,
  args: [field(normalizeFieldName(fieldName)), value(ValueType.String, predicate.value)],
});

const filterToNode = (filter: RunConditionFilter): FilterNode | null => {
  const predicates = filter.predicates.filter((p) => p.value.trim() !== '');
  if (predicates.length === 0) {
    return null;
  }
  if (predicates.length === 1) {
    return predicateToComparison(filter.field, predicates[0]);
  }
  return {
    op: filter.logicalOp as unknown as LogicalOp,
    args: predicates.map((p) => predicateToComparison(filter.field, p)),
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
  if (!left || left.type !== ExprType.Field) {
    return null;
  }
  return left.name ? normalizeFieldName(left.name) : null;
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
