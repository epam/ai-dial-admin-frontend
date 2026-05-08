import { SelectOption } from '@epam/ai-dial-ui-kit';
import { ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import { FC } from 'react';

import { getSchemaTypes, SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import BooleanButtonCellRenderer from '@/src/components/Grid/CellRenderers/BooleanButtonCellRenderer';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import TreeNameCellRenderer from '@/src/components/Common/SchemaGrid/TreeNameCellRenderer';
import { NO_BORDER_CLASS, ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getDeleteOperation } from '@/src/constants/grid-columns/actions';
import { BasicI18nKey } from '@/src/constants/i18n';
import { startCase } from 'lodash';

const SCHEMA_TYPE_OPTIONS: SelectOption[] = [
  ...getSchemaTypes()
    .filter((t) => t !== 'array')
    .map((t) => ({ value: t, label: startCase(t) })),
  {
    value: 'array',
    label: 'Array',
    children: getSchemaTypes()
      .filter((t) => t !== 'array' && t !== 'null')
      .map((t) => ({ value: `array:${t}`, label: `${startCase(t)}[]` })),
  },
];

const getPropertyKindOptions = (t: (key: BasicI18nKey) => string): SelectOption[] => [
  { value: 'server', label: t(BasicI18nKey.Server) },
  { value: 'client', label: t(BasicI18nKey.Client) },
];

const isFirstLevel = (data: SchemaFieldRow | undefined): boolean =>
  !!data && data.parentId === null && !data.isAddSubFieldRow;

const OrderCellRenderer: FC<ICellRendererParams<SchemaFieldRow>> = (params) => {
  if (!isFirstLevel(params.data)) return null;
  return <EditableCellRenderer {...params} {...params.colDef?.cellRendererParams} />;
};

const PropertyKindCellRenderer: FC<ICellRendererParams<SchemaFieldRow>> = (params) => {
  if (!isFirstLevel(params.data)) return null;
  return <SelectCellRenderer {...params} {...params.colDef?.cellRendererParams} />;
};

export const getSchemaGridColumns = (
  onToggleExpand: (data: SchemaFieldRow) => void,
  onChangeName: (value: string, data: SchemaFieldRow) => void,
  onChangeType: (value: string, data: SchemaFieldRow) => void,
  onChangeTitle: (value: string, data: SchemaFieldRow) => void,
  onChangeDescription: (value: string, data: SchemaFieldRow) => void,
  onChangeRequired: (value: boolean, data: SchemaFieldRow) => void,
  onRemoveField: (data?: SchemaFieldRow) => void,
  t: (stringToTranslate: string) => string,
  isReadonly?: boolean,
  onChangeOrder?: (value: number | string, data: SchemaFieldRow) => void,
  onChangePropertyKind?: (value: string, data: SchemaFieldRow) => void,
): ColDef<SchemaFieldRow>[] => {
  const baseColumns: ColDef<SchemaFieldRow>[] = [
    {
      headerName: 'Name',
      colId: 'name',
      cellClass: NO_BORDER_CLASS,
      flex: 1,
      minWidth: 130,
      sortable: false,
      filter: false,
      floatingFilter: false,
      valueGetter: (params: ValueGetterParams<SchemaFieldRow>) =>
        `${params.data?.name}|${params.data?.expanded}|${params.data?.type}|${params.data?.itemsType}`,
      cellRenderer: TreeNameCellRenderer,
      cellRendererParams: {
        onToggleExpand,
        onChangeName,
        isReadonly,
      },
    },
    {
      headerName: 'Title',
      field: 'title',
      cellClass: NO_BORDER_CLASS,
      flex: 1,
      minWidth: 140,
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: EditableCellRenderer,
      cellRendererParams: {
        hideTriangle: true,
        skipRequired: true,
        isReadonly,
        onChange: (value: string, data: SchemaFieldRow) => onChangeTitle(value, data),
      },
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
        isReadonly,
        onChange: (value: string, data: SchemaFieldRow) => onChangeDescription(value, data),
      },
    },
    {
      headerName: 'Data type',
      colId: 'dataType',
      cellClass: NO_BORDER_CLASS,
      width: 140,
      maxWidth: 160,
      sortable: false,
      filter: false,
      floatingFilter: false,
      valueGetter: (params: ValueGetterParams<SchemaFieldRow>) => {
        if (params.data?.type === 'array') {
          return `array:${params.data.itemsType ?? 'string'}`;
        }
        return params.data?.type;
      },
      cellRenderer: SelectCellRenderer,
      cellRendererParams: {
        items: SCHEMA_TYPE_OPTIONS,
        onChange: onChangeType,
        isReadonly,
      },
    },
    {
      headerName: 'Requirement',
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
        isReadonly,
      },
      tooltipValueGetter: () => undefined,
    },
  ];

  if (onChangeOrder) {
    baseColumns.push({
      headerName: 'Order',
      colId: 'order',
      cellClass: NO_BORDER_CLASS,
      width: 90,
      maxWidth: 110,
      sortable: false,
      filter: false,
      floatingFilter: false,
      valueGetter: (params: ValueGetterParams<SchemaFieldRow>) =>
        isFirstLevel(params.data) ? params.data?.dialMeta?.['dial:propertyOrder'] : undefined,
      cellRenderer: OrderCellRenderer,
      cellRendererParams: {
        inputType: 'number',
        hideTriangle: true,
        isReadonly,
        onChange: (value: number | string, data: SchemaFieldRow) => onChangeOrder(value, data),
      },
    });
  }

  if (onChangePropertyKind) {
    baseColumns.push({
      headerName: 'Property kind',
      colId: 'propertyKind',
      cellClass: NO_BORDER_CLASS,
      width: 130,
      maxWidth: 150,
      sortable: false,
      filter: false,
      floatingFilter: false,
      valueGetter: (params: ValueGetterParams<SchemaFieldRow>) =>
        isFirstLevel(params.data) ? params.data?.dialMeta?.['dial:propertyKind'] : undefined,
      cellRenderer: PropertyKindCellRenderer,
      cellRendererParams: {
        isReadonly,
        items: getPropertyKindOptions(t),
        onChange: (value: string, data: SchemaFieldRow) => onChangePropertyKind(value, data),
      },
    });
  }

  if (!isReadonly) {
    baseColumns.push({
      ...(ONE_ACTION_COLUMN(
        getDeleteOperation(onRemoveField, undefined, 'text-error w-4 h-4'),
      ) as ColDef<SchemaFieldRow>),
      floatingFilter: false,
    });
  }

  return baseColumns;
};
