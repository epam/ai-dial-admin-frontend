import { ColDef, ColGroupDef } from 'ag-grid-community';

import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';
import {
  COMPARE_ACTION_COL_ID,
  DEFAULT_COMPARE_DELTA_HEADER,
  EXECUTION_GROUP_HEADER,
  EXECUTION_STATUS_GROUP_HEADER,
  EXTRACTED_GROUP_HEADER,
} from '@/src/components/Runs/Compare/ExecutionResults/constants';
import { CompareColumnPanelContext, ComparePanelRunNames } from '@/src/components/Runs/Compare/ExecutionResults/models';

type CompareRunIndex = typeof RUN_COMPARE_PRIMARY_INDEX | typeof RUN_COMPARE_SECONDARY_INDEX;

const EXECUTION_FIELD_GROUPS = [
  { fieldLabel: '# Run number', primaryColId: 'runIndex', secondaryColId: 'cmp_runIndex' },
  { fieldLabel: 'HTTP', primaryColId: 'http', secondaryColId: 'cmp_http' },
  { fieldLabel: 'Duration', primaryColId: 'duration', secondaryColId: 'cmp_duration' },
] as const;

const getColId = (col: ColDef): string | undefined => (col.colId ?? col.field) as string | undefined;

const getChildren = (node: ColDef): ColDef[] =>
  'children' in node && node.children ? (node.children as ColDef[]) : [];

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

const nestPairedFieldGroup = (
  fieldLabel: string,
  primaryColId: string,
  secondaryColId: string,
  leaves: ColDef[],
  runNames: ComparePanelRunNames,
): ColGroupDef => {
  const primary = findLeafByColId(leaves, primaryColId);
  const secondary = findLeafByColId(leaves, secondaryColId);
  if (!primary || !secondary) {
    return { headerName: fieldLabel, children: [] };
  }

  return {
    headerName: fieldLabel,
    children: [
      wrapPanelLeaf(primary, runNames.primary, RUN_COMPARE_PRIMARY_INDEX),
      wrapPanelLeaf(secondary, runNames.secondary, RUN_COMPARE_SECONDARY_INDEX),
    ],
  };
};

const nestExecutionGroup = (group: ColGroupDef, runNames: ComparePanelRunNames): ColGroupDef => {
  const leaves = getChildren(group);

  return {
    headerName: EXECUTION_GROUP_HEADER,
    children: EXECUTION_FIELD_GROUPS.map(({ fieldLabel, primaryColId, secondaryColId }) =>
      nestPairedFieldGroup(fieldLabel, primaryColId, secondaryColId, leaves, runNames),
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

const nestExecutionStatusGroup = (group: ColGroupDef, runNames: ComparePanelRunNames): ColGroupDef => {
  const leaves = getChildren(group);
  const primary = findLeafByColId(leaves, 'status');
  const secondary = findLeafByColId(leaves, 'cmp_status');
  if (!primary || !secondary) {
    return group;
  }

  return {
    headerName: '',
    context: { panelName: EXECUTION_STATUS_GROUP_HEADER },
    children: [
      wrapPanelLeaf(primary, runNames.primary, RUN_COMPARE_PRIMARY_INDEX),
      wrapPanelLeaf(secondary, runNames.secondary, RUN_COMPARE_SECONDARY_INDEX),
    ],
  };
};

const nestMetricGroup = (group: ColGroupDef, runNames: ComparePanelRunNames): ColGroupDef => {
  const groupKey = group.headerName ?? '';
  const leaves = getChildren(group);
  const metricKeys = leaves
    .map((leaf) => getColId(leaf))
    .filter((colId): colId is string => colId?.startsWith(`delta_${groupKey}_`) ?? false)
    .map((colId) => colId.slice(`delta_${groupKey}_`.length));

  return {
    headerName: groupKey,
    children: metricKeys.map((metricKey) => {
      const fieldChildren: ColDef[] = [
        wrapPanelLeaf(findLeafByColId(leaves, `${groupKey}_${metricKey}`), runNames.primary, RUN_COMPARE_PRIMARY_INDEX),
        wrapPanelLeaf(
          findLeafByColId(leaves, `cmp_${groupKey}_${metricKey}`),
          runNames.secondary,
          RUN_COMPARE_SECONDARY_INDEX,
        ),
        wrapPanelLeaf(findLeafByColId(leaves, `delta_${groupKey}_${metricKey}`), DEFAULT_COMPARE_DELTA_HEADER),
      ];

      return {
        headerName: metricKey,
        children: fieldChildren,
      };
    }),
  };
};

const nestExtractedGroup = (group: ColGroupDef, runNames: ComparePanelRunNames): ColGroupDef => {
  const leaves = getChildren(group);
  const fieldKeys = leaves
    .map((leaf) => getColId(leaf))
    .filter((colId): colId is string => colId?.startsWith('extracted_') ?? false)
    .map((colId) => colId.slice('extracted_'.length));

  return {
    headerName: EXTRACTED_GROUP_HEADER,
    children: fieldKeys.map((key) => ({
      headerName: key,
      children: [
        wrapPanelLeaf(findLeafByColId(leaves, `extracted_${key}`)!, runNames.primary, RUN_COMPARE_PRIMARY_INDEX),
        wrapPanelLeaf(
          findLeafByColId(leaves, `cmp_extracted_${key}`)!,
          runNames.secondary,
          RUN_COMPARE_SECONDARY_INDEX,
        ),
      ],
    })),
  };
};

const isMetricGroup = (group: ColDef): boolean =>
  getChildren(group).some((child) => getColId(child)?.startsWith('delta_'));

const nestTopLevelNode = (node: ColDef, runNames: ComparePanelRunNames): ColDef => {
  const children = getChildren(node);
  if (children.length === 0) {
    return node;
  }

  const group = node as ColGroupDef;

  if (isExecutionStatusGroup(group)) {
    return nestExecutionStatusGroup(group, runNames);
  }
  if (group.headerName === EXECUTION_GROUP_HEADER) {
    return nestExecutionGroup(group, runNames);
  }
  if (group.headerName === EXTRACTED_GROUP_HEADER) {
    return nestExtractedGroup(group, runNames);
  }
  if (isMetricGroup(group)) {
    return nestMetricGroup(group, runNames);
  }

  return group;
};

const flattenGroupedNode = (node: ColDef): ColDef | ColGroupDef => {
  const children = getChildren(node);
  if (children.length === 0) {
    return stripPanelContext(node);
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
  runNames: ComparePanelRunNames,
  prevPanelTree?: ColDef[],
): ColDef[] => {
  const panelDefs = flatDefs.filter((col) => getColId(col) !== COMPARE_ACTION_COL_ID);
  const nestedTree = panelDefs.map((node) => nestTopLevelNode(node, runNames));

  return prevPanelTree ? preservePanelHideState(nestedTree, prevPanelTree) : nestedTree;
};

export const flattenComparePanelColumnTree = (panelTree: ColDef[]): (ColDef | ColGroupDef)[] =>
  panelTree.map((node) => flattenGroupedNode(node));
