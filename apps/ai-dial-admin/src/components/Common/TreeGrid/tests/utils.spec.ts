import { describe, expect, test, vi, beforeEach } from 'vitest';
import {
  buildTreeFromParentPointer,
  flattenTree,
  findRowInTree,
  overlayExpandedState,
  updateRowInTree,
} from '../utils';
import { TreeRow } from '../types';

type Row = { name: string; parent: string | null; value?: number };

const opts = {
  getId: (r: Row) => r.name,
  getParentId: (r: Row) => r.parent,
};

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('buildTreeFromParentPointer', () => {
  test('empty input returns empty array', () => {
    expect(buildTreeFromParentPointer([], opts)).toEqual([]);
  });

  test('single root row', () => {
    const rows: Row[] = [{ name: 'a', parent: null }];
    const tree = buildTreeFromParentPointer(rows, opts);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('a:');
    expect(tree[0].depth).toBe(0);
    expect(tree[0].parentId).toBeNull();
    expect(tree[0].children).toHaveLength(0);
    expect(tree[0].expanded).toBe(false);
  });

  test('linear chain a → b → c produces nested tree', () => {
    const rows: Row[] = [
      { name: 'a', parent: null },
      { name: 'b', parent: 'a' },
      { name: 'c', parent: 'b' },
    ];
    const tree = buildTreeFromParentPointer(rows, opts);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('a:');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe('b:a');
    expect(tree[0].children[0].depth).toBe(1);
    expect(tree[0].children[0].children[0].id).toBe('c:b');
    expect(tree[0].children[0].children[0].depth).toBe(2);
  });

  test('branching: a → b and a → c', () => {
    const rows: Row[] = [
      { name: 'a', parent: null },
      { name: 'b', parent: 'a' },
      { name: 'c', parent: 'a' },
    ];
    const tree = buildTreeFromParentPointer(rows, opts);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(2);
    const childIds = tree[0].children.map((c) => c.name);
    expect(childIds).toContain('b');
    expect(childIds).toContain('c');
  });

  test('multiple independent roots', () => {
    const rows: Row[] = [
      { name: 'a', parent: null },
      { name: 'b', parent: null },
    ];
    const tree = buildTreeFromParentPointer(rows, opts);
    expect(tree).toHaveLength(2);
  });

  test('cycle a → b, b → a: drops back-edge and warns', () => {
    const rows: Row[] = [
      { name: 'a', parent: 'b' },
      { name: 'b', parent: 'a' },
    ];
    const tree = buildTreeFromParentPointer(rows, opts);
    // One of them becomes root with the other as child — no infinite loop
    expect(tree.length).toBeGreaterThanOrEqual(1);
    // total nodes in tree = 2
    const all = flattenTree(tree.map((r) => ({ ...r, expanded: true })));
    expect(all).toHaveLength(2);
    expect(console.warn).toHaveBeenCalled();
  });

  test('depth cap at maxDepth=2: nodes beyond cap not nested', () => {
    // chain a→b→c→d (d would be depth 3)
    const rows: Row[] = [
      { name: 'a', parent: null },
      { name: 'b', parent: 'a' },
      { name: 'c', parent: 'b' },
      { name: 'd', parent: 'c' },
    ];
    const tree = buildTreeFromParentPointer(rows, { ...opts, maxDepth: 2 });
    // a(0) → b(1) → c(2) — d dropped
    const all = flattenTree(tree.map((r) => ({ ...r, expanded: true })));
    expect(all).toHaveLength(3); // a, b, c — d dropped
    expect(console.warn).toHaveBeenCalled();
  });

  test('orphan with unknown parent becomes a root', () => {
    const rows: Row[] = [{ name: 'b', parent: 'a' }];
    const tree = buildTreeFromParentPointer(rows, opts);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('b');
    expect(tree[0].depth).toBe(0);
  });

  test('input rows with `synthetic: true` propagate to the built tree row', () => {
    type R = { name: string; parent: string | null; synthetic?: boolean };
    const rows: R[] = [
      { name: 'a', parent: null, synthetic: true },
      { name: 'b', parent: 'a' },
    ];
    const tree = buildTreeFromParentPointer(rows, {
      getId: (r) => r.name,
      getParentId: (r) => r.parent,
    });
    expect(tree[0].synthetic).toBe(true);
    expect(tree[0].children[0].synthetic).toBeUndefined();
  });

  test('path-based tree: same deployment name in distinct execution paths stays distinct', () => {
    // gpt-4o appears under two different routes — each is its own tree node, keyed by
    // its full execution_path. Without execution_path the composite (name, parent_name)
    // would collide for "gpt-4o:router" across both apps.
    type R = { execution_path: string };
    const rows: R[] = [
      { execution_path: 'app-A' },
      { execution_path: 'app-A/router' },
      { execution_path: 'app-A/router/gpt-4o' },
      { execution_path: 'app-B' },
      { execution_path: 'app-B/router' },
      { execution_path: 'app-B/router/gpt-4o' },
    ];
    const tree = buildTreeFromParentPointer(rows, {
      getId: (r) => r.execution_path,
      getParentId: (r) => {
        const i = r.execution_path.lastIndexOf('/');
        return i === -1 ? null : r.execution_path.slice(0, i);
      },
    });
    expect(tree).toHaveLength(2);
    expect(tree.map((r) => r.id).sort()).toEqual(['app-A:', 'app-B:']);
    // Each app has its own router → gpt-4o chain
    expect(tree[0].children[0].children[0].id).toBe('app-A/router/gpt-4o:app-A/router');
    expect(tree[1].children[0].children[0].id).toBe('app-B/router/gpt-4o:app-B/router');
  });

  test('same deployment under multiple parents builds separate nodes with children intact', () => {
    // gpt-4o appears as a direct call (parent=null) AND as a child of app-A
    // child-model is always called by gpt-4o
    // With the old rowById keyed only by name, gpt-4o(parent=app-A) would overwrite gpt-4o(parent=null)
    // causing child-model to lose its parent link
    const rows: Row[] = [
      { name: 'gpt-4o', parent: null }, // gpt-4o direct
      { name: 'gpt-4o', parent: 'app-A' }, // gpt-4o via app-A
      { name: 'app-A', parent: null }, // app-A direct
      { name: 'child-model', parent: 'gpt-4o' }, // called by gpt-4o (both instances)
    ];
    const tree = buildTreeFromParentPointer(rows, opts);

    // Two roots: gpt-4o(direct) and app-A(direct)
    expect(tree).toHaveLength(2);

    const gpt4oRoot = tree.find((r) => r.name === 'gpt-4o' && r.parentId === null);
    expect(gpt4oRoot).toBeDefined();
    // gpt-4o (direct) should have child-model as a child
    expect(gpt4oRoot!.children).toHaveLength(1);
    expect(gpt4oRoot!.children[0].name).toBe('child-model');

    const appA = tree.find((r) => r.name === 'app-A');
    expect(appA).toBeDefined();
    // app-A has gpt-4o(via app-A) as a child, which itself has child-model
    expect(appA!.children).toHaveLength(1);
    expect(appA!.children[0].name).toBe('gpt-4o');
  });
});

