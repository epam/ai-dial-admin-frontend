import { describe, expect, test } from 'vitest';

import { TreeRow } from '@/src/components/Common/TreeGrid/types';
import { EntityRow } from '@/src/models/telemetry';
import {
  aggregateSyntheticRows,
  buildEntitiesConsumptionTree,
  lastSegmentOfPath,
  resolveParentName,
} from '@/src/utils/entities-consumption-tree';

// Backend rows arrive with the column names produced by the SQL query
// (count, money, aggregated_money, tokens_p, tokens_c) before TELEMETRY_GRID_HEADERS_MAP
// remaps them. Tests in this file work AFTER remapping — i.e., directly with EntityRow shape —
// because we exercise the pure tree utility, not the data-loading pipeline.
const makeEntityRow = (overrides: Partial<EntityRow>): EntityRow => ({
  name: 'x',
  parent_deployment: '',
  execution_path: 'x',
  requests: '0',
  cost: '0',
  deployment_cost: '0',
  prompts: '0',
  completions: '0',
  ...overrides,
});

// Locate a node anywhere in the tree by its `name`.
const findByName = (tree: TreeRow<EntityRow>[], target: string): TreeRow<EntityRow> | undefined => {
  for (const node of tree) {
    if (node.name === target) return node;
    const inChild = findByName(node.children, target);
    if (inChild) return inChild;
  }
  return undefined;
};

