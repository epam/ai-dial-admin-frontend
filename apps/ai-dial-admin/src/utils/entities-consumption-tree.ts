import { TreeRow } from '@/src/components/Common/TreeGrid/types';
import { buildTreeFromParentPointer } from '@/src/components/Common/TreeGrid/utils';
import { EntityRow } from '@/src/models/telemetry';

export const escapeSegment = (name: string): string => name.replaceAll('/', '\\/');

// Returns the last segment of an execution_path, respecting `\/` escapes produced
// by escapeSegment (so `'foo/a\\/b'` resolves to `'a/b'`, not `'b'`).
export function lastSegmentOfPath(path: string): string {
  const segments = path.split(/(?<!\\)\//);
  const last = segments[segments.length - 1] ?? '';
  return last.replaceAll('\\/', '/');
}

// Backend sometimes records the literal string `'undefined'` (or omits the value)
// for the parent of a row whose execution_path nevertheless carries a real chain.
// In that case the synthetic ancestor should not be named `'undefined'` — derive
// the name from the parent path instead. Used by BOTH synthetic-row creation and
// the tree builder's getParentId so the two sides agree on the synthetic's id.
export function resolveParentName(rawParentDeployment: string | undefined, parentPath: string): string {
  const trimmed = (rawParentDeployment ?? '').trim();
  if (trimmed && trimmed !== 'undefined') return trimmed;
  return lastSegmentOfPath(parentPath);
}

export function stripDeploymentSuffix(ep: string, name: string): string | null {
  if (!ep || !name) return null;
  if (ep === name || ep === escapeSegment(name)) return null;
  const newSuffix = '/' + escapeSegment(name);
  if (ep.endsWith(newSuffix)) return ep.slice(0, ep.length - newSuffix.length);
  const oldSuffix = '/' + name;
  if (ep.endsWith(oldSuffix)) return ep.slice(0, ep.length - oldSuffix.length);
  return null;
}

export function withSyntheticAncestors(rows: EntityRow[]): EntityRow[] {
  const byPath = new Map<string, EntityRow>();
  for (const r of rows) if (r.execution_path) byPath.set(r.execution_path, r);

  const additions: EntityRow[] = [];
  for (const r of rows) {
    if (!r.execution_path || !r.name) continue;
    const parentPath = stripDeploymentSuffix(r.execution_path, r.name);
    if (parentPath === null || parentPath === '' || byPath.has(parentPath)) continue;
    const parentName = resolveParentName(r.parent_deployment, parentPath);
    if (!parentName) continue;
    const synthetic: EntityRow = {
      name: parentName,
      execution_path: parentPath,
      parent_deployment: '',
      requests: '0',
      cost: '0',
      deployment_cost: '0',
      prompts: '0',
      completions: '0',
      synthetic: true,
    };
    byPath.set(parentPath, synthetic);
    additions.push(synthetic);
  }
  return additions.length > 0 ? [...rows, ...additions] : rows;
}

type AggregatedField = 'requests' | 'prompts' | 'completions' | 'deployment_cost';
const AGGREGATED_FIELDS: readonly AggregatedField[] = ['requests', 'prompts', 'completions', 'deployment_cost'];

// Synthetic rows are placeholders for parents not present in backend data. The backend
// `price` aggregate (rendered as `deployment_cost`) already rolls up each row's subtree,
// and prompt/completion tokens repeat across orchestrator → model layers — so summing
// all descendants would double-count. Direct-children-only is correct for both cases:
// each child already encodes its full subtree contribution.
function rollupSyntheticRow(node: TreeRow<EntityRow>): void {
  for (const child of node.children) rollupSyntheticRow(child);
  if (!node.synthetic) return;
  for (const field of AGGREGATED_FIELDS) {
    let total = 0;
    for (const child of node.children) {
      total += Number(child[field] ?? '0') || 0;
    }
    node[field] = String(total);
  }
}

export function aggregateSyntheticRows(tree: TreeRow<EntityRow>[]): void {
  for (const root of tree) rollupSyntheticRow(root);
}

export function buildEntitiesConsumptionTree(rows: EntityRow[]): TreeRow<EntityRow>[] {
  const usable = rows.filter((r) => !!r.execution_path);
  const withAncestors = withSyntheticAncestors(usable);
  const tree = buildTreeFromParentPointer<EntityRow>(withAncestors, {
    getId: (r) => `${r.execution_path ?? ''}|${r.name ?? ''}`,
    getParentId: (r) => {
      const parentPath = stripDeploymentSuffix(r.execution_path ?? '', r.name ?? '');
      if (parentPath === null) return null;
      const parentName = resolveParentName(r.parent_deployment, parentPath);
      return `${parentPath}|${parentName}`;
    },
  });
  aggregateSyntheticRows(tree);
  return tree;
}
