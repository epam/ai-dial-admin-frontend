import { ColDef, ColGroupDef, ColumnState } from 'ag-grid-community';

import { applyColumnStateOrderToTreeColDefs } from '@/src/components/Grid/utils';
import {
  DEFAULT_COMPARE_DELTA_HEADER,
  EXECUTION_GROUP_HEADER,
  EXECUTION_STATUS_GROUP_HEADER,
  EXTRACTED_GROUP_HEADER,
} from '@/src/components/Runs/Compare/ExecutionResults/constants';
import { CompareColumnPanelContext } from '@/src/components/Runs/Compare/ExecutionResults/models';
import { CompareRun, CompareRunIndex } from '@/src/components/Runs/Compare/models';
import { getCompareRunColId } from '@/src/components/Runs/Compare/utils';

const EXECUTION_FIELD_GROUPS = [
  { fieldLabel: '# Run number', colId: 'runIndex' },
  { fieldLabel: 'Request', colId: 'requestIndex' },
  { fieldLabel: 'Turn', colId: 'turnIndex' },
  { fieldLabel: 'HTTP', colId: 'http' },
  { fieldLabel: 'Duration', colId: 'duration' },
] as const;

const getColId = (col: ColDef): string | undefined => (col.colId ?? col.field) as string | undefined;

const getChildren = (node: ColDef): ColDef[] =>
  'children' in node && node.children ? (node.children as ColDef[]) : [];

const getLeaves = (node: ColDef): ColDef[] => {
  const children = getChildren(node);
  return children.length === 0 ? [node] : children.flatMap(getLeaves);
};

const findLeafByColId = (leaves: ColDef[], colId: string): ColDef | undefined =>
  leaves.find((leaf) => getColId(leaf) === colId);

const wrapPanelLeaf = (col: ColDef | undefined, panelName: string, panelRunIndex?: CompareRunIndex): ColDef => {
  if (!col) {
    return { headerName: panelName, hide: true };
  }

  return {
    ...col,
    context: {
      ...(col.context as CompareColumnPanelContext | undefined),
      panelName,
      ...(panelRunIndex ? { panelRunIndex } : {}),
    },
  };
};

const stripPanelContext = (col: ColDef): ColDef => {
  const ctx = col.context as CompareColumnPanelContext | undefined;
  if (!ctx?.panelName && !ctx?.panelRunIndex) {
    return col;
  }

  const { panelName: __panelName, panelRunIndex: __panelRunIndex, ...rest } = ctx;
  return { ...col, context: Object.keys(rest).length > 0 ? rest : undefined };
};

/** One panel leaf per run, in display order, for the column every run owns under `baseColId`. */
const wrapRunLeaves = (leaves: ColDef[], baseColId: string, runs: CompareRun[]): ColDef[] =>
  runs.map((run) =>
    wrapPanelLeaf(findLeafByColId(leaves, getCompareRunColId(run.slot, baseColId)), run.name, run.index),
  );

const hasEveryRunColumn = (leaves: ColDef[], baseColId: string, runs: CompareRun[]): boolean =>
  runs.every((run) => findLeafByColId(leaves, getCompareRunColId(run.slot, baseColId)));

const nestPairedFieldGroup = (
  fieldLabel: string,
  baseColId: string,
  leaves: ColDef[],
  runs: CompareRun[],
): ColGroupDef => {
  if (!hasEveryRunColumn(leaves, baseColId, runs)) {
    return { headerName: fieldLabel, children: [] };
  }

  return { headerName: fieldLabel, children: wrapRunLeaves(leaves, baseColId, runs) };
};

const nestExecutionGroup = (group: ColGroupDef, runs: CompareRun[]): ColGroupDef => {
  const leaves = getChildren(group);

  return {
    headerName: EXECUTION_GROUP_HEADER,
    children: EXECUTION_FIELD_GROUPS.map(({ fieldLabel, colId }) =>
      nestPairedFieldGroup(fieldLabel, colId, leaves, runs),
    ),
  };
};

const isExecutionStatusGroup = (group: ColDef): boolean => {
  const ctx = group.context as CompareColumnPanelContext | undefined;
  if (ctx?.panelName === EXECUTION_STATUS_GROUP_HEADER) {
    return true;
  }

  return getChildren(group).some((child) => getColId(child) === 'status');
};

const nestExecutionStatusGroup = (group: ColGroupDef, runs: CompareRun[]): ColGroupDef => {
  const leaves = getChildren(group);
  if (!hasEveryRunColumn(leaves, 'status', runs)) {
    return group;
  }

  return {
    headerName: '',
    context: { panelName: EXECUTION_STATUS_GROUP_HEADER },
    children: wrapRunLeaves(leaves, 'status', runs),
  };
};

