import { ColDef, ColGroupDef } from 'ag-grid-community';

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
