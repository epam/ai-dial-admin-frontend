import { describe, expect, test } from 'vitest';

import {
  ConversationSpanRow,
  HopFactsShape,
  HopNodeKind,
  HopOutcomeFilter,
  HopTreeNode,
  SpanKind,
} from '@/src/models/analytics/conversations-trace';
import {
  buildHopTree,
  countMatchingNodes,
  countMatchableNodes,
  flattenHopTree,
  hasFailedNodes,
  kindsOf,
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
    number_request_messages: 3,
    deployment_price: '0.001',
    operation_duration_ms: 1200,
    request_time: 1000,
    response_body_bytes: 4096,
    ...overrides,
  }) as ConversationSpanRow;

const labelsInOrder = (nodes: HopTreeNode[]): string[] =>
  nodes.flatMap((node) => [node.label, ...labelsInOrder(node.children)]);

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

const countNodes = (nodes: HopTreeNode[]): number =>
  nodes.reduce((total, { children }) => total + 1 + countNodes(children), 0);

describe('buildHopTree', () => {
  test('renders exactly one node per recorded hop', () => {
    const tree = buildHopTree([hop('root'), hop('child', { core_parent_span_id: 'root' })]);

    expect(countNodes(tree)).toBe(2);
  });

  test('nests a hop under the hop its parent span id names', () => {
    const tree = buildHopTree([hop('root'), hop('child', { core_parent_span_id: 'root' })]);

    expect(tree).toHaveLength(1);
    expect(tree[0].label).toBe('root');
    expect(tree[0].children.map(({ label }) => label)).toEqual(['child']);
  });

  test('names a node by the deployment that did the work rather than by its MCP method', () => {
    const tree = buildHopTree([
      hop('a', { event_kind: 'mcp', deployment: 'first-toolset', mcp_method: 'initialize' }),
      hop('b', { event_kind: 'mcp', deployment: 'second-toolset', mcp_method: 'initialize', request_time: 1001 }),
    ]);

    expect(labelsInOrder(tree)).toEqual(['first-toolset', 'second-toolset']);
  });

  test('states what an MCP hop did beside who did it', () => {
    const tree = buildHopTree([hop('a', { event_kind: 'mcp', deployment: 'toolset', mcp_method: 'tools/list' })]);

    expect(tree[0].label).toBe('toolset');
    expect(tree[0].detail).toBe('tools/list');
  });

  test('prefers the tool a hop called over the protocol method', () => {
    const tree = buildHopTree([
      hop('a', { event_kind: 'mcp', deployment: 'toolset', mcp_method: 'tools/call', mcp_tool_call_name: 'search' }),
    ]);

    expect(tree[0].detail).toBe('search');
  });

  test('keeps a node for every MCP protocol message of one toolset', () => {
    const tree = buildHopTree([
      hop('a', { event_kind: 'mcp', deployment: 'toolset', mcp_method: 'initialize' }),
      hop('b', {
        event_kind: 'mcp',
        deployment: 'toolset',
        mcp_method: 'notifications/initialized',
        request_time: 1001,
      }),
      hop('c', { event_kind: 'mcp', deployment: 'toolset', mcp_method: 'tools/list', request_time: 1002 }),
    ]);

    expect(countNodes(tree)).toBe(3);
  });

  test('falls back to the request URI and then the span id when no deployment is recorded', () => {
    const tree = buildHopTree([
      hop('a', { deployment: null, request_uri: '/some/endpoint' }),
      hop('b', { deployment: null, request_uri: null, request_time: 1001 }),
    ]);

    expect(labelsInOrder(tree)).toEqual(['/some/endpoint', 'b']);
  });

  describe('kinds', () => {
    test('types an application call by the call rather than by the callee', () => {
      const tree = buildHopTree([
        hop('app', {
          deployment: 'applications/public/an-app__1.0.0',
          request_uri: '/openai/deployments/applications/public/an-app__1.0.0/chat/completions',
        }),
      ]);

      expect(tree[0].type).toBe(SpanKind.Llm);
    });

    test('types a route hop as a route', () => {
      const tree = buildHopTree([hop('r', { event_kind: 'route', request_uri: '/v1/deployments/x/route/search' })]);

      expect(tree[0].type).toBe(SpanKind.Route);
    });

    test('types a rating hop by its endpoint', () => {
      const tree = buildHopTree([hop('rate', { event_kind: '', request_uri: '/v1/a-deployment/rate' })]);

      expect(tree[0].type).toBe(SpanKind.Rating);
    });

    test('types an unrecognised event kind generically rather than dropping the hop', () => {
      const tree = buildHopTree([hop('x', { event_kind: 'rerank', request_uri: '/v1/rerank' })]);

      expect(tree).toHaveLength(1);
      expect(tree[0].type).toBe(SpanKind.Other);
    });

    test('types a hop with no event kind but a model endpoint as an LLM call', () => {
      const tree = buildHopTree([hop('m', { event_kind: '' })]);

      expect(tree[0].type).toBe(SpanKind.Llm);
    });
  });

  describe('facts', () => {
    test('states tokens, request messages and cost for a hop that metered its own', () => {
      const tree = buildHopTree([hop('m')]);

      expect(tree[0].facts).toEqual({
        shape: HopFactsShape.Metered,
        tokens: 10,
        requestMessages: 3,
        cost: '0.001',
      });
    });

    test('states the chain cost for a hop that metered nothing of its own', () => {
      const tree = buildHopTree([hop('app', { total_tokens: 0, deployment_price: null, total_price: '0.0375' })]);

      expect(tree[0].facts).toEqual({ shape: HopFactsShape.Unmetered, chainCost: '0.0375' });
    });

    test('states no figures for a hop that metered nothing and spent nothing', () => {
      const tree = buildHopTree([hop('m', { total_tokens: 0, deployment_price: null, total_price: null })]);

      expect(tree[0].facts).toBeNull();
    });

    test('carries the hop recorded duration on the node', () => {
      const tree = buildHopTree([hop('m', { operation_duration_ms: 2500 })]);

      expect(tree[0].durationMs).toBe(2500);
    });
  });

  describe('route hops', () => {
    test('renders a route hop as the parent of the hops nesting under it', () => {
      const tree = buildHopTree([
        hop('app'),
        hop('route', { event_kind: 'route', core_parent_span_id: 'app', request_time: 1001 }),
        hop('emb1', { event_kind: 'embedding', core_parent_span_id: 'route', request_time: 1002 }),
        hop('emb2', { event_kind: 'embedding', core_parent_span_id: 'route', request_time: 1003 }),
      ]);

      const routeNode = findNode(tree, 'route');
      expect(routeNode?.children.map(({ label }) => label)).toEqual(['emb1', 'emb2']);
      expect(tree.map(({ label }) => label)).toEqual(['app']);
    });

    test('renders every hop of a turn whose rows all record an empty conversation id', () => {
      const tree = buildHopTree([
        hop('a', { chat_id: '' } as Partial<ConversationSpanRow>),
        hop('b', { core_parent_span_id: 'a', request_time: 1001 }),
        hop('c', { event_kind: 'route', core_parent_span_id: 'a', request_time: 1002 }),
      ]);

      expect(countNodes(tree)).toBe(3);
    });
  });

  describe('structure the data does not supply', () => {
    test('keeps a hop whose parent is absent from the loaded page at the top level', () => {
      const tree = buildHopTree([hop('a'), hop('orphan', { core_parent_span_id: 'missing', request_time: 1001 })]);

      expect(tree.map(({ label }) => label)).toEqual(['a', 'orphan']);
    });

    test('renders every hop of a circular parent chain', () => {
      const tree = buildHopTree([
        hop('a', { core_parent_span_id: 'b' }),
        hop('b', { core_parent_span_id: 'a', request_time: 1001 }),
      ]);

      expect(countNodes(tree)).toBe(2);
    });

    test('names an unrecorded root from the first segment of a child execution path', () => {
      const tree = buildHopTree([
        hop('child', { core_parent_span_id: 'never-recorded', execution_path: ['an-entry-point', 'child'] }),
      ]);

      expect(tree).toHaveLength(1);
      expect(tree[0].label).toBe('an-entry-point');
      expect(tree[0].kind).toBe(HopNodeKind.UnrecordedRoot);
      expect(tree[0].children.map(({ label }) => label)).toEqual(['child']);
    });

    test('gives the unrecorded root no kind and no figures', () => {
      const tree = buildHopTree([
        hop('child', { core_parent_span_id: 'never-recorded', execution_path: ['an-entry-point', 'child'] }),
      ]);

      expect(tree[0].type).toBeNull();
      expect(tree[0].span).toBeNull();
      expect(tree[0].facts).toBeNull();
      expect(tree[0].durationMs).toBeNull();
    });
  });

  describe('ordering and positions', () => {
    test('orders siblings by recorded request time', () => {
      const tree = buildHopTree([
        hop('root'),
        hop('late', { core_parent_span_id: 'root', request_time: 3000 }),
        hop('early', { core_parent_span_id: 'root', request_time: 2000 }),
      ]);

      expect(tree[0].children.map(({ label }) => label)).toEqual(['early', 'late']);
    });

    test('renders a three-level chain at its recorded depths', () => {
      const tree = buildHopTree([
        hop('app'),
        hop('sub-app', { core_parent_span_id: 'app', request_time: 1001 }),
        hop('model', { core_parent_span_id: 'sub-app', request_time: 1002 }),
      ]);

      expect(tree[0].depth).toBe(0);
      expect(tree[0].children[0].depth).toBe(1);
      expect(tree[0].children[0].children[0].depth).toBe(2);
    });

    test('numbers positions depth-first over the whole tree', () => {
      const tree = buildHopTree([
        hop('root'),
        hop('child', { core_parent_span_id: 'root', request_time: 1001 }),
        hop('sibling', { request_time: 1002 }),
      ]);

      expect(tree[0].position).toBe(1);
      expect(tree[0].children[0].position).toBe(2);
      expect(tree[1].position).toBe(3);
    });

    // The numbering answers "where in the turn is this", so narrowing or folding the view must not renumber
    // what is left — a row's place in the turn is not a place in the current viewport.
    test('positions survive emphasis and collapsing', () => {
      const tree = buildHopTree([
        hop('root'),
        hop('child', { event_kind: 'mcp', core_parent_span_id: 'root', mcp_method: 'tools/list', request_time: 1001 }),
        hop('sibling', { request_time: 1002 }),
      ]);
      const positions = (nodes: HopTreeNode[]): number[] =>
        nodes.flatMap((node) => [node.position, ...positions(node.children)]);

      const emphasised = markMatchingNodes(tree, SpanKind.Mcp);
      const collapsed = tree.map((node) => ({ ...node, expanded: false }));

      expect(positions(tree)).toEqual([1, 2, 3]);
      expect(positions(emphasised)).toEqual([1, 2, 3]);
      expect(flattenHopTree(collapsed).map(({ node }) => node.position)).toEqual([1, 3]);
    });

    test('returns nothing for a turn that recorded no hops', () => {
      expect(buildHopTree([])).toEqual([]);
    });
  });

  describe('failure', () => {
    test('keeps a failed hop kind and marks it failed', () => {
      const tree = buildHopTree([hop('bad', { response_status: 500, success: false })]);

      expect(tree[0].type).toBe(SpanKind.Llm);
      expect(tree[0].isFailed).toBe(true);
    });

    test('keeps the children of a failed hop', () => {
      const tree = buildHopTree([
        hop('bad', { success: false }),
        hop('child', { core_parent_span_id: 'bad', request_time: 1001 }),
      ]);

      expect(tree[0].isFailed).toBe(true);
      expect(tree[0].children.map(({ label }) => label)).toEqual(['child']);
    });
  });
});