const nestMetricGroup = (group: ColGroupDef, runs: CompareRun[]): ColGroupDef => {
  const groupKey = group.headerName ?? '';

  return {
    headerName: groupKey,
    // Spreading the grid's metric level keeps its header renderer, which `flattenGroupedNode` hands back to the grid.
    children: (group.children as ColGroupDef[]).map((metricGroup) => {
      const leaves = getChildren(metricGroup);
      const metricKey = metricGroup.headerName ?? '';

      return {
        ...metricGroup,
        children: [
          ...wrapRunLeaves(leaves, `${groupKey}_${metricKey}`, runs),
          wrapPanelLeaf(findLeafByColId(leaves, `delta_${groupKey}_${metricKey}`), DEFAULT_COMPARE_DELTA_HEADER),
        ],
      };
    }),
  };
};

const nestExtractedGroup = (group: ColGroupDef, runs: CompareRun[]): ColGroupDef => {
  const leaves = getLeaves(group);
  const fieldKeys = leaves
    .map((leaf) => getColId(leaf))
    .filter((colId): colId is string => colId?.startsWith('extracted_') ?? false)
    .map((colId) => colId.slice('extracted_'.length));

  return {
    headerName: EXTRACTED_GROUP_HEADER,
    children: fieldKeys.map((key) => ({
      headerName: key,
      children: wrapRunLeaves(leaves, `extracted_${key}`, runs),
    })),
  };
};

const isMetricGroup = (group: ColDef): boolean => getLeaves(group).some((leaf) => getColId(leaf)?.startsWith('delta_'));

const nestTopLevelNode = (node: ColDef, runs: CompareRun[]): ColDef => {
  const children = getChildren(node);
  if (children.length === 0) {
    return node;
  }

  const group = node as ColGroupDef;

  if (isExecutionStatusGroup(group)) {
    return nestExecutionStatusGroup(group, runs);
  }
  if (group.headerName === EXECUTION_GROUP_HEADER) {
    return nestExecutionGroup(group, runs);
  }
  if (group.headerName === EXTRACTED_GROUP_HEADER) {
    return nestExtractedGroup(group, runs);
  }
  if (isMetricGroup(group)) {
    return nestMetricGroup(group, runs);
  }

  return group;
};

const flattenGroupedNode = (node: ColDef): ColDef | ColGroupDef => {
  const children = getChildren(node);
  if (children.length === 0) {
    return stripPanelContext(node);
  }

  if (isMetricGroup(node) || node.headerName === EXTRACTED_GROUP_HEADER) {
    // The grid keeps the per-field level, so only the panel-only leaf context is dropped.
    return {
      ...(node as ColGroupDef),
      children: children.map((fieldGroup) => ({
        ...fieldGroup,
        children: getChildren(fieldGroup).map(stripPanelContext),
      })),
    } as ColGroupDef;
  }

  if (children.every((child) => getChildren(child).length > 0)) {
    const group = node as ColGroupDef;

    return {
      ...group,
      children: children.flatMap((fieldGroup) => getChildren(fieldGroup).map(stripPanelContext)),
    };
  }

  const group = node as ColGroupDef;

  return {
    ...group,
    children: children.map(stripPanelContext),
  };
};

const collectHideByColId = (tree: ColDef[], hideMap = new Map<string, boolean>()): Map<string, boolean> => {
  for (const node of tree) {
    const children = getChildren(node);
    if (children.length === 0) {
      const colId = getColId(node);
      if (colId) {
        hideMap.set(colId, node.hide === true);
      }
      continue;
    }

    collectHideByColId(children, hideMap);
  }

  return hideMap;
};

const applyHideByColId = (tree: ColDef[], hideMap: Map<string, boolean>): ColDef[] =>
  tree.map((node) => {
    const children = getChildren(node);
    if (children.length === 0) {
      const colId = getColId(node);
      if (!colId || !hideMap.has(colId)) {
        return node;
      }

      return { ...node, hide: hideMap.get(colId) };
    }

    return { ...node, children: applyHideByColId(children, hideMap) };
  });

export const collectHiddenColIds = (tree: ColDef[]): Set<string> => {
  const hideMap = collectHideByColId(tree);
  const hiddenColIds = new Set<string>();

  for (const [colId, isHidden] of hideMap.entries()) {
    if (isHidden) {
      hiddenColIds.add(colId);
    }
  }

  return hiddenColIds;
};

