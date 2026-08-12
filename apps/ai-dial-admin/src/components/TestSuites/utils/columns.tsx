import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';
import {
  ColDef,
  ICellRendererParams,
  IFilterOptionDef,
  ITextFilterParams,
  ITooltipParams,
  ValueGetterParams,
} from 'ag-grid-community';
import { JSONSchema7 } from 'json-schema';

import { getSchemaTypes, SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import ValidityStatus from '@/src/components/Common/ValidityStatus/ValidityStatus';
import BooleanButtonCellRenderer from '@/src/components/Grid/CellRenderers/BooleanButtonCellRenderer';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import FileSelectCellRenderer from '@/src/components/Grid/CellRenderers/FileSelectCellRenderer';
import JsonAtaCellRenderer from '@/src/components/Grid/CellRenderers/JsonAtaCellRenderer';
import JsonEditorCellRenderer from '@/src/components/Grid/CellRenderers/JsonEditorCellRenderer';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import {
  getGroupedIdColumn,
  getGroupedNameColumn,
  getGroupedSchemaColumn,
  getTurnExpanderColumn,
} from '@/src/components/Grid/columns/turn-columns';
import IncludeInRunCellRenderer from '@/src/components/TestSuites/TestCases/RunCondition/IncludeInRunCellRenderer';
import { TYPE_OPTIONS } from '@/src/components/TestSuites/TestCaseSchema/constants';
import { NO_BORDER_CLASS, UTILITY_COLUMN } from '@/src/constants/ag-grid';
import { BASE_STATUS_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { MetricBinding } from '@/src/models/evaluation/metric';
import { ValidityStatusRow } from '@/src/models/evaluation/test-case-grouping';
import { InputBindingRowData, ResponseColumn, TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { OnCellChange } from '@/src/types/grid-cell';
import { InputBindingType, MetricBindingType, TestCaseItemType } from '@/src/types/evaluation';
import { GridRowType } from '@/src/types/grid-row-type';
import { ApplicationRoute } from '@/src/types/routes';

export interface TestCaseColumnsOptions {
  suite: TestSuite;
  onCellChange: OnCellChange;
  onToggleExpand: (groupKey: string) => void;
  t?: (key: string) => string;
  schema?: TestCaseSchema[];
  isReadOnly?: boolean;
  includedIds?: Set<string> | null | (() => Set<string> | null);
}

const getIncludeInRunFilterOptions = (
  allLabel: string,
  includedLabel: string,
  excludedLabel: string,
): IFilterOptionDef[] => [
  {
    displayKey: 'all',
    displayName: allLabel,
    numberOfInputs: 0,
    predicate: () => true,
  },
  {
    displayKey: 'included',
    displayName: includedLabel,
    numberOfInputs: 0,
    predicate: (_filterValues, cellValue) => cellValue === true,
  },
  {
    displayKey: 'excluded',
    displayName: excludedLabel,
    numberOfInputs: 0,
    predicate: (_filterValues, cellValue) => cellValue !== true,
  },
];

export const getTestCaseColumns = (options: TestCaseColumnsOptions): ColDef[] => {
  const { suite, onCellChange, onToggleExpand, t, schema, isReadOnly, includedIds } = options;
  const includedLabel = t?.(TestSuitesI18nKey.IncludedInRun) ?? 'Included';
  const excludedLabel = t?.(TestSuitesI18nKey.ExcludedFromRun) ?? 'Excluded';
  const allLabel = 'All';
  const resolvedSchema = schema ?? [];
  const resolveIncludedIds = () => (typeof includedIds === 'function' ? includedIds() : includedIds);

  return [
    getTurnExpanderColumn(onToggleExpand),
    {
      ...UTILITY_COLUMN,
      headerName: t?.(TestSuitesI18nKey.IncludeInRun) ?? 'Include in run',
      field: 'includedInRun',
      colId: 'includedInRun',
      minWidth: 140,
      width: 140,
      maxWidth: 180,
      filter: 'agTextColumnFilter',
      filterParams: {
        filterOptions: getIncludeInRunFilterOptions(allLabel, includedLabel, excludedLabel),
        defaultOption: 'all',
        maxNumConditions: 1,
        buttons: ['reset'],
      } as ITextFilterParams,
      floatingFilter: true,
      floatingFilterComponent: 'agTextColumnFloatingFilter',
      sortable: true,
      editable: false,
      cellRenderer: IncludeInRunCellRenderer,
      valueGetter: (params) => {
        const ids = resolveIncludedIds();
        if (ids == null) {
          return true;
        }
        return ids.has(String(params.data?.id));
      },
    } as ColDef,
    getGroupedIdColumn(),
    getGroupedNameColumn(onCellChange, isReadOnly),
    ...resolvedSchema.map((param) =>
      getGroupedSchemaColumn(
        param,
        onCellChange,
        { entityId: suite.id, view: ApplicationRoute.TestSuites },
        isReadOnly,
      ),
    ),
    getValidityStatusColumn(t?.(TestSuitesI18nKey.TestCaseError)),
  ];
};

export const getValidityStatusColumn = (label?: string): ColDef => {
  return {
    ...BASE_STATUS_COLUMN,
    cellRenderer: ({ data }: { data?: ValidityStatusRow }) => {
      // A flattened turn row has no group row above it to carry the status.
      const isCoveredByGroupRow = data?.rowType === GridRowType.TURN && !data.isFlattened;

      return !data || isCoveredByGroupRow ? null : (
        <ValidityStatus
          valid={data.valid}
          message={data.validationWarnings?.map((warning) => warning.message).join(', \n') || ''}
          label={label}
        />
      );
    },
  };
};

export const getDynamicConfigurationsColumns = (
  onChangeEditable: (value: string | object, data: InputBindingRowData, column: string, index?: number) => void,
  onChangeSelect: (value: string, data: InputBindingRowData, column: string, index?: number) => void,
  schema: TestCaseSchema[],
  id: string,
  t: (stringToTranslate: string) => string,
): ColDef<InputBindingRowData>[] => {
  return [
    {
      headerName: 'Name',
      field: 'templateVariable',
      cellClass: NO_BORDER_CLASS,
      cellDataType: 'text',
      flex: 1,
    },
    {
      headerName: 'Type',
      field: 'type',
      cellClass: NO_BORDER_CLASS,
      cellRenderer: SelectCellRenderer,
      cellRendererParams: {
        items: [
          {
            value: InputBindingType.Constant,
            label: t(TestSuitesI18nKey.Constant),
          },
          {
            value: InputBindingType.Attribute,
            label: t(TestSuitesI18nKey.Attribute),
          },
        ],

        onChange: onChangeSelect,
      },
      flex: 1,
      maxWidth: 240,
    },
    {
      headerName: 'Value',
      field: 'value',
      cellClass: NO_BORDER_CLASS,
      cellRendererSelector: (params: ICellRendererParams<InputBindingRowData>) => {
        if (params.data?.type === InputBindingType.Attribute) {
          const items = schema.map((s) => ({
            value: s.name,
            label: s.name,
          }));
          return {
            component: SelectCellRenderer,
            params: {
              items: items,
              onChange: onChangeSelect,
            },
          };
        } else if (
          params.data?.effectiveType == TestCaseItemType.OBJECT ||
          params.data?.effectiveType == TestCaseItemType.ARRAY
        ) {
          return {
            component: JsonEditorCellRenderer,
            params: {
              onChange: onChangeEditable,
              disableValidation: true,
            },
          };
        } else if (params.data?.effectiveType === TestCaseItemType.FILE) {
          return {
            component: FileSelectCellRenderer,
            params: {
              onChange: onChangeEditable,
              id: id,
              view: ApplicationRoute.TestSuites,
            },
          };
        }
        return {
          component: EditableCellRenderer,
          params: {
            inputType: 'text',
            onChange: onChangeEditable,
          },
        };
      },
      tooltipValueGetter: (params: ITooltipParams<InputBindingRowData>) => {
        if (
          params.data?.effectiveType === TestCaseItemType.OBJECT ||
          params.data?.effectiveType === TestCaseItemType.BOOLEAN
        ) {
          return void 0;
        }
        return params.value;
      },
      cellRendererParams: {
        hideTriangle: true,
      },
      flex: 2,
    },
    {
      headerName: '',
      cellClass: NO_BORDER_CLASS,
      cellRenderer: (params: ICellRendererParams<InputBindingRowData>) => {
        return params.data?.defaultValue != null ? (
          <div className="w-full cursor-pointer">
            <DialTooltip tooltip={`Default value: ${params.data.defaultValue}`}>
              <IconInfoCircle size={20} />
            </DialTooltip>
          </div>
        ) : null;
      },
      width: 36,
      maxWidth: 36,
      sortable: false,
      filter: false,
      resizable: false,
      suppressMovable: true,
    },
  ];
};

const findFieldForProperty = (
  property: string,
  configSchema: SchemaFieldRow[],
  inputSchema: SchemaFieldRow[],
): SchemaFieldRow | undefined =>
  configSchema.find((s) => s.name === property) ?? inputSchema.find((s) => s.name === property);

export const getMetricBindingsColumns = (
  onChangeEditable: (value: string | object, data: MetricBinding, column: string, index?: number) => void,
  configSchema: SchemaFieldRow[],
  inputSchema: SchemaFieldRow[],
  testCaseColumns: string[],
  responseColumns: string[],
  t: (stringToTranslate: string) => string,
): ColDef<MetricBinding>[] => {
  return [
    {
      headerName: 'Property',
      field: 'property',
      cellClass: NO_BORDER_CLASS,
      cellDataType: 'text',
      flex: 1,
    },
    {
      headerName: 'Schema',
      cellClass: NO_BORDER_CLASS,
      valueGetter: (params: ValueGetterParams<MetricBinding>) => {
        const propName = params.data?.property || '';
        const value = configSchema.find((s) => s.name === propName);
        return value ? 'config' : 'input';
      },
      flex: 1,
      maxWidth: 240,
    },
    {
      headerName: 'Type',
      field: 'source.$type',
      cellClass: NO_BORDER_CLASS,
      cellRenderer: SelectCellRenderer,
      cellRendererParams: {
        items: [
          {
            value: MetricBindingType.Constant,
            label: t(TestSuitesI18nKey.Constant),
          },
          {
            value: MetricBindingType.TestCase,
            label: t(TestSuitesI18nKey.TestCase),
          },
          {
            value: MetricBindingType.Response,
            label: t(TestSuitesI18nKey.Response),
          },
        ],

        onChange: onChangeEditable,
      },
      flex: 1,
      maxWidth: 240,
    },
    {
      headerName: 'Value',
      valueGetter: (params: ValueGetterParams<MetricBinding>) => {
        if (params.data?.source?.$type === MetricBindingType.Constant) {
          return params.data?.source?.value;
        } else {
          return params.data?.source?.columnName;
        }
      },
      cellClass: NO_BORDER_CLASS,
      cellRendererSelector: (params: ICellRendererParams<MetricBinding>) => {
        if (params.data?.source?.$type === MetricBindingType.TestCase) {
          const items = testCaseColumns.map((s) => ({
            value: s,
            label: s,
          }));
          return {
            component: SelectCellRenderer,
            params: {
              items: items,
              onChange: onChangeEditable,
            },
          };
        } else if (params.data?.source?.$type === MetricBindingType.Response) {
          const items = responseColumns.map((s) => ({
            value: s,
            label: s,
          }));
          return {
            component: SelectCellRenderer,
            params: {
              items: items,
              onChange: onChangeEditable,
            },
          };
        } else {
          const field = findFieldForProperty(params.data?.property ?? '', configSchema, inputSchema);
          if (field?.enum?.length) {
            return {
              component: SelectCellRenderer,
              params: {
                items: field.enum.map((v) => ({ value: v, label: v })),
                onChange: onChangeEditable,
              },
            };
          }
          return {
            component: EditableCellRenderer,
            params: {
              onChange: onChangeEditable,
            },
          };
        }
      },
      cellRendererParams: {
        hideTriangle: true,
      },
      flex: 2,
    },
  ];
};

export const getVariablesColumns = (
  onChangeEditable: (value: string | object, data: InputBindingRowData) => void,
  id: string,
): ColDef<InputBindingRowData>[] => {
  return [
    {
      headerName: 'Name',
      field: 'templateVariable',
      cellClass: NO_BORDER_CLASS,
      cellDataType: 'text',
      flex: 1,
      floatingFilter: false,
      filter: false,
      sortable: false,
    },
    {
      headerName: 'Value',
      field: 'value',
      cellClass: [NO_BORDER_CLASS, 'relative'],
      cellRendererSelector: (params: ICellRendererParams<InputBindingRowData>) => {
        if (params.data?.effectiveType == TestCaseItemType.FILE) {
          return {
            component: FileSelectCellRenderer,
            params: {
              onChange: onChangeEditable,
              id: id,
              view: ApplicationRoute.TestSuites,
            },
          };
        }
        return {
          component: EditableCellRenderer,
          params: {
            onChange: onChangeEditable,
            hideTriangle: false,
            defaultValue: params?.data?.defaultValue,
          },
        };
      },
      tooltipValueGetter: (params: ITooltipParams<InputBindingRowData>) => {
        if (
          params.data?.effectiveType === TestCaseItemType.OBJECT ||
          params.data?.effectiveType === TestCaseItemType.BOOLEAN
        ) {
          return void 0;
        }
        return params.value;
      },
      cellRendererParams: {
        hideTriangle: true,
      },
      flex: 2,
      floatingFilter: false,
      filter: false,
      sortable: false,
    },
  ];
};

export const getSchemaFieldGridColumns = (
  onChangeEditable: (value: string | number, data: unknown, column: string, index?: number) => void,
  onChangeSelect: (value: string | string[], data: unknown, column?: string, index?: number) => void,
  onChangeRequired: (value: boolean, data: TestCaseSchema) => void,
  onChangePerTurn: (value: boolean, data: TestCaseSchema) => void,
  t: (key: string) => string,
): ColDef<TestCaseSchema>[] => {
  return [
    {
      headerName: 'Name',
      colId: 'name',
      field: 'name',
      editable: false,
      cellClass: NO_BORDER_CLASS,
      cellRenderer: EditableCellRenderer,
      valueGetter: (params: ValueGetterParams) => params.data?.name ?? '',
      cellRendererParams: {
        onChange: onChangeEditable,
        hideTriangle: true,
        skipRequired: true,
        required: true,
      },
      sortable: false,
      filter: false,
      floatingFilter: false,
    },
    {
      headerName: 'Type',
      colId: 'type',
      field: 'type',
      cellClass: NO_BORDER_CLASS,
      cellRenderer: SelectCellRenderer,
      cellRendererParams: {
        items: TYPE_OPTIONS,
        onChange: onChangeSelect,
      },
      sortable: false,
      filter: false,
      floatingFilter: false,
    },
    {
      headerName: 'Required',
      colId: 'required',
      field: 'required',
      cellClass: NO_BORDER_CLASS,
      cellRenderer: BooleanButtonCellRenderer,
      cellRendererParams: {
        onChange: onChangeRequired,
        trueLabel: t(BasicI18nKey.Required),
        falseLabel: t(BasicI18nKey.Optional),
      },
      tooltipValueGetter: () => undefined,
      sortable: false,
      filter: false,
      floatingFilter: false,
      maxWidth: 100,
    },
    {
      headerName: 'Scope',
      colId: 'perTurn',
      field: 'perTurn',
      cellClass: NO_BORDER_CLASS,
      cellRenderer: BooleanButtonCellRenderer,
      cellRendererParams: {
        onChange: onChangePerTurn,
        trueLabel: t(BasicI18nKey.PerTurn),
        falseLabel: t(BasicI18nKey.Shared),
      },
      tooltipValueGetter: () => undefined,
      sortable: false,
      filter: false,
      floatingFilter: false,
      maxWidth: 110,
    },
    {
      headerName: 'Description',
      colId: 'description',
      field: 'description',
      editable: false,
      cellClass: NO_BORDER_CLASS,
      cellRenderer: EditableCellRenderer,
      valueGetter: (params: ValueGetterParams) => params.data?.description ?? '',
      cellRendererParams: {
        onChange: onChangeEditable,
        hideTriangle: true,
        skipRequired: true,
      },
      sortable: false,
      filter: false,
      floatingFilter: false,
    },
  ];
};

export const getColumnsGridColumns = (
  responseSchema: JSONSchema7,
  onChange: (value: string, data: ResponseColumn, column: string, index?: number) => void,
  onChangeExpression?: (
    value: { expression: string; type?: string },
    data: ResponseColumn,
    column: string,
    index?: number,
  ) => void,
): ColDef<ResponseColumn>[] => {
  return [
    {
      headerName: 'Display Name',
      colId: 'displayName',
      field: 'displayName',
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: EditableCellRenderer,
      cellRendererParams: {
        onChange,
        hideTriangle: true,
      },
    },
    {
      headerName: 'JSONata Expression',
      colId: 'expression',
      field: 'expression',
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: JsonAtaCellRenderer,
      cellRendererParams: {
        responseSchema,
        onChange: onChangeExpression,
      },
    },
    {
      headerName: 'Data type',
      colId: 'type',
      field: 'type',
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: SelectCellRenderer,
      cellRendererParams: {
        items: getSchemaTypes().map((type) => ({ value: type.toUpperCase(), label: type })),
        onChange,
      },
      valueFormatter: ({ value }) => value.toLowerCase(),
      tooltipValueGetter: ({ value }) => value.toLowerCase(),
    },
  ];
};