describe('markMatchingNodes', () => {
  const tree = buildHopTree([
    hop('model'),
    hop('toolset', { event_kind: 'mcp', mcp_method: 'tools/list', request_time: 1001 }),
    hop('bad', { success: false, request_time: 1002 }),
  ]);

  test('marks only the nodes of the emphasised kind', () => {
    const marked = markMatchingNodes(tree, SpanKind.Mcp);

    expect(marked.filter(({ isMatch }) => isMatch).map(({ label }) => label)).toEqual(['toolset']);
  });

  test('marks every failed node whatever its kind on the outcome axis', () => {
    const marked = markMatchingNodes(tree, HopOutcomeFilter.Failed);

    expect(marked.filter(({ isMatch }) => isMatch).map(({ label }) => label)).toEqual(['bad']);
  });

  test('marks nothing when no kind is emphasised', () => {
    expect(countMatchingNodes(markMatchingNodes(tree, null))).toBe(0);
  });

  test('removes no node when a kind is emphasised', () => {
    expect(countNodes(markMatchingNodes(tree, SpanKind.Mcp))).toBe(countNodes(tree));
  });
});

describe('kindsOf', () => {
  test('returns only the kinds the turn recorded, in the offered order', () => {
    const tree = buildHopTree([
      hop('toolset', { event_kind: 'mcp', mcp_method: 'tools/list' }),
      hop('model', { request_time: 1001 }),
    ]);

    expect(kindsOf(tree)).toEqual([SpanKind.Llm, SpanKind.Mcp]);
  });

  test('omits the unrecorded root, which carries no kind', () => {
    const tree = buildHopTree([
      hop('child', { core_parent_span_id: 'never-recorded', execution_path: ['an-entry-point', 'child'] }),
    ]);

    expect(kindsOf(tree)).toEqual([SpanKind.Llm]);
  });
});

