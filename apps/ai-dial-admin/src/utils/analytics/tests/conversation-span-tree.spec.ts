import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  ConversationSpanRow,
  HopEventSeed,
  HopEventType,
  HopNodeKind,
  HopTreeNode,
} from '@/src/models/analytics/conversations-trace';
import {
  buildSpanTree,
  categoriesOf,
  countMatchingNodes,
  countMatchableNodes,
  flattenHopTree,
  markMatchingNodes,
} from '@/src/utils/analytics/conversation-span-tree';

const hop = (core_span_id: string, overrides: Partial<ConversationSpanRow> = {}): ConversationSpanRow =>
  ({
    core_span_id,
    core_parent_span_id: null,
    event_kind: 'llm_call',
    deployment: core_span_id,
    request_uri: `/openai/deployments/${core_span_id}/chat/completions`,
    response_status: 200,
    success: true,
    total_tokens: 10,
    reasoning_tokens: 0,
    deployment_price: '0.001',
    request_time: 1000,
    response_body_bytes: 4096,
    ...overrides,
  }) as ConversationSpanRow;

const seed = (span: ConversationSpanRow, type: HopEventType, label = span.core_span_id): HopEventSeed => ({
  span,
  type,
  label,
});

// One text event per hop unless a test says otherwise, so nesting is readable without every case restating it.
const withOneSeedEach = (hops: ConversationSpanRow[]): Map<string, HopEventSeed[]> =>
  new Map(hops.map((span) => [span.core_span_id, [seed(span, HopEventType.Text)]]));

const build = (hops: ConversationSpanRow[], seedsByHopId = withOneSeedEach(hops)): HopTreeNode[] =>
  buildSpanTree({ hops, seedsByHopId });

const hopsOf = (nodes: HopTreeNode[]): HopTreeNode[] => nodes.filter(({ kind }) => kind === HopNodeKind.Hop);

const labelsInOrder = (nodes: HopTreeNode[]): string[] =>
  nodes.flatMap((node) => [node.label, ...labelsInOrder(node.children)]);

// Every fixture hop emits one same-named event, so a label alone appears twice — these read the hops only.
const hopLabelsInOrder = (nodes: HopTreeNode[]): string[] =>
  nodes.flatMap((node) => [...(node.kind === HopNodeKind.Hop ? [node.label] : []), ...hopLabelsInOrder(node.children)]);

const findNode = (nodes: HopTreeNode[], label: string): HopTreeNode | undefined => {
  for (const node of nodes) {
    if (node.label === label) {
      return node;
    }
    const found = findNode(node.children, label);
    if (found) {
      return found;
    }
  }

  return undefined;
};

