import type { ColDef } from 'ag-grid-community';

import { RowDetailField, RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';

const getNodeKey = (node: ColDef): string => {
  const ctx = node.context as { panelName?: string } | undefined;
  return ctx?.panelName ?? node.headerName?.trim() ?? '';
};

const getNodeChildren = (node: ColDef): ColDef[] =>
  'children' in node && node.children ? (node.children as ColDef[]) : [];

const buildFreshTree = (sections: RowDetailSection[], defaultHiddenFields: ReadonlySet<string>): ColDef[] =>
  sections.map((section) => ({
    headerName: section.label,
    context: { panelName: section.key },
    hide: false,
    children: section.rows.map((row) => ({
      headerName: row.label,
      context: { panelName: row.fieldKey },
      hide: defaultHiddenFields.has(row.fieldKey),
    })),
  }));

const mergeOrderAndHide = (fresh: ColDef[], prev: ColDef[]): ColDef[] => {
  const freshByKey = new Map(fresh.map((node) => [getNodeKey(node), node]));
  const prevByKey = new Map(prev.map((node) => [getNodeKey(node), node]));
  const freshKeys = fresh.map(getNodeKey);
  const prevKeysPresent = prev.map(getNodeKey).filter((key) => freshByKey.has(key));
  const isSameKeySet =
    prevKeysPresent.length === freshKeys.length && prevKeysPresent.every((key) => freshByKey.has(key));
  // Same key set: keep Display reorder. When the set changes (e.g. another row has extra
  // metric groups), use fresh order so metrics stay grouped after Execution.
  const orderedKeys = isSameKeySet ? prevKeysPresent : freshKeys;

  return orderedKeys.map((key) => {
    const freshNode = freshByKey.get(key) as ColDef;
    const prevNode = prevByKey.get(key);
    if (!prevNode) {
      return freshNode;
    }

    const children = getNodeChildren(freshNode);
    if (children.length > 0) {
      return {
        ...freshNode,
        hide: prevNode.hide === true,
        children: mergeOrderAndHide(children, getNodeChildren(prevNode)),
      };
    }

    return { ...freshNode, hide: prevNode.hide === true };
  });
};

export const buildRowDetailDisplayTree = (
  sections: RowDetailSection[],
  prevTree?: ColDef[],
  defaultHiddenFields: ReadonlySet<string> = new Set(),
): ColDef[] => {
  const fresh = buildFreshTree(sections, defaultHiddenFields);
  if (!prevTree || prevTree.length === 0) {
    return fresh;
  }
  // Row detail reloads clear sections before new data arrives; keep prior visibility until sections return.
  if (fresh.length === 0) {
    return prevTree;
  }
  return mergeOrderAndHide(fresh, prevTree);
};

export const applyRowDetailDisplayTree = (sections: RowDetailSection[], tree: ColDef[]): RowDetailSection[] => {
  if (tree.length === 0) {
    return sections;
  }

  const sectionByKey = new Map(sections.map((section) => [section.key, section]));
  const result: RowDetailSection[] = [];

  for (const groupNode of tree) {
    const section = sectionByKey.get(getNodeKey(groupNode));
    if (!section) {
      continue;
    }

    const rowByKey = new Map(section.rows.map((row) => [row.fieldKey, row]));
    const visibleRows = getNodeChildren(groupNode)
      .filter((leaf) => leaf.hide !== true)
      .map((leaf) => rowByKey.get(getNodeKey(leaf)))
      .filter((row): row is RowDetailField => row != null);

    if (visibleRows.length === 0) {
      continue;
    }

    result.push({ ...section, rows: visibleRows });
  }

  return result;
};
