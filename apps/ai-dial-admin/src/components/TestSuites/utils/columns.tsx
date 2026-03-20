import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';
import { ColDef, ICellRendererParams, ITooltipParams, ValueGetterParams } from 'ag-grid-community';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import ValidityStatus from '@/src/components/Common/ValidityStatus/ValidityStatus';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import JsonEditorCellRenderer from '@/src/components/Grid/CellRenderers/JsonEditorCellRenderer';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import { NO_BORDER_CLASS, UTILITY_COLUMN } from '@/src/constants/ag-grid';
import { BASE_STATUS_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { TEST_CASES_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { MetricBinding } from '@/src/models/evaluation/metric';
import { InputBindingRowData, ResponseColumn, TestCase, TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { InputBindingType, MetricBindingType, TestCaseItemType } from '@/src/types/evaluation';

export type onCellChange = (data: Record<string, unknown>, field: string, value: string | number) => void;

export const getTestCaseColumns = (testCases: TestCase[], onCellChange: onCellChange): ColDef[] => {
  const data = testCases.reduce((acc: string[], testCase) => {
    const testCaseFacts = Object.keys(testCase.data || {});
    testCaseFacts.forEach((fact) => {
      if (!acc.includes(fact)) {
        acc.push(fact);
      }
    });
    return acc;
  }, [] as string[]);

  return [
    {
      ...UTILITY_COLUMN,
      headerName: '',
      field: 'enabled',
      editable: true,
      cellRenderer: 'agCheckboxCellRenderer',
      cellEditor: 'agCheckboxCellEditor',
      tooltipValueGetter: (params) => {
        return !params.data?.enabled ? 'Disable test case' : 'Enable test case';
      },
      valueGetter: (params) => params.data?.enabled,
      valueSetter: (params) => {
        params.data.enabled = params.newValue;
        return true;
      },
    } as ColDef,
    ...TEST_CASES_COLUMN.map((col) => {
      if (col.field === 'testCaseName' && onCellChange) {
        return {
          ...col,
          editable: false,
          cellRenderer: EditableCellRenderer,
          valueGetter: (params: ValueGetterParams) => params.data?.testCaseName ?? '',
          cellRendererParams: {
            hideTriangle: true,
            skipRequired: true,
            onChange: (value: string | number, rowData: unknown) => {
              onCellChange(rowData as Record<string, unknown>, 'testCaseName', value);
            },
          },
        };
      }
      return col;
    }),
    ...data.map((fact) => {
      return {
        field: fact,
        headerName: fact,
        editable: false,
        cellRenderer: EditableCellRenderer,
        valueGetter: (params: ValueGetterParams) => params.data?.data?.[fact] ?? params.data?.[fact] ?? '',
        cellRendererParams: {
          hideTriangle: true,
          skipRequired: true,
          onChange: (value: string | number, rowData: unknown) => {
            onCellChange(rowData as Record<string, unknown>, fact, value);
          },
        },
      };
    }),
    getValidityStatusColumn(),
  ];
};

export const getValidityStatusColumn = (): ColDef => {
  return {
    ...BASE_STATUS_COLUMN,
    cellRenderer: (params: { data?: TestCase }) => {
      return !params.data ? null : (
        <ValidityStatus
          valid={params.data?.valid}
          message={params.data?.validationWarnings?.map((warning) => warning.message).join(', \n') || ''}
        />
      );
    },
  };
};

export const getDynamicConfigurationsColumns = (
  onChangeEditable: (value: string | object, data: InputBindingRowData, column: string, index?: number) => void,
  onChangeSelect: (value: string, data: InputBindingRowData, column: string, index?: number) => void,
  schema: TestCaseSchema[],
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
        if (
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

export const getColumnsGridColumns = (): ColDef<ResponseColumn>[] => {
  return [
    {
      headerName: 'Name',
      colId: 'displayName',
      field: 'displayName',
      sortable: false,
      filter: false,
      floatingFilter: false,
    },
    {
      headerName: 'JSONata Expression',
      colId: 'expression',
      field: 'expression',
      sortable: false,
      filter: false,
      floatingFilter: false,
    },
    {
      headerName: 'Type',
      colId: 'type',
      field: 'type',
      sortable: false,
      filter: false,
      floatingFilter: false,
      valueFormatter: ({ value }) => value.toLowerCase(),
      tooltipValueGetter: ({ value }) => value.toLowerCase(),
    },
  ];
};