describe('buildSpanTree', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // A hop that called another deployment is not a peer of the call it made.
  test('nests a hop under the hop its parent span id names', () => {
    const tree = build([hop('parent'), hop('child', { core_parent_span_id: 'parent' })]);

    expect(tree).toHaveLength(1);
    expect(hopsOf(tree[0].children).map(({ label }) => label)).toEqual(['child']);
  });

  test('orders siblings by the time each was recorded', () => {
    const tree = build([
      hop('root'),
      hop('late', { core_parent_span_id: 'root', request_time: 9000 }),
      hop('early', { core_parent_span_id: 'root', request_time: 2000 }),
    ]);

    expect(hopsOf(tree[0].children).map(({ label }) => label)).toEqual(['early', 'late']);
  });

  test('orders top-level hops by the time each was recorded', () => {
    const tree = build([hop('late', { request_time: 9000 }), hop('early', { request_time: 2000 })]);

    expect(hopsOf(tree).map(({ label }) => label)).toEqual(['early', 'late']);
  });

  // An event is not a peer of the hop that emitted it: one model call and its events stop reading as peers.
  test('hangs a hop events off it as leaves, in the order they were produced', () => {
    const span = hop('model');
    const tree = build(
      [span],
      new Map([
        [
          'model',
          [
            seed(span, HopEventType.Thinking),
            seed(span, HopEventType.Text),
            seed(span, HopEventType.ToolCall, 'rag_search'),
          ],
        ],
      ]),
    );

    expect(tree[0].children.map(({ type, kind }) => [kind, type])).toEqual([
      [HopNodeKind.Event, HopEventType.Thinking],
      [HopNodeKind.Event, HopEventType.Text],
      [HopNodeKind.Event, HopEventType.ToolCall],
    ]);
    expect(tree[0].children.every(({ children }) => children.length === 0)).toBe(true);
  });

  // The log gives an event no id, so one is derived from the hop that emitted it and its place in that hop.
  test('derives an event id from its hop and its position in that hop', () => {
    const span = hop('model');
    const tree = build(
      [span],
      new Map([['model', [seed(span, HopEventType.Text), seed(span, HopEventType.ToolCall)]]]),
    );

    expect(tree[0].children.map(({ id }) => id)).toEqual(['model:event:0', 'model:event:1']);
  });

  test('puts a hop own events before the hops it went on to call', () => {
    const parent = hop('parent');
    const tree = build(
      [parent, hop('child', { core_parent_span_id: 'parent' })],
      new Map([
        ['parent', [seed(parent, HopEventType.Text), seed(parent, HopEventType.ToolCall, 'rag_search')]],
        ['child', []],
      ]),
    );

    expect(tree[0].children.map(({ kind }) => kind)).toEqual([HopNodeKind.Event, HopNodeKind.Event, HopNodeKind.Hop]);
  });

  // The page is capped at 300 spans and a trace can hold thousands, so a parent can simply not be there.
  test('keeps a hop whose parent is absent from the page at the top level', () => {
    const tree = build([hop('root'), hop('orphan', { core_parent_span_id: 'never-loaded' })]);

    expect(
      hopsOf(tree)
        .map(({ label }) => label)
        .sort(),
    ).toEqual(['orphan', 'root']);
    expect(findNode(tree, 'orphan')?.depth).toBe(0);
  });

  // Losing a recorded hop to a structural accident is worse than showing it at the wrong depth.
  test('renders every hop of a circular parent chain', () => {
    const tree = build([
      hop('a', { core_parent_span_id: 'b' }),
      hop('b', { core_parent_span_id: 'a' }),
      hop('c', { core_parent_span_id: 'b' }),
    ]);

    expect(hopLabelsInOrder(tree).sort()).toEqual(['a', 'b', 'c']);
  });

  test('recovers a hop skipped at the depth cap rather than dropping it', () => {
    const chain = Array.from({ length: 12 }, (_, index) =>
      hop(`h${index}`, index === 0 ? {} : { core_parent_span_id: `h${index - 1}` }),
    );

    const tree = build(chain);

    expect(hopLabelsInOrder(tree)).toHaveLength(12);
  });
});

describe('buildSpanTree — an unrecorded root', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  const ORPHANS = [
    hop('a', { core_parent_span_id: 'never-recorded', execution_path: ['deployment-name-stage', 'a'] }),
    hop('b', { core_parent_span_id: 'never-recorded', execution_path: ['deployment-name-stage', 'b'] }),
  ];

  // Presenting the orphaned children as unrelated top-level hops would assert a structure the data contradicts.
  test('names a placeholder root from the first segment of a child execution path', () => {
    const tree = build(ORPHANS);

    expect(tree).toHaveLength(1);
    expect(tree[0].kind).toBe(HopNodeKind.UnrecordedRoot);
    expect(tree[0].label).toBe('deployment-name-stage');
  });

  test('marks the placeholder as standing for no recorded hop, and puts the turn work beneath it', () => {
    const [root] = build(ORPHANS);

    expect(root.span).toBeNull();
    expect(hopsOf(root.children).map(({ label }) => label)).toEqual(['a', 'b']);
  });

  // 0.27% of traces record no root at all, so nothing about the ordinary presentation may be shaped around it.
  test('adds no placeholder when the trace recorded a root of its own', () => {
    const tree = build([hop('root', { execution_path: ['stage'] }), hop('child', { core_parent_span_id: 'root' })]);

    expect(tree.every(({ kind }) => kind === HopNodeKind.Hop)).toBe(true);
  });

  // The path never supplies a parent the pointer lacks — naming is its only use — so with no path there is
  // nothing to name, and hoisting is the honest fallback.
  test('hoists the orphans instead when no child recorded an execution path', () => {
    const tree = build([hop('a', { core_parent_span_id: 'gone' }), hop('b', { core_parent_span_id: 'gone' })]);

    expect(tree.every(({ kind }) => kind === HopNodeKind.Hop)).toBe(true);
    expect(hopsOf(tree)).toHaveLength(2);
  });

  test('a turn that recorded no hops produces no tree at all', () => {
    expect(build([])).toEqual([]);
  });
});

