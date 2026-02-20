import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';
import { ColDef, ICellRendererParams, ITooltipParams } from 'ag-grid-community';

import ValidityStatus from '@/src/components/Common/ValidityStatus/ValidityStatus';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import JsonEditorCellRenderer from '@/src/components/Grid/CellRenderers/JsonEditorCellRenderer';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import { CHECKBOX_COL_DEF, NO_BORDER_CLASS, UTILITY_COLUMN } from '@/src/constants/ag-grid';
import { BASE_STATUS_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { TEST_CASES_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { InputBindingRowData, TestCase, TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { InputBindingType, TestCaseItemType } from '@/src/types/evaluation';

export const getTestCaseColumns = (testCases: TestCase[]) => {
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
      tooltipValueGetter: (params: ITooltipParams<TestCase>) => {
        return !params.data?.enabled ? 'Disable test case' : 'Enable test case';
      },
      valueGetter: (params) => params.data?.enabled,
    } as ColDef,
    ...TEST_CASES_COLUMN,
    ...data.map((fact) => ({
      field: fact,
      headerName: fact,
    })),
    {
      ...BASE_STATUS_COLUMN,
      cellRenderer: (params: { data?: TestCase }) => {
        return (
          <ValidityStatus
            valid={params.data?.valid}
            message={params.data?.validationWarnings?.map((warning) => warning.message).join(', \n') || ''}
          />
        );
      },
    },
  ];
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
          params.data?.inferredType == TestCaseItemType.OBJECT ||
          params.data?.inferredType == TestCaseItemType.ARRAY
        ) {
          return {
            component: JsonEditorCellRenderer,
            params: {
              onChange: onChangeEditable,
              disableValidation: true,
            },
          };
        } else if (params.data?.inferredType == TestCaseItemType.BOOLEAN) {
          return {
            component: SelectCellRenderer,
            params: {
              items: [
                {
                  value: 'true',
                  label: 'True',
                },
                {
                  value: 'false',
                  label: 'False',
                },
              ],
              onChange: onChangeSelect,
            },
          };
        } else {
          return {
            component: EditableCellRenderer,
            params: {
              inputType: params.data?.inferredType === TestCaseItemType.STRING ? 'text' : 'number',
              onChange: onChangeEditable,
            },
          };
        }
      },
      tooltipValueGetter: (params: ITooltipParams<InputBindingRowData>) => {
        if (
          params.data?.inferredType === TestCaseItemType.OBJECT ||
          params.data?.inferredType === TestCaseItemType.BOOLEAN
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