export const preservePanelHideState = (newTree: ColDef[], oldTree: ColDef[]): ColDef[] => {
  if (oldTree.length === 0) {
    return newTree;
  }

  return applyHideByColId(newTree, collectHideByColId(oldTree));
};

export const preserveFlatColDefHideState = (newDefs: ColDef[], oldDefs: ColDef[]): ColDef[] => {
  if (oldDefs.length === 0) {
    return newDefs;
  }

  return applyHideByColId(newDefs, collectHideByColId(oldDefs));
};

export const buildComparePanelColumnTree = (
  flatDefs: ColDef[],
  runs: CompareRun[],
  prevPanelTree?: ColDef[],
): ColDef[] => {
  const nestedTree = flatDefs.map((node) => nestTopLevelNode(node, runs));

  return prevPanelTree ? preservePanelHideState(nestedTree, prevPanelTree) : nestedTree;
};

export const flattenComparePanelColumnTree = (panelTree: ColDef[]): (ColDef | ColGroupDef)[] =>
  panelTree.map((node) => flattenGroupedNode(node));

const panelNodePosition = (node: ColDef, indexByColId: Map<string, number>): number => {
  const children = getChildren(node);
  if (children.length === 0) {
    const colId = getColId(node);
    return colId ? (indexByColId.get(colId) ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;
  }

  return Math.min(...children.map((child) => panelNodePosition(child, indexByColId)));
};

const isSplittablePanelGroup = (node: ColDef): boolean =>
  isMetricGroup(node) || node.headerName === EXTRACTED_GROUP_HEADER;

const withChildren = (node: ColDef, children: ColDef[]): ColDef => ({ ...node, children }) as ColGroupDef as ColDef;

const withPanelKey = (node: ColDef, panelKey: string | undefined): ColDef => {
  const { panelKey: __panelKey, ...context } = (node.context ?? {}) as CompareColumnPanelContext;
  const nextContext = panelKey ? { ...context, panelKey } : context;
  return { ...node, context: Object.keys(nextContext).length > 0 ? nextContext : undefined };
};

const isSameSplittableGroup = (left: ColDef | undefined, right: ColDef): boolean =>
  !!left && isSplittablePanelGroup(left) && isSplittablePanelGroup(right) && left.headerName === right.headerName;

/**
 * Lists metric and extracted groups the way the grid draws them: one row while their fields are
 * side by side, one row per run of adjacent fields once another block sits between them.
 */
export const orderComparePanelTree = (tree: ColDef[], columnState: ColumnState[]): ColDef[] => {
  const indexByColId = new Map(columnState.map((column, index) => [column.colId, index]));
  const byPosition = (left: ColDef, right: ColDef) =>
    panelNodePosition(left, indexByColId) - panelNodePosition(right, indexByColId);

  const sortedTree = applyColumnStateOrderToTreeColDefs(tree, columnState);
  const blocks = sortedTree
    .flatMap((node) =>
      isSplittablePanelGroup(node) ? getChildren(node).map((child) => withChildren(node, [child])) : [node],
    )
    .sort(byPosition);

  const rows: ColDef[] = [];
  for (const block of blocks) {
    const previous = rows[rows.length - 1];
    if (isSameSplittableGroup(previous, block)) {
      rows[rows.length - 1] = withChildren(previous, [...getChildren(previous), ...getChildren(block)]);
    } else {
      rows.push(block);
    }
  }

  return rows.map((row) => {
    if (!isSplittablePanelGroup(row)) {
      return row;
    }

    const isSplit = rows.some((other) => other !== row && isSameSplittableGroup(other, row));
    return withPanelKey(row, isSplit ? `${row.headerName ?? ''}#${getColId(getLeaves(row)[0]) ?? ''}` : undefined);
  });
};

export const columnStateFromComparePanelTree = (tree: ColDef[], columnState: ColumnState[]): ColumnState[] => {
  const leafOrder: string[] = [];
  const visit = (nodes: ColDef[]) => {
    for (const node of nodes) {
      const children = getChildren(node);
      if (children.length === 0) {
        const colId = getColId(node);
        if (colId) {
          leafOrder.push(colId);
        }
        continue;
      }
      visit(children);
    }
  };
  visit(tree);

  const hideByColId = collectHideByColId(tree);
  const byId = new Map(columnState.map((column) => [column.colId, column]));
  const seen = new Set(leafOrder);

  return [
    ...leafOrder.flatMap((colId) => {
      const column = byId.get(colId);
      if (!column) {
        return [];
      }
      return hideByColId.has(colId) ? [{ ...column, hide: hideByColId.get(colId) }] : [column];
    }),
    ...columnState.filter((column) => !seen.has(column.colId)),
  ];
};