describe('buildSpanTree — the single-event collapse', () => {
  // A hop that emitted exactly one event and that another hop nests under, so the collapse cannot apply and
  // the hop's own category is what it derives from that one event.
  const orchestrating = (type: HopEventType): HopTreeNode[] => {
    const parent = hop('parent', { event_kind: 'mcp' });
    const child = hop('child', { core_parent_span_id: 'parent', event_kind: 'embedding', request_time: 2000 });

    return buildSpanTree({
      hops: [parent, child],
      seedsByHopId: new Map([
        ['parent', [seed(parent, type)]],
        ['child', [seed(child, HopEventType.Embedding)]],
      ]),
    });
  };

  // Every hop kind but a multi-event model call emits exactly one event, so without the collapse each renders
  // as a hop row and an event row carrying the same name.
  test('renders a hop that emitted one event and has no children as a single node', () => {
    const span = hop('embed', { event_kind: 'embedding', deployment: 'text-embedding-3' });
    const tree = buildSpanTree({
      hops: [span],
      seedsByHopId: new Map([['embed', [seed(span, HopEventType.Embedding, 'text-embedding-3')]]]),
    });

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toEqual([]);
    expect(labelsInOrder(tree)).toEqual(['text-embedding-3']);
  });

  test('gives the collapsed node the event type and label, and keeps the hop own figures', () => {
    const span = hop('mcp', { event_kind: 'mcp', total_tokens: 42, deployment: 'statgpt-rag' });
    const [node] = buildSpanTree({
      hops: [span],
      seedsByHopId: new Map([['mcp', [seed(span, HopEventType.ToolResult, 'rag_search')]]]),
    });

    expect(node.kind).toBe(HopNodeKind.Hop);
    expect(node.type).toBe(HopEventType.ToolResult);
    expect(node.label).toBe('rag_search');
    expect(node.tokens).toBe(42);
    expect(node.cost).toBe('0.001');
    expect(node.span).not.toBeNull();
  });

  // More than one thing to group, so there is something for the grouping node to be.
  test('keeps its own node for a call that emitted several events, categorised as a model call', () => {
    const span = hop('model');
    const [node] = buildSpanTree({
      hops: [span],
      seedsByHopId: new Map([['model', [seed(span, HopEventType.Text), seed(span, HopEventType.ToolCall, 'rag')]]]),
    });

    expect(node.type).toBe(HopEventType.ModelCall);
    expect(node.children.map(({ type }) => type)).toEqual([HopEventType.Text, HopEventType.ToolCall]);
  });

  // Children are calls the hop made, not things it emitted, so they need no row of their own to hang from —
  // and exempting a hop because it has children would put the duplicate back on exactly the orchestrating
  // calls a reader opens the tree to understand.
  test('is still one node when hops nest under it, with those hops beneath that same node', () => {
    const [node] = orchestrating(HopEventType.Text);

    expect(node.type).toBe(HopEventType.Text);
    expect(node.children.map(({ kind, type }) => [kind, type])).toEqual([[HopNodeKind.Hop, HopEventType.Embedding]]);
  });

  // Derived, never assumed. Today every hop with children is an `llm_call` — 16 of 16 sampled — so these
  // shapes have to be constructed: a deployment growing an MCP or embedding call into an orchestrating one is
  // a change in someone else's service, and it must not need a release here to be labelled correctly.
  test.each([
    ['an MCP call', HopEventType.ToolResult],
    ['an embedding call', HopEventType.Embedding],
    ['a failed call', HopEventType.Error],
  ])('keeps %s own category when it acquires a child rather than reading as a model call', (_name, type) => {
    const [node] = orchestrating(type);

    expect(node.type).toBe(type);
  });

  // The only kind that emits several events, so it is the only category the derivation has to add.
  test('categorises a hop that emitted several events as a model call', () => {
    const span = hop('model');
    const [node] = buildSpanTree({
      hops: [span, hop('child', { core_parent_span_id: 'model', event_kind: 'embedding', request_time: 2000 })],
      seedsByHopId: new Map([
        ['model', [seed(span, HopEventType.Text), seed(span, HopEventType.ToolCall, 'rag')]],
        ['child', []],
      ]),
    });

    expect(node.type).toBe(HopEventType.ModelCall);
  });

  test('counts a collapsed call once', () => {
    const span = hop('embed', { event_kind: 'embedding' });
    const tree = buildSpanTree({
      hops: [span],
      seedsByHopId: new Map([['embed', [seed(span, HopEventType.Embedding)]]]),
    });

    expect(countMatchableNodes(tree)).toBe(1);
    expect(countMatchingNodes(markMatchingNodes(tree, HopEventType.Embedding))).toBe(1);
  });

  // One recorded event, one match — not the hop and an event child sharing a category and reporting two.
  test('counts a one-event orchestrating call once', () => {
    const tree = orchestrating(HopEventType.Error);

    expect(countMatchableNodes(tree)).toBe(2);
    expect(countMatchingNodes(markMatchingNodes(tree, HopEventType.Error))).toBe(1);
  });
});