describe('aggregateSyntheticRows via buildEntitiesConsumptionTree', () => {
  test('direct-children rule avoids double-counting deployment_cost', () => {
    // Synthetic root "A" — no row in input, referenced as parent of B.
    // B has deployment_cost: '60' (already includes C's '20' per backend semantics).
    // Naive sum-all-descendants would produce 80; the correct value is 60.
    const rows: EntityRow[] = [
      makeEntityRow({
        name: 'B',
        parent_deployment: 'A',
        execution_path: 'A/B',
        requests: '5',
        cost: '40',
        deployment_cost: '60',
      }),
      makeEntityRow({
        name: 'C',
        parent_deployment: 'B',
        execution_path: 'A/B/C',
        requests: '5',
        cost: '20',
        deployment_cost: '20',
      }),
    ];

    const tree = buildEntitiesConsumptionTree(rows);
    const a = findByName(tree, 'A');

    expect(a?.synthetic).toBe(true);
    expect(a?.deployment_cost).toBe('60');
    expect(a?.deployment_cost).not.toBe('80');
    expect(a?.cost).toBe('0');
  });

  test('tokens do not double-count across orchestrator/model layers', () => {
    // Synthetic root "A" → real orchestrator (prompts 100) → real model (prompts 100).
    // The 100 tokens recorded at each layer are the same logical tokens being forwarded.
    // A's prompts must equal 100 (direct child only), not 200.
    const rows: EntityRow[] = [
      makeEntityRow({
        name: 'orchestrator',
        parent_deployment: 'A',
        execution_path: 'A/orchestrator',
        prompts: '100',
        completions: '50',
      }),
      makeEntityRow({
        name: 'model',
        parent_deployment: 'orchestrator',
        execution_path: 'A/orchestrator/model',
        prompts: '100',
        completions: '50',
      }),
    ];

    const tree = buildEntitiesConsumptionTree(rows);
    const a = findByName(tree, 'A');

    expect(a?.synthetic).toBe(true);
    expect(a?.prompts).toBe('100');
    expect(a?.completions).toBe('50');
    expect(a?.prompts).not.toBe('200');
  });

  test('nested synthetic ancestor reads child synthetic already-computed totals (bottom-up)', () => {
    // The bottom-up walk must populate Inner before Outer reads it. We construct the
    // tree directly because the production pipeline currently synthesizes only one
    // ancestor level per input row, but the rollup function must remain correct under
    // arbitrary nesting (defensive against future changes to withSyntheticAncestors).
    const g1: TreeRow<EntityRow> = {
      ...makeEntityRow({ name: 'g1', requests: '5' }),
      id: 'g1',
      parentId: 'inner',
      depth: 2,
      expanded: false,
      children: [],
    };
    const g2: TreeRow<EntityRow> = {
      ...makeEntityRow({ name: 'g2', requests: '7' }),
      id: 'g2',
      parentId: 'inner',
      depth: 2,
      expanded: false,
      children: [],
    };
    const inner: TreeRow<EntityRow> = {
      ...makeEntityRow({ name: 'Inner' }),
      id: 'inner',
      parentId: 'outer',
      depth: 1,
      expanded: false,
      children: [g1, g2],
      synthetic: true,
    };
    const outer: TreeRow<EntityRow> = {
      ...makeEntityRow({ name: 'Outer' }),
      id: 'outer',
      parentId: null,
      depth: 0,
      expanded: false,
      children: [inner],
      synthetic: true,
    };

    aggregateSyntheticRows([outer]);

    expect(inner.requests).toBe('12');
    expect(outer.requests).toBe('12');
  });

  test('real rows are not modified by the rollup pass', () => {
    // A is a real row with its own backend numbers; it also has children with non-zero values.
    // The rollup pass must leave every numeric field on A untouched.
    const rows: EntityRow[] = [
      makeEntityRow({
        name: 'A',
        parent_deployment: '',
        execution_path: 'A',
        requests: '50',
        cost: '2',
        deployment_cost: '7',
        prompts: '11',
        completions: '13',
      }),
      makeEntityRow({
        name: 'child',
        parent_deployment: 'A',
        execution_path: 'A/child',
        requests: '320',
        cost: '4',
        deployment_cost: '5',
        prompts: '99',
        completions: '99',
      }),
    ];

    const tree = buildEntitiesConsumptionTree(rows);
    const a = findByName(tree, 'A');

    expect(a?.synthetic).toBeUndefined();
    expect(a?.requests).toBe('50');
    expect(a?.cost).toBe('2');
    expect(a?.deployment_cost).toBe('7');
    expect(a?.prompts).toBe('11');
    expect(a?.completions).toBe('13');
  });

  test('synthetic row with no children stays at zero (defensive)', () => {
    // Construct the tree directly (bypassing build) to assert the rollup function's
    // own zero-children behavior without relying on the upstream constructor producing
    // such a case.
    const orphan: TreeRow<EntityRow> = {
      ...makeEntityRow({ name: 'orphan' }),
      id: 'orphan-id',
      parentId: null,
      depth: 0,
      expanded: false,
      children: [],
      synthetic: true,
    };

    aggregateSyntheticRows([orphan]);

    expect(orphan.requests).toBe('0');
    expect(orphan.prompts).toBe('0');
    expect(orphan.completions).toBe('0');
    expect(orphan.deployment_cost).toBe('0');
    expect(orphan.cost).toBe('0');
  });

  test('lastSegmentOfPath returns the final segment, unescaping `\\/`', () => {
    expect(lastSegmentOfPath('foo')).toBe('foo');
    expect(lastSegmentOfPath('foo/bar')).toBe('bar');
    expect(lastSegmentOfPath('foo/bar/baz')).toBe('baz');
    expect(lastSegmentOfPath('x/a\\/b')).toBe('a/b');
    expect(lastSegmentOfPath('')).toBe('');
  });

  test('resolveParentName falls back to path segment when parent_deployment is "undefined"', () => {
    expect(resolveParentName('chat-orch', 'whatever')).toBe('chat-orch');
    expect(resolveParentName('undefined', 'foo/bar')).toBe('bar');
    expect(resolveParentName('', 'foo/bar')).toBe('bar');
    expect(resolveParentName(undefined, 'foo/bar')).toBe('bar');
    expect(resolveParentName('  undefined  ', 'foo/bar')).toBe('bar');
  });

  test('synthetic ancestor named from execution_path when parent_deployment is the literal "undefined"', () => {
    // Backend may emit parent_deployment: 'undefined' (a string sentinel) for rows
    // whose execution_path nevertheless carries a real parent chain. Without the
    // fallback the synthetic would be named "undefined" in the UI.
    const rows: EntityRow[] = [
      makeEntityRow({
        name: 'leaf',
        parent_deployment: 'undefined',
        execution_path: 'mystery-parent/leaf',
        requests: '4',
      }),
    ];

    const tree = buildEntitiesConsumptionTree(rows);

    // Synthetic should be named 'mystery-parent' (last segment of the parent path),
    // NOT 'undefined'. The leaf must still attach as its child.
    expect(tree).toHaveLength(1);
    const synthetic = tree[0];
    expect(synthetic.synthetic).toBe(true);
    expect(synthetic.name).toBe('mystery-parent');
    expect(synthetic.children).toHaveLength(1);
    expect(synthetic.children[0].name).toBe('leaf');
    expect(synthetic.requests).toBe('4');
  });

  test('synthetic name extraction respects escaped slashes (`\\/`) in parent path', () => {
    // A deployment named "a/b" sits under "x"; new BE format emits the path as
    // `x/a\/b`. When a grandchild references that intermediate as parent='undefined',
    // the synthetic's name must come out as "a/b", preserving the slash.
    const rows: EntityRow[] = [
      makeEntityRow({
        name: 'grandchild',
        parent_deployment: 'undefined',
        execution_path: 'x/a\\/b/grandchild',
        requests: '2',
      }),
    ];

    const tree = buildEntitiesConsumptionTree(rows);

    expect(tree).toHaveLength(1);
    expect(tree[0].synthetic).toBe(true);
    expect(tree[0].name).toBe('a/b');
    expect(tree[0].children[0].name).toBe('grandchild');
  });

  test('valid parent_deployment is unchanged by the fallback', () => {
    // Sanity: normal data must NOT be affected by the resolveParentName fallback.
    const rows: EntityRow[] = [
      makeEntityRow({
        name: 'layout-detector',
        parent_deployment: 'Ocr',
        execution_path: 'Ocr/layout-detector',
        requests: '34',
      }),
    ];

    const tree = buildEntitiesConsumptionTree(rows);

    expect(tree[0].name).toBe('Ocr');
    expect(tree[0].synthetic).toBe(true);
  });

  test('root row with parent_deployment="undefined" stays a root (no synthetic created)', () => {
    // The common shape from backend for actual root deployments: parent_deployment
    // is the string "undefined" AND execution_path == deployment. stripDeploymentSuffix
    // returns null here, so no synthetic should be created and the row is a root.
    const rows: EntityRow[] = [
      makeEntityRow({
        name: 'world-economy-v2-hybrid',
        parent_deployment: 'undefined',
        execution_path: 'world-economy-v2-hybrid',
        requests: '3',
      }),
    ];

    const tree = buildEntitiesConsumptionTree(rows);

    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('world-economy-v2-hybrid');
    expect(tree[0].synthetic).toBeUndefined();
  });

  test('Ocr-shaped real example: synthetic root sums direct children with non-zero counts', () => {
    // Mirrors the original motivating case from EntitiesConsumptionTree tests: the
    // synthetic Ocr root with three real children. Verifies the rollup populates
    // `requests` with 34 + 11 + 8 = 53, while `cost` stays '0'.
    const rows: EntityRow[] = [
      makeEntityRow({
        name: 'layout-detector',
        parent_deployment: 'Ocr',
        execution_path: 'Ocr/layout-detector',
        requests: '34',
        deployment_cost: '2',
      }),
      makeEntityRow({
        name: 'markdown-extractor',
        parent_deployment: 'Ocr',
        execution_path: 'Ocr/markdown-extractor',
        requests: '11',
        deployment_cost: '1',
      }),
      makeEntityRow({
        name: 'tables-extractor',
        parent_deployment: 'Ocr',
        execution_path: 'Ocr/tables-extractor',
        requests: '8',
        deployment_cost: '0.5',
      }),
    ];

    const tree = buildEntitiesConsumptionTree(rows);
    const ocr = findByName(tree, 'Ocr');

    expect(ocr?.synthetic).toBe(true);
    expect(ocr?.requests).toBe('53');
    expect(ocr?.deployment_cost).toBe('3.5');
    expect(ocr?.cost).toBe('0');
  });
});
