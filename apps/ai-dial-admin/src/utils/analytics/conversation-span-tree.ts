import { TreeRow } from '@/src/components/Common/TreeGrid/types';
import { buildTreeFromParentPointer } from '@/src/components/Common/TreeGrid/utils';
import { FILTERABLE_EVENT_TYPES } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationSpanRow,
  HopEmphasis,
  HopEventSeed,
  HopEventType,
  HopNodeData,
  HopNodeKind,
  HopOutcomeFilter,
  HopTreeNode,
  HopTreeRow,
} from '@/src/models/analytics/conversations-trace';
import { toMillis } from '@/src/utils/analytics/conversation-formatting';
import { isFailedHop, spanLabelOf } from '@/src/utils/analytics/conversation-spans';
import { toNumber } from '@/src/utils/analytics/scalar';

type SpanTreeRow = TreeRow<ConversationSpanRow>;

const byStartTime = (left: ConversationSpanRow, right: ConversationSpanRow): number =>
  (toMillis(left.request_time) ?? 0) - (toMillis(right.request_time) ?? 0);

const isRootHop = ({ core_parent_span_id }: ConversationSpanRow): boolean => !core_parent_span_id?.trim();

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

const eventNodesOf = (seeds: HopEventSeed[], hopId: string): HopTreeNode[] =>
  seeds.map((seed, index) =>
    nodeOf(
      {
        kind: HopNodeKind.Event,
        type: seed.type,
        label: seed.label,
        detail: seed.detail ?? null,
        span: seed.span,
        startedAtMs: null,
        tokens: null,
        reasoningTokens: seed.reasoningTokens ?? null,
        cost: null,
        hasNoRecordedResult: seed.hasNoRecordedResult ?? false,
        isFailed: isFailedHop(seed.span),
        position: 0,
        isMatch: false,
      },
      `${seed.span.core_span_id}:event:${index}`,
      hopId,
      [],
    ),
  );

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

const unrecordedRootOf = (name: string, children: HopTreeNode[]): HopTreeNode =>
  nodeOf(
    {
      kind: HopNodeKind.UnrecordedRoot,
      type: null,
      label: name,
      detail: null,
      span: null,
      startedAtMs: null,
      tokens: null,
      reasoningTokens: null,
      cost: null,
      hasNoRecordedResult: false,
      isFailed: false,
      position: 0,
      isMatch: false,
    },
    `unrecorded-root:${name}`,
    null,
    children,
  );

const categoryOf = (seeds: HopEventSeed[]): HopEventType => {
  if (seeds.length === 1) {
    return seeds[0].type;
  }
  if (seeds.length === 0) {
    return HopEventType.Other;
  }

  return HopEventType.ModelCall;
};

export interface SpanTreeParams {
  hops: ConversationSpanRow[];
  seedsByHopId: Map<string, HopEventSeed[]>;
}

export const buildSpanTree = ({ hops, seedsByHopId }: SpanTreeParams): HopTreeNode[] => {
  const spanTree = sortSiblings(
    buildTreeFromParentPointer(hops, {
      getId: ({ core_span_id }) => core_span_id,
      getParentId: ({ core_parent_span_id }) => core_parent_span_id,
    }),
  );

  const toHopNode = (row: SpanTreeRow): HopTreeNode => {
    const seeds = seedsByHopId.get(row.core_span_id) ?? [];
    const isFailed = isFailedHop(row);
    const childHops = row.children.map(toHopNode);
    const hop: HopNodeData = {
      kind: HopNodeKind.Hop,
      type: categoryOf(seeds),
      label: spanLabelOf(row),
      detail: null,
      span: seeds[0]?.span ?? row,
      startedAtMs: toMillis(row.request_time),
      tokens: toNumber(row.total_tokens),
      reasoningTokens: null,
      cost: row.deployment_price,
      hasNoRecordedResult: false,
      isFailed,
      position: 0,
      isMatch: false,
    };

    const [onlySeed] = seeds;
    if (seeds.length === 1) {
      return nodeOf(
        {
          ...hop,
          label: onlySeed.label,
          detail: onlySeed.detail ?? null,
          reasoningTokens: onlySeed.reasoningTokens ?? null,
          hasNoRecordedResult: onlySeed.hasNoRecordedResult ?? false,
        },
        row.id,
        row.parentId,
        childHops,
      );
    }

    return nodeOf(hop, row.id, row.parentId, [...eventNodesOf(seeds, row.id), ...childHops]);
  };

  const roots = spanTree.map(toHopNode);

  const name = hops.length > 0 && !hops.some(isRootHop) ? unrecordedRootNameOf(spanTree) : null;

  return withPositions(name === null ? roots : [unrecordedRootOf(name, roots)]);
};

// Emphasis is one of two axes: a kind, matched against the node's type, or the outcome axis, matched against
// the node's recorded failure whatever kind it was.
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

export const categoriesOf = (tree: HopTreeNode[]): HopEventType[] => {
  const present = new Set<HopEventType>();

  const walk = (nodes: HopTreeNode[]) => {
    for (const { type, children } of nodes) {
      if (type !== null) {
        present.add(type);
      }
      walk(children);
    }
  };
  walk(tree);

  return FILTERABLE_EVENT_TYPES.filter((type) => present.has(type));
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