describe('buildSpanTree — positions', () => {
  // A multi-event root, which keeps its events as children, over a chain of one-event hops, which absorb
  // theirs — so the numbering is exercised across both shapes.
  const TREE = () => {
    const root = hop('root');

    return build(
      [
        root,
        hop('child', { core_parent_span_id: 'root', request_time: 2000 }),
        hop('grandchild', { core_parent_span_id: 'child', request_time: 3000 }),
      ],
      new Map([['root', [seed(root, HopEventType.Thinking, 'thinking'), seed(root, HopEventType.Text, 'answer')]]]),
    );
  };

  // Depth-first over the whole tree, so a node's place in the turn is stated wherever the reader is.
  test('numbers every node by depth-first order over the whole tree', () => {
    const tree = TREE();

    expect(labelsInOrder(tree)).toEqual(['root', 'thinking', 'answer', 'child', 'grandchild']);
    expect(tree[0].position).toBe(1);
    expect(findNode(tree, 'child')?.position).toBe(4);
    expect(findNode(tree, 'grandchild')?.position).toBe(5);
  });

  test('assigns each node the depth it renders at', () => {
    const tree = TREE();

    expect(tree[0].depth).toBe(0);
    expect(findNode(tree, 'answer')?.depth).toBe(1);
    expect(findNode(tree, 'child')?.depth).toBe(1);
    expect(findNode(tree, 'grandchild')?.depth).toBe(2);
  });

  // As a render-time counter this would be a standing bug waiting for the first filter.
  test('keeps a node position when a category is emphasised', () => {
    const marked = markMatchingNodes(TREE(), HopEventType.Text);

    expect(findNode(marked, 'grandchild')?.position).toBe(5);
    expect(findNode(marked, 'child')?.position).toBe(4);
  });
});

describe('markMatchingNodes', () => {
  const TREE = () => {
    const model = hop('model');
    const mcp = hop('mcp', { core_parent_span_id: 'model', event_kind: 'mcp', request_time: 2000 });

    return buildSpanTree({
      hops: [model, mcp],
      seedsByHopId: new Map([
        ['model', [seed(model, HopEventType.Text), seed(model, HopEventType.ToolCall, 'rag_search')]],
        ['mcp', [seed(mcp, HopEventType.ToolResult, 'rag_search')]],
      ]),
    });
  };

  // Marking, not pruning: no node is removed, so the structure can never be broken by narrowing.
  test('marks the emphasised category and removes nothing', () => {
    const tree = TREE();
    const marked = markMatchingNodes(tree, HopEventType.ToolCall);

    expect(countMatchableNodes(marked)).toBe(countMatchableNodes(tree));
    expect(countMatchingNodes(marked)).toBe(1);
    expect(findNode(marked, 'rag_search')?.isMatch).toBe(true);
  });

  // A hop that kept a node of its own is a call making calls, categorised as such — so emphasising the text it
  // produced marks the text, and emphasising the call marks the call.
  test('marks a hop that kept its own node when the model-call category is emphasised', () => {
    expect(findNode(markMatchingNodes(TREE(), HopEventType.ModelCall), 'model')?.isMatch).toBe(true);
    expect(findNode(markMatchingNodes(TREE(), HopEventType.Text), 'model')?.isMatch).toBe(false);
  });

  test('returns every node to no emphasis when no category is emphasised', () => {
    const marked = markMatchingNodes(markMatchingNodes(TREE(), HopEventType.Text), null);

    expect(countMatchingNodes(marked)).toBe(0);
  });

  // A call that collapsed into its single event is one node, so the total it is counted against does not
  // double-count it.
  test('counts the turn matchable nodes, hops included', () => {
    const tree = TREE();

    // The model call, its two events, and the MCP call collapsed into its own single result.
    expect(countMatchableNodes(tree)).toBe(4);
  });
});

