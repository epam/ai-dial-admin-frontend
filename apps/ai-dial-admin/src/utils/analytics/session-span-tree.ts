import { TreeRow } from '@/src/components/Common/TreeGrid/types';
import { buildTreeFromParentPointer } from '@/src/components/Common/TreeGrid/utils';
import { FILTERABLE_SPAN_KINDS, RATING_SIGNATURE_FIELDS } from '@/src/constants/analytics/sessions-trace';
import {
  SessionFeedbackRow,
  SessionSpanRow,
  HopEmphasis,
  HopNodeData,
  HopNodeKind,
  HopOutcomeFilter,
  HopTreeNode,
  HopTreeRow,
  ResponseRatingsField,
  SpanFieldGroup,
  SpanKind,
} from '@/src/models/analytics/sessions-trace';
import { toMillis } from '@/src/utils/analytics/session-formatting';
import { hopFactsOf, isFailedHop, spanKindOf, spanLabelOf, spanPhaseOf } from '@/src/utils/analytics/session-spans';
import { toNumber } from '@/src/utils/analytics/scalar';
import { ratingEnrichmentOf } from '@/src/utils/analytics/sessions-source';

type SpanTreeRow = TreeRow<SessionSpanRow>;

const byStartTime = (left: SessionSpanRow, right: SessionSpanRow): number =>
  (toMillis(left.request_time) ?? 0) - (toMillis(right.request_time) ?? 0);

const isRootHop = ({ core_parent_span_id }: SessionSpanRow): boolean => !core_parent_span_id?.trim();

const sortSiblings = (rows: SpanTreeRow[]): SpanTreeRow[] =>
  [...rows].sort(byStartTime).map((row) => ({ ...row, children: sortSiblings(row.children) }));

const nodeOf = (data: HopNodeData, id: string, parentId: string | null, children: HopTreeNode[]): HopTreeNode => ({
  ...data,
  id,
  parentId,
  depth: 0,
  expanded: false,
  children,
});

const withPositions = (tree: HopTreeNode[]): HopTreeNode[] => {
  let position = 0;

  const walk = (nodes: HopTreeNode[], depth: number): HopTreeNode[] =>
    nodes.map((node) => {
      position += 1;

      return { ...node, depth, position, children: walk(node.children, depth + 1) };
    });

  return walk(tree, 0);
};

const unrecordedRootNameOf = (roots: SpanTreeRow[]): string | null => {
  for (const root of roots) {
    const name = root.execution_path?.[0]?.trim();
    if (name) {
      return name;
    }
  }

  return null;
};

// The one node standing for no hop, and so the one node carrying no kind: naming a kind would assert what
// kind of call it was on no evidence. It states in words what it is instead, and it matches no filter.
const unrecordedRootOf = (name: string, children: HopTreeNode[]): HopTreeNode =>
  nodeOf(
    {
      kind: HopNodeKind.UnrecordedRoot,
      type: null,
      label: name,
      detail: null,
      span: null,
      startedAtMs: null,
      durationMs: null,
      facts: null,
      isFailed: false,
      position: 0,
      isMatch: false,
    },
    `unrecorded-root:${name}`,
    null,
    children,
  );

// One hop, one node. Nothing decoded from the hop's body reaches here: the row states what the call was and
// what it recorded, and the inspector answers what came back from it.
const hopNodeOf = (row: SpanTreeRow): HopTreeNode =>
  nodeOf(
    {
      kind: HopNodeKind.Hop,
      type: spanKindOf(row),
      label: spanLabelOf(row),
      detail: spanPhaseOf(row),
      span: row,
      startedAtMs: toMillis(row.request_time),
      durationMs: toNumber(row.operation_duration_ms),
      facts: hopFactsOf(row),
      isFailed: isFailedHop(row),
      position: 0,
      isMatch: false,
    },
    row.id,
    row.parentId,
    row.children.map(hopNodeOf),
  );

// No hop is excluded for the kind of call it was — `route` hops included. They sit inside session traces
// and parent other hops, so excluding one hoists its children to the top level and destroys the structure the
// reader opened the trace to see. Background route calls are roots of their own traces, which the trace-id
// scope already keeps out.
export const buildHopTree = (spans: SessionSpanRow[]): HopTreeNode[] => {
  const hops = [...spans].sort(byStartTime);

  const spanTree = sortSiblings(
    buildTreeFromParentPointer(hops, {
      getId: ({ core_span_id }) => core_span_id,
      getParentId: ({ core_parent_span_id }) => core_parent_span_id,
    }),
  );

  const roots = spanTree.map(hopNodeOf);

  const name = hops.length > 0 && !hops.some(isRootHop) ? unrecordedRootNameOf(spanTree) : null;

  return withPositions(name === null ? roots : [unrecordedRootOf(name, roots)]);
};

