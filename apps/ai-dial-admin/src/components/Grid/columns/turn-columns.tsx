import { IconArrowDown, IconArrowUp, IconPlus, IconTrash } from '@tabler/icons-react';
import { ColDef, GridApi, ICellRendererParams, IRowNode, ValueGetterParams } from 'ag-grid-community';

import BlankCellRenderer from '@/src/components/Grid/CellRenderers/BlankCellRenderer';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import FileSelectCellRenderer from '@/src/components/Grid/CellRenderers/FileSelectCellRenderer';
import JsonEditorCellRenderer from '@/src/components/Grid/CellRenderers/JsonEditorCellRenderer';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import StackedTurnsCellRenderer from '@/src/components/Grid/CellRenderers/StackedTurnsCellRenderer';
import TestCaseNameCellRenderer from '@/src/components/Grid/CellRenderers/TestCaseNameCellRenderer';
import TurnExpanderCellRenderer from '@/src/components/Grid/CellRenderers/TurnExpanderCellRenderer';
import TurnIdCellRenderer from '@/src/components/Grid/CellRenderers/TurnIdCellRenderer';
import { ACTION_COLUMN, EXPANDER_COLUMN_CEL_ID, NO_BORDER_CLASS, UTILITY_COLUMN } from '@/src/constants/ag-grid';
import { ActionMenuOperationI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';
import { TestCaseItemType } from '@/src/types/evaluation';
import { ApplicationRoute } from '@/src/types/routes';
import { isValueTruthy } from '@/src/utils/types';

export type onCellChange = (data: Record<string, unknown>, field: string, value: string | number | boolean) => void;

export interface TurnActionHandlers {
  onAddTurn: (groupKey: string) => void;
  onDeleteCase: (row: GroupedGridRow) => void;
  onDeleteTurn: (row: GroupedGridRow) => void;
  onMoveTurnUp: (row: GroupedGridRow) => void;
  onMoveTurnDown: (row: GroupedGridRow) => void;
}

export interface SchemaColumnContext {
  entityId?: string;
  view: ApplicationRoute;
}

const EXPANDER_COLUMN_WIDTH = 40;

const isGroupOrTurnRow = (rowType: GridRowType | undefined) =>
  rowType === GridRowType.GROUP || rowType === GridRowType.TURN;

export const getTurnExpanderColumn = (onToggleExpand: (groupKey: string) => void): ColDef => ({
  ...UTILITY_COLUMN,
  colId: EXPANDER_COLUMN_CEL_ID,
  headerName: '',
  width: EXPANDER_COLUMN_WIDTH,
  minWidth: EXPANDER_COLUMN_WIDTH,
  maxWidth: EXPANDER_COLUMN_WIDTH,
  sortable: false,
  filter: false,
  resizable: false,
  cellClass: NO_BORDER_CLASS,
  cellRenderer: TurnExpanderCellRenderer,
  cellRendererParams: { onToggleExpand },
});

export const getGroupedIdColumn = (): ColDef => ({
  field: 'id',
  colId: 'id',
  headerName: 'ID',
  cellClass: 'select-none cursor-pointer',
  cellRenderer: TurnIdCellRenderer,
  valueGetter: (params: ValueGetterParams<GroupedGridRow>) =>
    params.data?.rowType === GridRowType.TURN ? '' : (params.data?.id ?? ''),
});

export const getGroupedNameColumn = (onCell: onCellChange, isReadOnly?: boolean): ColDef => ({
  field: 'testCaseName',
  colId: 'testCaseName',
  headerName: 'Test case name',
  editable: false,
  valueGetter: (params: ValueGetterParams<GroupedGridRow>) => params.data?.testCaseName ?? '',
  // Blacklist GROUP/TURN rather than whitelist SINGLE: a row with no rowType yet (a caller that
  // hasn't wired turn grouping, e.g. a pinned new-case row) must stay editable, and a whitelist
  // would silently make it read-only.
  cellRendererSelector: (params: ICellRendererParams<GroupedGridRow>) => {
    if (isGroupOrTurnRow(params.data?.rowType)) {
      return { component: TestCaseNameCellRenderer };
    }
    return {
      component: EditableCellRenderer,
      params: {
        isReadonly: isReadOnly,
        hideTriangle: true,
        skipRequired: true,
        onChange: (value: string | number, rowData: unknown) => {
          onCell(rowData as Record<string, unknown>, 'testCaseName', value);
        },
      },
    };
  },
});

export const getGroupedSchemaColumn = (
  param: { name: string; type: TestCaseItemType; perTurn?: boolean },
  onCell: onCellChange,
  ctx: SchemaColumnContext,
  isReadOnly?: boolean,
): ColDef => {
  const field = param.name;

  return {
    field,
    headerName: field,
    editable: false,
    valueGetter: (params: ValueGetterParams) => params.data?.data?.[field] ?? params.data?.[field] ?? '',
    cellRendererParams: {
      isReadonly: isReadOnly,
      hideTriangle: true,
      skipRequired: true,
      onChange: (value: string | number, rowData: unknown) => {
        onCell(rowData as Record<string, unknown>, field, value);
      },
    },
    cellRendererSelector: (params: ICellRendererParams<GroupedGridRow>) => {
      if (params.data?.rowType === GridRowType.GROUP && param.perTurn) {
        return { component: StackedTurnsCellRenderer };
      }
      if (params.data?.rowType === GridRowType.TURN && !param.perTurn) {
        return { component: BlankCellRenderer };
      }

      if (param.type === TestCaseItemType.FILE) {
        return {
          component: FileSelectCellRenderer,
          params: {
            onChange: (value: string | number, rowData: unknown) => {
              onCell(rowData as Record<string, unknown>, field, value);
            },
            id: ctx.entityId,
            view: ctx.view,
            isReadonly: isReadOnly,
          },
        };
      }
      if (param.type === TestCaseItemType.INTEGER || param.type === TestCaseItemType.NUMBER) {
        return {
          component: EditableCellRenderer,
          params: {
            isReadonly: isReadOnly,
            hideTriangle: true,
            skipRequired: true,
            inputType: 'number' as const,
            step: param.type === TestCaseItemType.INTEGER ? 1 : void 0,
            onChange: (value: string | number, rowData: unknown) => {
              if (param.type === TestCaseItemType.INTEGER) {
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                if (value !== '' && !isNaN(numValue) && !Number.isInteger(numValue)) {
                  onCell(rowData as Record<string, unknown>, field, Math.round(numValue));
                  return;
                }
              }
              onCell(rowData as Record<string, unknown>, field, +value);
            },
          },
        };
      }
      if (param.type === TestCaseItemType.OBJECT || param.type === TestCaseItemType.ARRAY) {
        return {
          component: JsonEditorCellRenderer,
          params: {
            onChange: (value: string | number, rowData: unknown) => {
              onCell(rowData as Record<string, unknown>, field, value);
            },
            disableValidation: true,
            disabled: isReadOnly,
          },
        };
      }
      if (param.type === TestCaseItemType.BOOLEAN) {
        return {
          component: SelectCellRenderer,
          params: {
            getItems: () => [
              { value: true.toString(), label: true.toString() },
              { value: false.toString(), label: false.toString() },
            ],
            onChange: (value: string | number, rowData: unknown) => {
              onCell(rowData as Record<string, unknown>, field, isValueTruthy(value as string));
            },
            isReadonly: isReadOnly,
          },
        };
      }
      return {
        component: EditableCellRenderer,
        params: {
          hideTriangle: true,
          skipRequired: true,
          isReadonly: isReadOnly,
          onChange: (value: string | number, rowData: unknown) => {
            onCell(rowData as Record<string, unknown>, field, value);
          },
        },
      };
    },
  };
};

export const getTurnActionsColumn = (
  handlers: TurnActionHandlers,
  extraItems?: ActionMenuOperationDeclaration<GroupedGridRow>[],
): ColDef => {
  const isTurnRow = (_api: GridApi, node: IRowNode) =>
    (node.data as GroupedGridRow | undefined)?.rowType === GridRowType.TURN;
  const isNotTurnRow = (api: GridApi, node: IRowNode) => !isTurnRow(api, node);
  const isFirstTurn = (node: IRowNode) => (node.data as GroupedGridRow | undefined)?.turnNumber === 1;
  const isLastTurn = (node: IRowNode) => {
    const row = node.data as GroupedGridRow | undefined;
    // Tolerant of a turn row that carries no `turnCount`: an unknown count must not hide the action.
    return row?.turnCount != null && row.turnNumber === row.turnCount;
  };

  const items: ActionMenuOperationDeclaration<GroupedGridRow>[] = [
    {
      icon: <IconPlus {...BASE_BUTTON_ICON_PROPS} />,
      id: ActionMenuOperationI18nKey.Add_turn,
      label: ActionMenuOperationI18nKey.Add_turn,
      onClick: (row) => row && handlers.onAddTurn(row.groupKey),
      hidden: isTurnRow,
    },
    {
      icon: <IconArrowUp {...BASE_BUTTON_ICON_PROPS} />,
      id: ActionMenuOperationI18nKey.Move_turn_up,
      label: ActionMenuOperationI18nKey.Move_turn_up,
      onClick: (row) => row && handlers.onMoveTurnUp(row),
      hidden: (api, node) => isNotTurnRow(api, node) || isFirstTurn(node),
    },
    {
      icon: <IconArrowDown {...BASE_BUTTON_ICON_PROPS} />,
      id: ActionMenuOperationI18nKey.Move_turn_down,
      label: ActionMenuOperationI18nKey.Move_turn_down,
      onClick: (row) => row && handlers.onMoveTurnDown(row),
      hidden: (api, node) => isNotTurnRow(api, node) || isLastTurn(node),
    },
    {
      icon: <IconTrash {...BASE_BUTTON_ICON_PROPS} className="text-error" />,
      id: ActionMenuOperationI18nKey.Delete_turn,
      label: ActionMenuOperationI18nKey.Delete_turn,
      onClick: (row) => row && handlers.onDeleteTurn(row),
      hidden: isNotTurnRow,
    },
    {
      icon: <IconTrash {...BASE_BUTTON_ICON_PROPS} className="text-error" />,
      id: ActionMenuOperationI18nKey.Delete_case,
      label: ActionMenuOperationI18nKey.Delete_case,
      onClick: (row) => row && handlers.onDeleteCase(row),
      hidden: isTurnRow,
    },
    ...(extraItems ?? []),
  ];

  return { ...ACTION_COLUMN<GroupedGridRow>(items), colId: 'action-turns' };
};
