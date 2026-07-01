import type { ColDef } from 'ag-grid-community';

import { DEFAULT_HIDDEN_ROW_DETAIL_FIELDS } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import {
  CompareRowDetailField,
  CompareRowDetailSection,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';

const getNodeKey = (node: ColDef): string => {
  const ctx = node.context as { panelName?: string } | undefined;
  return ctx?.panelName ?? node.headerName?.trim() ?? '';
};

const getNodeChildren = (node: ColDef): ColDef[] =>
  'children' in node && node.children ? (node.children as ColDef[]) : [];

const buildFreshTree = (sections: CompareRowDetailSection[]): ColDef[] =>
  sections.map((section) => ({
    headerName: section.label,
    context: { panelName: section.key },
    hide: false,
    children: section.rows.map((row) => ({
      headerName: row.label,
      context: { panelName: row.fieldKey },
      hide: DEFAULT_HIDDEN_ROW_DETAIL_FIELDS.has(row.fieldKey),
    })),
  }));

const mergeOrderAndHide = (fresh: ColDef[], prev: ColDef[]): ColDef[] => {
  const freshByKey = new Map(fresh.map((node) => [getNodeKey(node), node]));
  const prevByKey = new Map(prev.map((node) => [getNodeKey(node), node]));

  const orderedKeys = [
    ...prev.map(getNodeKey).filter((key) => freshByKey.has(key)),
    ...fresh.map(getNodeKey).filter((key) => !prevByKey.has(key)),
  ];

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

export const buildRowDetailDisplayTree = (sections: CompareRowDetailSection[], prevTree?: ColDef[]): ColDef[] => {
  const fresh = buildFreshTree(sections);
  if (!prevTree || prevTree.length === 0) {
    return fresh;
  }
  // Row detail reloads clear sections before new data arrives; keep prior visibility until sections return.
  if (fresh.length === 0) {
    return prevTree;
  }
  return mergeOrderAndHide(fresh, prevTree);
};

export const applyRowDetailDisplayTree = (
  sections: CompareRowDetailSection[],
  tree: ColDef[],
): CompareRowDetailSection[] => {
  if (tree.length === 0) {
    return sections;
  }

  const sectionByKey = new Map(sections.map((section) => [section.key, section]));
  const result: CompareRowDetailSection[] = [];

  for (const groupNode of tree) {
    const section = sectionByKey.get(getNodeKey(groupNode));
    if (!section) {
      continue;
    }

    const rowByKey = new Map(section.rows.map((row) => [row.fieldKey, row]));
    const visibleRows = getNodeChildren(groupNode)
      .filter((leaf) => leaf.hide !== true)
      .map((leaf) => rowByKey.get(getNodeKey(leaf)))
      .filter((row): row is CompareRowDetailField => row != null);

    if (visibleRows.length === 0) {
      continue;
    }

    result.push({ ...section, rows: visibleRows });
  }

  return result;
};