// Emphasis is one of two axes: a kind of call, matched against the node's kind, or the outcome axis, matched
// against the node's recorded failure whatever kind it was.
export const markMatchingNodes = (tree: HopTreeNode[], emphasis: HopEmphasis | null): HopTreeNode[] =>
  tree.map((node) => ({
    ...node,
    isMatch: isEmphasised(node, emphasis),
    children: markMatchingNodes(node.children, emphasis),
  }));

const isEmphasised = (node: HopTreeNode, emphasis: HopEmphasis | null): boolean => {
  if (emphasis === null) {
    return false;
  }

  if (emphasis === HopOutcomeFilter.Failed) {
    return node.isFailed;
  }

  return node.type === emphasis;
};

export const countMatchableNodes = (tree: HopTreeNode[]): number =>
  tree.reduce((total, { type, children }) => total + (type === null ? 0 : 1) + countMatchableNodes(children), 0);

export const countMatchingNodes = (tree: HopTreeNode[]): number =>
  tree.reduce((total, { isMatch, children }) => total + (isMatch ? 1 : 0) + countMatchingNodes(children), 0);

// Whether the turn recorded any failure at all — which is what decides whether the outcome axis gets a
// control. A control the turn has nothing for would dim every node and mark none.
export const hasFailedNodes = (tree: HopTreeNode[]): boolean =>
  tree.some(({ isFailed, children }) => isFailed || hasFailedNodes(children));

export const kindsOf = (tree: HopTreeNode[]): SpanKind[] => {
  const present = new Set<SpanKind>();

  const walk = (nodes: HopTreeNode[]) => {
    for (const { type, children } of nodes) {
      if (type !== null) {
        present.add(type);
      }
      walk(children);
    }
  };
  walk(tree);

  return FILTERABLE_SPAN_KINDS.filter((kind) => present.has(kind));
};

export const flattenHopTree = (tree: HopTreeNode[]): HopTreeRow[] => {
  const rows: HopTreeRow[] = [];

  const walk = (nodes: HopTreeNode[], ancestorHasNextSibling: boolean[], depth: number) => {
    nodes.forEach((node, index) => {
      const isLastChild = index === nodes.length - 1;
      rows.push({ node, ancestorHasNextSibling, isLastChild });

      if (node.expanded && node.children.length > 0) {
        walk(node.children, depth === 0 ? [] : [...ancestorHasNextSibling, !isLastChild], depth + 1);
      }
    });
  };
  walk(tree, [], 0);

  return rows;
};

export const spanRatingNamespaceOf = (fieldGroups: SpanFieldGroup[] = []): string | null =>
  ratingEnrichmentOf(
    fieldGroups.flatMap(({ fields }) => fields.map(({ name, type }) => ({ name, type, source: name }))),
  );

export const isSpanCommentTextReadable = (fieldGroups: SpanFieldGroup[], namespace: string | null): boolean =>
  namespace !== null &&
  fieldGroups.some(({ fields }) =>
    fields.some(({ name }) => name === `${namespace}.${ResponseRatingsField.CommentSample}`),
  );

export const spanFeedbackOf = (span: SessionSpanRow, namespace: string): SessionFeedbackRow | null => {
  const row = span as unknown as Record<string, unknown>;
  const read = <T>(fieldName: ResponseRatingsField): T | null => (row[`${namespace}.${fieldName}`] ?? null) as T | null;

  if (RATING_SIGNATURE_FIELDS.every((fieldName) => read(fieldName as ResponseRatingsField) === null)) {
    return null;
  }

  const comment = row[`${namespace}.${ResponseRatingsField.CommentSample}`];

  return {
    response_id: span.response_id ?? null,
    first_rate_time: read(ResponseRatingsField.FirstRateTime),
    last_rate_time: read(ResponseRatingsField.LastRateTime),
    rate_pos_count: read(ResponseRatingsField.RatePosCount),
    rate_zero_count: read(ResponseRatingsField.RateZeroCount),
    rate_neg_count: read(ResponseRatingsField.RateNegCount),
    rate_distinct_count: read(ResponseRatingsField.RateDistinctCount),
    comment_count: read(ResponseRatingsField.CommentCount),
    ...(comment === undefined ? {} : { comment_sample: comment as string | null }),
  };
};

export const attributeFeedbackToSpans = (
  tree: HopTreeNode[],
  namespace: string | null,
): Map<string, SessionFeedbackRow> => {
  const bySpanId = new Map<string, SessionFeedbackRow>();
  if (!namespace) {
    return bySpanId;
  }

  const placed = new Set<string>();
  let level = tree;
  while (level.length) {
    for (const { span } of level) {
      const responseId = span?.response_id;
      const row = span && responseId && !placed.has(responseId) ? spanFeedbackOf(span, namespace) : null;
      if (span && responseId && row) {
        placed.add(responseId);
        bySpanId.set(span.core_span_id, row);
      }
    }
    level = level.flatMap(({ children }) => children);
  }

  return bySpanId;
};