describe('flattenTree', () => {
  test('collapsed root hides children', () => {
    const tree: TreeRow<Row>[] = [
      {
        name: 'a',
        parent: null,
        id: 'a:',
        parentId: null,
        depth: 0,
        expanded: false,
        children: [
          {
            name: 'b',
            parent: 'a',
            id: 'b:a',
            parentId: 'a',
            depth: 1,
            expanded: false,
            children: [],
          },
        ],
      },
    ];
    expect(flattenTree(tree)).toHaveLength(1);
  });

  test('expanded root emits children before next sibling', () => {
    const tree: TreeRow<Row>[] = [
      {
        name: 'a',
        parent: null,
        id: 'a:',
        parentId: null,
        depth: 0,
        expanded: true,
        children: [{ name: 'b', parent: 'a', id: 'b:a', parentId: 'a', depth: 1, expanded: false, children: [] }],
      },
      { name: 'c', parent: null, id: 'c:', parentId: null, depth: 0, expanded: false, children: [] },
    ];
    const flat = flattenTree(tree);
    expect(flat.map((r) => r.name)).toEqual(['a', 'b', 'c']);
  });
});

describe('updateRowInTree', () => {
  test('updates the matching row by id', () => {
    const tree: TreeRow<Row>[] = [
      {
        name: 'a',
        parent: null,
        id: 'a:',
        parentId: null,
        depth: 0,
        expanded: false,
        children: [{ name: 'b', parent: 'a', id: 'b:a', parentId: 'a', depth: 1, expanded: false, children: [] }],
      },
    ];
    const updated = updateRowInTree(tree, 'b:a', (r) => ({ ...r, expanded: true }));
    expect(updated[0].children[0].expanded).toBe(true);
    expect(updated[0].expanded).toBe(false); // parent unchanged
  });
});

describe('findRowInTree', () => {
  test('finds nested row by id', () => {
    const tree: TreeRow<Row>[] = [
      {
        name: 'a',
        parent: null,
        id: 'a:',
        parentId: null,
        depth: 0,
        expanded: false,
        children: [{ name: 'b', parent: 'a', id: 'b:a', parentId: 'a', depth: 1, expanded: false, children: [] }],
      },
    ];
    expect(findRowInTree(tree, 'b:a')?.name).toBe('b');
    expect(findRowInTree(tree, 'missing')).toBeUndefined();
  });
});

describe('overlayExpandedState', () => {
  test('applies prev expanded state to new tree', () => {
    const tree: TreeRow<Row>[] = [
      { name: 'a', parent: null, id: 'a:', parentId: null, depth: 0, expanded: false, children: [] },
    ];
    const prev = new Map([['a:', true]]);
    const result = overlayExpandedState(tree, prev);
    expect(result[0].expanded).toBe(true);
  });

  test('leaves untouched rows with no prev entry', () => {
    const tree: TreeRow<Row>[] = [
      { name: 'a', parent: null, id: 'a:', parentId: null, depth: 0, expanded: false, children: [] },
    ];
    expect(overlayExpandedState(tree, new Map())[0].expanded).toBe(false);
  });

  test('recurses into children', () => {
    const tree: TreeRow<Row>[] = [
      {
        name: 'a',
        parent: null,
        id: 'a:',
        parentId: null,
        depth: 0,
        expanded: true,
        children: [{ name: 'b', parent: 'a', id: 'b:a', parentId: 'a', depth: 1, expanded: false, children: [] }],
      },
    ];
    const prev = new Map([['b:a', true]]);
    const result = overlayExpandedState(tree, prev);
    expect(result[0].children[0].expanded).toBe(true);
  });
});
