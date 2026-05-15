import { ColDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { collectLeafStates, getGroupCheckState, toggleColDefNode } from '../utils';

// ─── toggleColDefNode ────────────────────────────────────────────────────────

describe('TreeColumnsPanel :: toggleColDefNode', () => {
  test('returns tree unchanged when path is empty', () => {
    const tree: ColDef[] = [{ field: 'a', hide: false }];
    expect(toggleColDefNode(tree, [], true)).toBe(tree);
  });

  test('hides a top-level leaf', () => {
    const tree: ColDef[] = [{ field: 'a' }, { field: 'b' }];
    const result = toggleColDefNode(tree, [0], true);
    expect(result[0].hide).toBe(true);
    expect(result[1].hide).toBeUndefined();
  });

  test('shows a top-level leaf', () => {
    const tree: ColDef[] = [{ field: 'a', hide: true }, { field: 'b', hide: true }];
    const result = toggleColDefNode(tree, [1], false);
    expect(result[0].hide).toBe(true);
    expect(result[1].hide).toBe(false);
  });

  test('does not mutate the original tree', () => {
    const node: ColDef = { field: 'a', hide: false };
    const tree: ColDef[] = [node];
    toggleColDefNode(tree, [0], true);
    expect(node.hide).toBe(false);
  });

  test('hides a group node and all its leaf descendants recursively', () => {
    const tree: ColDef[] = [
      {
        headerName: 'Group',
        children: [{ field: 'a' }, { field: 'b' }],
      },
    ];
    const result = toggleColDefNode(tree, [0], true);
    const group = result[0] as ColDef & { children: ColDef[] };
    expect(group.hide).toBe(true);
    expect(group.children[0].hide).toBe(true);
    expect(group.children[1].hide).toBe(true);
  });

  test('hides a deeply nested leaf via a multi-segment path', () => {
    const tree: ColDef[] = [
      {
        headerName: 'Group',
        children: [{ field: 'a' }, { field: 'b' }],
      },
    ];
    const result = toggleColDefNode(tree, [0, 1], true);
    const group = result[0] as ColDef & { children: ColDef[] };
    expect(group.children[0].hide).toBeUndefined();
    expect(group.children[1].hide).toBe(true);
  });

  test('shows a leaf inside a group without touching siblings', () => {
    const tree: ColDef[] = [
      {
        headerName: 'Group',
        children: [
          { field: 'a', hide: true },
          { field: 'b', hide: true },
        ],
      },
    ];
    const result = toggleColDefNode(tree, [0, 0], false);
    const group = result[0] as ColDef & { children: ColDef[] };
    expect(group.children[0].hide).toBe(false);
    expect(group.children[1].hide).toBe(true);
  });
});

// ─── collectLeafStates ──────────────────────────────────────────────────────

describe('TreeColumnsPanel :: collectLeafStates', () => {
  test('returns [true] for a visible leaf', () => {
    expect(collectLeafStates({ field: 'a' }, [])).toEqual([true]);
  });

  test('returns [false] for a hidden leaf', () => {
    expect(collectLeafStates({ field: 'a', hide: true }, [])).toEqual([false]);
  });

  test('returns [] for a leaf whose headerName is in skipLeafNames', () => {
    expect(collectLeafStates({ field: 'a', headerName: 'Current' }, ['Current'])).toEqual([]);
  });

  test('does not skip a leaf when its headerName is not in skipLeafNames', () => {
    expect(collectLeafStates({ field: 'a', headerName: 'Current' }, ['Other'])).toEqual([true]);
  });

  test('collects visibility states from all leaves of a group', () => {
    const node: ColDef = {
      headerName: 'Group',
      children: [{ field: 'a' }, { field: 'b', hide: true }],
    };
    expect(collectLeafStates(node, [])).toEqual([true, false]);
  });

  test('collects states from deeply nested leaves', () => {
    const node: ColDef = {
      headerName: 'Outer',
      children: [
        {
          headerName: 'Inner',
          children: [{ field: 'a' }, { field: 'b', hide: true }],
        },
        { field: 'c' },
      ],
    };
    expect(collectLeafStates(node, [])).toEqual([true, false, true]);
  });

  test('skips leaves matching skipLeafNames inside nested groups', () => {
    const node: ColDef = {
      headerName: 'Group',
      children: [
        { field: 'a', headerName: 'Current' },
        { field: 'b', headerName: 'Compared' },
        { field: 'c', headerName: 'Score' },
      ],
    };
    expect(collectLeafStates(node, ['Current', 'Compared'])).toEqual([true]);
  });
});

// ─── getGroupCheckState ──────────────────────────────────────────────────────

describe('TreeColumnsPanel :: getGroupCheckState', () => {
  test('returns "checked" when all leaves are visible', () => {
    const node: ColDef = {
      headerName: 'Group',
      children: [{ field: 'a' }, { field: 'b' }],
    };
    expect(getGroupCheckState(node, [])).toBe('checked');
  });

  test('returns "unchecked" when all leaves are hidden', () => {
    const node: ColDef = {
      headerName: 'Group',
      children: [
        { field: 'a', hide: true },
        { field: 'b', hide: true },
      ],
    };
    expect(getGroupCheckState(node, [])).toBe('unchecked');
  });

  test('returns "indeterminate" when leaves have mixed visibility', () => {
    const node: ColDef = {
      headerName: 'Group',
      children: [{ field: 'a' }, { field: 'b', hide: true }],
    };
    expect(getGroupCheckState(node, [])).toBe('indeterminate');
  });

  test('returns "checked" when no non-skipped leaves exist (empty states)', () => {
    const node: ColDef = {
      headerName: 'Group',
      children: [
        { field: 'a', headerName: 'Current', hide: true },
        { field: 'b', headerName: 'Compared', hide: true },
      ],
    };
    expect(getGroupCheckState(node, ['Current', 'Compared'])).toBe('checked');
  });

  test('ignores skipped leaves when computing check state', () => {
    const node: ColDef = {
      headerName: 'Metric',
      children: [
        { field: 'a', headerName: 'Current', hide: true },
        { field: 'b', headerName: 'Score' },
      ],
    };
    expect(getGroupCheckState(node, ['Current'])).toBe('checked');
  });
});
