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

const EXPANDER_COLUMN_WIDTH = 40;

/** Handlers wired from the grid's turn-grouping hook + the list's case-delete flow. */
export interface TurnActionHandlers {
  onAddTurn: (groupKey: string) => void;
  onDeleteCase: (row: GroupedGridRow) => void;
  onDeleteTurn: (row: GroupedGridRow) => void;
  onMoveTurnUp: (row: GroupedGridRow) => void;
  onMoveTurnDown: (row: GroupedGridRow) => void;
}

/** Context needed by file-type schema cells. */
export interface SchemaColumnContext {
  entityId?: string;
  view: ApplicationRoute;
}

const rowTypeOf = (node: IRowNode): GridRowType | undefined => (node.data as GroupedGridRow | undefined)?.rowType;

/** Leading column: chevron on GROUP rows, indent on TURN rows. */
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

/** ID column: shared case id on GROUP/SINGLE rows, blank on TURN rows; the selection click target. */
export const getGroupedIdColumn = (): ColDef => ({
  field: 'id',
  colId: 'id',
  headerName: 'ID',
  cellClass: 'select-none cursor-pointer',
  // A multi-turn case's id is shared across its turns, so it belongs only on the GROUP master row;
  // TURN rows stay blank and surface their position via the `Turn N` label in the name column.
  valueGetter: (params: ValueGetterParams) =>
    (params.data as GroupedGridRow | undefined)?.rowType === GridRowType.TURN ? '' : (params.data?.id ?? ''),
  cellRenderer: TurnIdCellRenderer,
});

/** Name column: editable for single rows; case name + turn badge for groups; `Turn k` for turns. */
export const getGroupedNameColumn = (onCell: onCellChange, isReadOnly?: boolean): ColDef => ({
  field: 'testCaseName',
  colId: 'testCaseName',
  headerName: 'Test case name',
  editable: false,
  valueGetter: (params: ValueGetterParams) => params.data?.testCaseName ?? '',
  cellRendererSelector: (params) => {
    const rowType = (params.data as GroupedGridRow | undefined)?.rowType;
    // Blacklist GROUP/TURN rather than whitelist SINGLE: rows with no rowType yet
    // (unprojected callers that haven't wired turn-grouping) must stay editable.
    if (rowType === GridRowType.GROUP || rowType === GridRowType.TURN) {
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

/**
 * Schema column. For a per-turn field: the GROUP master row stacks its turns (read-only) and each TURN
 * row is editable. For a shared (test-case-level) field: the GROUP master row is the single editable
 * cell and TURN rows render blank (the value shows once on the master row). SINGLE and unprojected rows
 * are always editable.
 */
export const getGroupedSchemaColumn = (
  param: { name: string; type: TestCaseItemType; perTurn?: boolean },
  onCell: onCellChange,
  ctx: SchemaColumnContext,
  isReadOnly?: boolean,
): ColDef => {
  const field = param.name;
  const isPerTurn = Boolean(param.perTurn);
  const onChange = (value: string | number, rowData: unknown) => {
    onCell(rowData as Record<string, unknown>, field, value);
  };
  return {
    field,
    headerName: field,
    editable: false,
    valueGetter: (params: ValueGetterParams) => params.data?.data?.[field] ?? params.data?.[field] ?? '',
    cellRendererSelector: (params) => {
      const rowType = (params.data as GroupedGridRow | undefined)?.rowType;
      // Per-turn field on the collapsed master row → stack every turn's value.
      if (rowType === GridRowType.GROUP && isPerTurn) {
        return { component: StackedTurnsCellRenderer };
      }
      // Shared field on a turn row → blank; the value lives once on the master row.
      if (rowType === GridRowType.TURN && !isPerTurn) {
        return { component: BlankCellRenderer };
      }
      if (param.type === TestCaseItemType.FILE) {
        return {
          component: FileSelectCellRenderer,
          params: { onChange, id: ctx.entityId, view: ctx.view, isReadonly: isReadOnly },
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
          params: { onChange, disableValidation: true, disabled: isReadOnly },
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
        params: { isReadonly: isReadOnly, hideTriangle: true, skipRequired: true, onChange },
      };
    },
  };
};

const isTurnRow = (_api: GridApi, node: IRowNode) => rowTypeOf(node) !== GridRowType.TURN;
const isCaseRow = (_api: GridApi, node: IRowNode) => rowTypeOf(node) === GridRowType.TURN;

/** Trailing actions column: add-turn / delete-case on group & single rows; reorder / delete on turns. */
export const getTurnActionsColumn = (
  handlers: TurnActionHandlers,
  extraItems: ActionMenuOperationDeclaration<GroupedGridRow>[] = [],
): ColDef => {
  const items: ActionMenuOperationDeclaration<GroupedGridRow>[] = [
    {
      icon: <IconPlus {...BASE_BUTTON_ICON_PROPS} />,
      id: ActionMenuOperationI18nKey.Add_turn,
      label: ActionMenuOperationI18nKey.Add_turn,
      onClick: (entity) => entity && handlers.onAddTurn(entity.groupKey),
      hidden: isCaseRow,
    },
    {
      icon: <IconArrowUp {...BASE_BUTTON_ICON_PROPS} />,
      id: ActionMenuOperationI18nKey.Move_turn_up,
      label: ActionMenuOperationI18nKey.Move_turn_up,
      onClick: (entity) => entity && handlers.onMoveTurnUp(entity),
      hidden: isTurnRow,
    },
    {
      icon: <IconArrowDown {...BASE_BUTTON_ICON_PROPS} />,
      id: ActionMenuOperationI18nKey.Move_turn_down,
      label: ActionMenuOperationI18nKey.Move_turn_down,
      onClick: (entity) => entity && handlers.onMoveTurnDown(entity),
      hidden: isTurnRow,
    },
    {
      icon: <IconTrash {...BASE_BUTTON_ICON_PROPS} className="text-error" />,
      id: ActionMenuOperationI18nKey.Delete_turn,
      label: ActionMenuOperationI18nKey.Delete_turn,
      onClick: (entity) => entity && handlers.onDeleteTurn(entity),
      hidden: isTurnRow,
    },
    {
      icon: <IconTrash {...BASE_BUTTON_ICON_PROPS} className="text-error" />,
      id: ActionMenuOperationI18nKey.Delete_case,
      label: ActionMenuOperationI18nKey.Delete_case,
      onClick: (entity) => entity && handlers.onDeleteCase(entity),
      hidden: isCaseRow,
    },
    ...extraItems,
  ];
  return { ...ACTION_COLUMN<GroupedGridRow>(items), colId: 'action-turns' };
};

/** Cell-renderer type guard reused by tests. */
export const isGroupSummaryRow = (params: ICellRendererParams): boolean =>
  (params.data as GroupedGridRow | undefined)?.rowType === GridRowType.GROUP;