describe('countMatchableNodes', () => {
  test('counts every node that carries a kind', () => {
    const tree = buildHopTree([hop('a'), hop('b', { request_time: 1001 })]);

    expect(countMatchableNodes(tree)).toBe(2);
  });

  test('does not count the unrecorded root', () => {
    const tree = buildHopTree([
      hop('child', { core_parent_span_id: 'never-recorded', execution_path: ['an-entry-point', 'child'] }),
    ]);

    expect(countMatchableNodes(tree)).toBe(1);
  });
});

describe('hasFailedNodes', () => {
  test('reports a failure recorded anywhere in the tree', () => {
    const tree = buildHopTree([
      hop('root'),
      hop('child', { core_parent_span_id: 'root', success: false, request_time: 1001 }),
    ]);

    expect(hasFailedNodes(tree)).toBe(true);
  });

  test('reports no failure when every hop succeeded', () => {
    expect(hasFailedNodes(buildHopTree([hop('a')]))).toBe(false);
  });
});

describe('flattenHopTree', () => {
  test('omits the descendants of a collapsed node', () => {
    const tree = buildHopTree([hop('root'), hop('child', { core_parent_span_id: 'root', request_time: 1001 })]);

    expect(flattenHopTree(tree).map(({ node }) => node.label)).toEqual(['root']);
  });

  test('includes the descendants of an expanded node', () => {
    const tree = buildHopTree([hop('root'), hop('child', { core_parent_span_id: 'root', request_time: 1001 })]);
    const expanded = tree.map((node) => ({ ...node, expanded: true }));

    expect(flattenHopTree(expanded).map(({ node }) => node.label)).toEqual(['root', 'child']);
  });

  test('marks the last child of a parent', () => {
    const tree = buildHopTree([
      hop('root'),
      hop('first', { core_parent_span_id: 'root', request_time: 1001 }),
      hop('second', { core_parent_span_id: 'root', request_time: 1002 }),
    ]);
    const expanded = tree.map((node) => ({ ...node, expanded: true }));

    expect(flattenHopTree(expanded).map(({ isLastChild }) => isLastChild)).toEqual([true, false, true]);
  });
});
