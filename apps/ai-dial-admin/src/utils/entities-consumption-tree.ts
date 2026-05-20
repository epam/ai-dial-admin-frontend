import { TreeRow } from '@/src/components/Common/TreeGrid/types';
import { buildTreeFromParentPointer } from '@/src/components/Common/TreeGrid/utils';
import { EntityRow } from '@/src/models/telemetry';

export const escapeSegment = (name: string): string => name.replaceAll('/', '\\/');

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
    const parentName = (r.parent_deployment ?? '').trim();
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

export function buildEntitiesConsumptionTree(rows: EntityRow[]): TreeRow<EntityRow>[] {
  const usable = rows.filter((r) => !!r.execution_path);
  const withAncestors = withSyntheticAncestors(usable);
  return buildTreeFromParentPointer<EntityRow>(withAncestors, {
    getId: (r) => `${r.execution_path ?? ''}|${r.name ?? ''}`,
    getParentId: (r) => {
      const parentPath = stripDeploymentSuffix(r.execution_path ?? '', r.name ?? '');
      if (parentPath === null) return null;
      const parentName = (r.parent_deployment ?? '').trim();
      return `${parentPath}|${parentName}`;
    },
  });
}
