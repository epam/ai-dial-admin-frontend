import { SelectOption } from '@epam/ai-dial-ui-kit';
import { ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import { FC } from 'react';

import { DIAL_META_PROPERTY_KIND, DIAL_META_PROPERTY_ORDER } from '@/src/components/Common/SchemaGrid/constants';
import { SchemaMetaColumn, SchemaMetaHandlers } from '@/src/components/Common/SchemaGrid/models';
import { getSchemaTypes, SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import {
  CATALOG_META_LOCALIZED,
  CATALOG_META_SECTION,
  CATALOG_META_TAB,
  CATALOG_META_WIDGET,
  CATALOG_PROPERTY_WIDGETS,
} from '@/src/constants/catalog-schemas';
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

const WIDGET_OPTIONS: SelectOption[] = CATALOG_PROPERTY_WIDGETS.map((widget) => ({
  value: widget,
  label: startCase(widget),
}));

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

const TextMetaCellRenderer: FC<ICellRendererParams<SchemaFieldRow>> = (params) => {
  if (!isFirstLevel(params.data)) return null;
  return <EditableCellRenderer {...params} {...params.colDef?.cellRendererParams} />;
};

const WidgetCellRenderer = PropertyKindCellRenderer;

const LocalizedCellRenderer: FC<ICellRendererParams<SchemaFieldRow>> = (params) => {
  if (!isFirstLevel(params.data)) return null;
  return <BooleanButtonCellRenderer {...params} {...params.colDef?.cellRendererParams} />;
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
  metaHandlers: SchemaMetaHandlers = {},
): ColDef<SchemaFieldRow>[] => {
  const onChangeOrder = metaHandlers[SchemaMetaColumn.Order];
  const onChangePropertyKind = metaHandlers[SchemaMetaColumn.PropertyKind];
  const onChangeTab = metaHandlers[SchemaMetaColumn.Tab];
  const onChangeSection = metaHandlers[SchemaMetaColumn.Section];
  const onChangeWidget = metaHandlers[SchemaMetaColumn.Widget];
  const onChangeLocalized = metaHandlers[SchemaMetaColumn.Localized];

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
        isFirstLevel(params.data) ? params.data?.dialMeta?.[DIAL_META_PROPERTY_ORDER] : undefined,
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
        isFirstLevel(params.data) ? params.data?.dialMeta?.[DIAL_META_PROPERTY_KIND] : undefined,
      cellRenderer: PropertyKindCellRenderer,
      cellRendererParams: {
        isReadonly,
        items: getPropertyKindOptions(t),
        onChange: (value: string, data: SchemaFieldRow) => onChangePropertyKind(value, data),
      },
    });
  }

  if (onChangeTab) {
    baseColumns.push({
      headerName: 'Tab',
      colId: 'catalogTab',
      cellClass: NO_BORDER_CLASS,
      width: 130,
      maxWidth: 150,
      sortable: false,
      filter: false,
      floatingFilter: false,
      valueGetter: (params: ValueGetterParams<SchemaFieldRow>) =>
        isFirstLevel(params.data) ? params.data?.dialMeta?.[CATALOG_META_TAB] : undefined,
      cellRenderer: TextMetaCellRenderer,
      cellRendererParams: {
        hideTriangle: true,
        skipRequired: true,
        isReadonly,
        onChange: (value: string, data: SchemaFieldRow) => onChangeTab(value, data),
      },
    });
  }

  if (onChangeSection) {
    baseColumns.push({
      headerName: 'Section',
      colId: 'catalogSection',
      cellClass: NO_BORDER_CLASS,
      width: 130,
      maxWidth: 150,
      sortable: false,
      filter: false,
      floatingFilter: false,
      valueGetter: (params: ValueGetterParams<SchemaFieldRow>) =>
        isFirstLevel(params.data) ? params.data?.dialMeta?.[CATALOG_META_SECTION] : undefined,
      cellRenderer: TextMetaCellRenderer,
      cellRendererParams: {
        hideTriangle: true,
        skipRequired: true,
        isReadonly,
        onChange: (value: string, data: SchemaFieldRow) => onChangeSection(value, data),
      },
    });
  }

  if (onChangeWidget) {
    baseColumns.push({
      headerName: 'Widget',
      colId: 'catalogWidget',
      cellClass: NO_BORDER_CLASS,
      width: 130,
      maxWidth: 150,
      sortable: false,
      filter: false,
      floatingFilter: false,
      valueGetter: (params: ValueGetterParams<SchemaFieldRow>) =>
        isFirstLevel(params.data) ? params.data?.dialMeta?.[CATALOG_META_WIDGET] : undefined,
      cellRenderer: WidgetCellRenderer,
      cellRendererParams: {
        isReadonly,
        items: WIDGET_OPTIONS,
        onChange: (value: string, data: SchemaFieldRow) => onChangeWidget(value, data),
      },
    });
  }

  if (onChangeLocalized) {
    baseColumns.push({
      headerName: 'Localized',
      colId: 'catalogLocalized',
      cellClass: NO_BORDER_CLASS,
      width: 110,
      maxWidth: 130,
      sortable: false,
      filter: false,
      floatingFilter: false,
      valueGetter: (params: ValueGetterParams<SchemaFieldRow>) =>
        isFirstLevel(params.data) ? !!params.data?.dialMeta?.[CATALOG_META_LOCALIZED] : undefined,
      cellRenderer: LocalizedCellRenderer,
      cellRendererParams: {
        onChange: (value: boolean, data: SchemaFieldRow) => onChangeLocalized(value, data),
        trueLabel: t(BasicI18nKey.Yes),
        falseLabel: t(BasicI18nKey.No),
        isReadonly,
      },
      tooltipValueGetter: () => undefined,
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
