import { SelectOption } from '@epam/ai-dial-ui-kit';
import { ColDef, ValueGetterParams } from 'ag-grid-community';

import { getSchemaTypes, SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import BooleanButtonCellRenderer from '@/src/components/Grid/CellRenderers/BooleanButtonCellRenderer';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import TreeNameCellRenderer from '@/src/components/Grid/CellRenderers/TreeNameCellRenderer';
import { NO_BORDER_CLASS, ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { BasicI18nKey } from '@/src/constants/i18n';

const SCHEMA_TYPE_OPTIONS: SelectOption[] = getSchemaTypes().map((t) => ({ value: t, label: t }));

export const getSchemaGridColumns = (
  onToggleExpand: (data: SchemaFieldRow) => void,
  onChangeName: (value: string, data: SchemaFieldRow) => void,
  onChangeType: (value: string, data: SchemaFieldRow) => void,
  onChangeDescription: (value: string, data: SchemaFieldRow) => void,
  onChangeRequired: (value: boolean, data: SchemaFieldRow) => void,
  onRemoveField: (data?: SchemaFieldRow) => void,
  t: (stringToTranslate: string) => string,
): ColDef<SchemaFieldRow>[] => [
  {
    headerName: 'Name',
    colId: 'name',
    cellClass: NO_BORDER_CLASS,
    flex: 2,
    minWidth: 180,
    sortable: false,
    filter: false,
    floatingFilter: false,
    valueGetter: (params: ValueGetterParams<SchemaFieldRow>) =>
      `${params.data?.name}|${params.data?.expanded}|${params.data?.type}`,
    cellRenderer: TreeNameCellRenderer,
    cellRendererParams: {
      onToggleExpand,
      onChangeName,
    },
  },
  {
    headerName: 'Type',
    field: 'type',
    cellClass: NO_BORDER_CLASS,
    width: 140,
    maxWidth: 160,
    sortable: false,
    filter: false,
    floatingFilter: false,
    cellRenderer: SelectCellRenderer,
    cellRendererParams: {
      items: SCHEMA_TYPE_OPTIONS,
      onChange: onChangeType,
    },
  },
  {
    headerName: 'Required',
    field: 'required',
    cellClass: NO_BORDER_CLASS,
    width: 100,
    maxWidth: 110,
    sortable: false,
    filter: false,
    floatingFilter: false,
    cellRenderer: BooleanButtonCellRenderer,
    cellRendererParams: {
      onChange: onChangeRequired,
      trueLabel: t(BasicI18nKey.Required),
      falseLabel: t(BasicI18nKey.Optional),
    },
    tooltipValueGetter: () => undefined,
  },
  {
    headerName: 'Description',
    field: 'description',
    cellClass: NO_BORDER_CLASS,
    flex: 3,
    minWidth: 160,
    sortable: false,
    filter: false,
    floatingFilter: false,
    cellRenderer: EditableCellRenderer,
    cellRendererParams: {
      hideTriangle: true,
      skipRequired: true,
      onChange: (value: string, data: SchemaFieldRow) => onChangeDescription(value, data),
    },
  },
  {
    ...(ONE_ACTION_COLUMN(
      getRemoveOperation(onRemoveField, undefined, 'text-error w-4 h-4'),
    ) as ColDef<SchemaFieldRow>),
    floatingFilter: false,
  },
];