describe('categoriesOf', () => {
  const treeWith = (types: HopEventType[]): HopTreeNode[] => {
    const span = hop('model');

    return buildSpanTree({
      hops: [span],
      seedsByHopId: new Map([['model', types.map((type) => seed(span, type))]]),
    });
  };

  // Under dimming, a control for a category the turn has none of would dim every node and mark none.
  test('offers only the categories the turn recorded', () => {
    expect(categoriesOf(treeWith([HopEventType.Text, HopEventType.Error]))).toEqual([
      // The call kept its node, because it emitted more than one event.
      HopEventType.ModelCall,
      HopEventType.Text,
      HopEventType.Error,
    ]);
  });

  test('leaves a category the turn recorded none of out of the set', () => {
    expect(categoriesOf(treeWith([HopEventType.Text]))).not.toContain(HopEventType.Embedding);
  });

  // `FILTERABLE_EVENT_TYPES` stops being the rendered set and becomes the order the present ones come in.
  test('returns the present categories in the offered order, not the recorded one', () => {
    expect(categoriesOf(treeWith([HopEventType.Error, HopEventType.ToolCall, HopEventType.Text]))).toEqual([
      HopEventType.ModelCall,
      HopEventType.Text,
      HopEventType.ToolCall,
      HopEventType.Error,
    ]);
  });

  test('offers nothing for a turn with no hops', () => {
    expect(categoriesOf([])).toEqual([]);
  });
});

describe('flattenHopTree', () => {
  const expandAll = (nodes: HopTreeNode[]): HopTreeNode[] =>
    nodes.map((node) => ({ ...node, expanded: true, children: expandAll(node.children) }));

  const TREE = () =>
    build([
      hop('root'),
      hop('first', { core_parent_span_id: 'root', request_time: 2000 }),
      hop('under-first', { core_parent_span_id: 'first', request_time: 3000 }),
      hop('last', { core_parent_span_id: 'root', request_time: 4000 }),
    ]);

  test('emits one row per visible node', () => {
    const rows = flattenHopTree(expandAll(TREE()));

    expect(rows.map(({ node }) => node.label)).toEqual(labelsInOrder(TREE()));
  });

  test('stops at a collapsed node, leaving its descendants out of the rows', () => {
    const tree = expandAll(TREE());
    const collapsed = tree.map((node) => ({
      ...node,
      children: node.children.map((child) => (child.label === 'first' ? { ...child, expanded: false } : child)),
    }));

    const labels = flattenHopTree(collapsed).map(({ node }) => node.label);

    expect(labels).toContain('first');
    expect(labels).not.toContain('under-first');
  });

  test('keeps a node position when its ancestor is collapsed', () => {
    const rows = flattenHopTree(TREE().map((node) => ({ ...node, expanded: false })));

    expect(rows.map(({ node }) => node.position)).toEqual([1]);
  });

  // A root draws no rails and a depth-1 row draws only its own elbow, so a root's sibling state gets no column.
  test('gives a root no rail columns and a depth-1 row none but its elbow', () => {
    const rows = flattenHopTree(expandAll(TREE()));
    const rowFor = (label: string) => rows.find(({ node }) => node.label === label);

    expect(rowFor('root')?.ancestorHasNextSibling).toEqual([]);
    expect(rowFor('first')?.ancestorHasNextSibling).toEqual([]);
  });

  // A continuing line where the ancestor owning that column still has siblings below it.
  test('continues a rail past a row whose ancestor has siblings below', () => {
    const rows = flattenHopTree(expandAll(TREE()));
    const under = rows.find(({ node }) => node.label === 'under-first');

    expect(under?.ancestorHasNextSibling).toEqual([true]);
    expect(under?.isLastChild).toBe(true);
  });

  test('reports whether a row is the last of its siblings', () => {
    const rows = flattenHopTree(expandAll(TREE()));

    expect(rows.find(({ node }) => node.label === 'last')?.isLastChild).toBe(true);
  });
});
