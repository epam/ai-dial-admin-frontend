import { ColDef, ValueGetterParams } from 'ag-grid-community';

import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import FileSelectCellRenderer from '@/src/components/Grid/CellRenderers/FileSelectCellRenderer';
import JsonEditorCellRenderer from '@/src/components/Grid/CellRenderers/JsonEditorCellRenderer';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import { getConversationColumns, getValidityStatusColumn } from '@/src/components/TestSuites/utils/columns';
import { TEST_CASES_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import { ApplicationRoute } from '@/src/types/routes';
import { isValueTruthy } from '@/src/utils/types';

export type onCellChange = (data: Record<string, unknown>, field: string, value: string | number | boolean) => void;

export const getDatasetTestCaseColumns = (
  dataset: Dataset,
  onCellChange: onCellChange,
  t?: (key: string) => string,
): ColDef[] => {
  const schema: TestCaseSchema[] = dataset.testCaseSchema || [];
  return [
    ...TEST_CASES_COLUMN.map((col) => {
      if (col.field === 'id') {
        return { ...col, cellClass: 'select-none cursor-pointer' };
      }
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
    ...getConversationColumns(onCellChange),
    ...schema.map((param) => {
      const field = param.name;
      return {
        field: field,
        headerName: field,
        editable: false,
        valueGetter: (params: ValueGetterParams) => params.data?.data?.[field] ?? params.data?.[field] ?? '',
        cellRendererParams: {
          hideTriangle: true,
          skipRequired: true,
          onChange: (value: string | number, rowData: unknown) => {
            onCellChange(rowData as Record<string, unknown>, field, value);
          },
        },
        cellRendererSelector: () => {
          if (param.type === TestCaseItemType.FILE) {
            return {
              component: FileSelectCellRenderer,
              params: {
                onChange: (value: string | number, rowData: unknown) => {
                  onCellChange(rowData as Record<string, unknown>, field, value);
                },
                id: dataset.id,
                view: ApplicationRoute.Datasets,
              },
            };
          }
          if (param.type === TestCaseItemType.INTEGER || param.type === TestCaseItemType.NUMBER) {
            return {
              component: EditableCellRenderer,
              params: {
                hideTriangle: true,
                skipRequired: true,
                inputType: 'number' as const,
                step: param.type === TestCaseItemType.INTEGER ? 1 : void 0,
                onChange: (value: string | number, rowData: unknown) => {
                  if (param.type === TestCaseItemType.INTEGER) {
                    const numValue = typeof value === 'string' ? parseFloat(value) : value;
                    if (value !== '' && !isNaN(numValue) && !Number.isInteger(numValue)) {
                      onCellChange(rowData as Record<string, unknown>, field, Math.round(numValue));
                      return;
                    }
                  }
                  onCellChange(rowData as Record<string, unknown>, field, +value);
                },
              },
            };
          }
          if (param.type === TestCaseItemType.OBJECT || param.type === TestCaseItemType.ARRAY) {
            return {
              component: JsonEditorCellRenderer,
              params: {
                onChange: (value: string | number, rowData: unknown) => {
                  onCellChange(rowData as Record<string, unknown>, field, value);
                },
                disableValidation: true,
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
                  onCellChange(rowData as Record<string, unknown>, field, isValueTruthy(value as string));
                },
              },
            };
          }
          return {
            component: EditableCellRenderer,
            params: {
              hideTriangle: true,
              skipRequired: true,
              onChange: (value: string | number, rowData: unknown) => {
                onCellChange(rowData as Record<string, unknown>, field, value);
              },
            },
          };
        },
      };
    }),
    getValidityStatusColumn(t?.(TestSuitesI18nKey.TestCaseError)),
  ];
};
