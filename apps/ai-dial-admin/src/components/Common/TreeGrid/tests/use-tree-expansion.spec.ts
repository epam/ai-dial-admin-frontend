import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { TreeRow } from '@/src/components/Common/TreeGrid/types';
import { useTreeExpansion } from '@/src/components/Common/TreeGrid/use-tree-expansion';
import { flattenTree } from '@/src/components/Common/TreeGrid/utils';

interface Row {
  name: string;
}

const node = (name: string, children: TreeRow<Row>[] = []): TreeRow<Row> => ({
  name,
  id: name,
  parentId: null,
  depth: 0,
  expanded: false,
  children,
});

const TREE = [node('a', [node('b', [node('c')])]), node('d')];

const namesOf = (rows: TreeRow<Row>[]): string[] => rows.map(({ name }) => name);

// The hook hands back the tree with expansion overlaid; what a reader would see is that tree flattened.
const visible = (currentTree: TreeRow<Row>[]): TreeRow<Row>[] => flattenTree(currentTree);

describe('useTreeExpansion', () => {
  // The default the telemetry grid depends on: a tree that opens collapsed shows its roots and nothing else.
  test('starts collapsed, showing the roots alone', () => {
    const { result } = renderHook(() => useTreeExpansion(TREE));

    expect(namesOf(visible(result.current.currentTree))).toEqual(['a', 'd']);
  });

  test('reveals a node children when it is toggled open', () => {
    const { result } = renderHook(() => useTreeExpansion(TREE));

    act(() => result.current.onToggleExpand(visible(result.current.currentTree)[0]));

    expect(namesOf(visible(result.current.currentTree))).toEqual(['a', 'b', 'd']);
  });

  test('hides them again when the same node is toggled', () => {
    const { result } = renderHook(() => useTreeExpansion(TREE));

    act(() => result.current.onToggleExpand(visible(result.current.currentTree)[0]));
    act(() => result.current.onToggleExpand(visible(result.current.currentTree)[0]));

    expect(namesOf(visible(result.current.currentTree))).toEqual(['a', 'd']);
  });

  test('overlays what the reader toggled onto the tree it was handed', () => {
    const { result } = renderHook(() => useTreeExpansion(TREE));

    act(() => result.current.onToggleExpand(visible(result.current.currentTree)[0]));

    expect(result.current.currentTree[0].expanded).toBe(true);
    expect(result.current.currentTree[1].expanded).toBe(false);
  });

  // The builder sets `expanded: false` on every node, so a consumer that must open expanded overrides the
  // fallback rather than the builder being told which caller it is building for.
  test('opens every node with children when it is told to default to expanded', () => {
    const { result } = renderHook(() => useTreeExpansion(TREE, { isDefaultExpanded: true }));

    expect(namesOf(visible(result.current.currentTree))).toEqual(['a', 'b', 'c', 'd']);
  });

  // Collapsing is the reader's action, and it has to work against a default of open.
  test('collapses a node that opened expanded', () => {
    const { result } = renderHook(() => useTreeExpansion(TREE, { isDefaultExpanded: true }));

    act(() => result.current.onToggleExpand(visible(result.current.currentTree)[1]));

    expect(namesOf(visible(result.current.currentTree))).toEqual(['a', 'b', 'd']);
  });

  // A node the tree no longer holds must not keep a vote on what is expanded — otherwise a later tree that
  // reuses the id inherits a state the reader never set for it.
  test('forgets the state of a node the tree no longer holds', () => {
    const { result, rerender } = renderHook(({ tree }) => useTreeExpansion(tree), {
      initialProps: { tree: TREE },
    });

    act(() => result.current.onToggleExpand(visible(result.current.currentTree)[0]));
    expect(namesOf(visible(result.current.currentTree))).toEqual(['a', 'b', 'd']);

    rerender({ tree: [node('d')] });
    rerender({ tree: TREE });

    expect(namesOf(visible(result.current.currentTree))).toEqual(['a', 'd']);
  });

  test('keeps the state of a node the tree still holds across a rebuild', () => {
    const { result, rerender } = renderHook(({ tree }) => useTreeExpansion(tree), {
      initialProps: { tree: TREE },
    });

    act(() => result.current.onToggleExpand(visible(result.current.currentTree)[0]));
    rerender({ tree: [node('a', [node('b')]), node('d')] });

    expect(namesOf(visible(result.current.currentTree))).toEqual(['a', 'b', 'd']);
  });

  test('handles a tree with nothing in it', () => {
    const { result } = renderHook(() => useTreeExpansion<Row>([]));

    expect(visible(result.current.currentTree)).toEqual([]);
  });
});
