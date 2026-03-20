import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import { ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getDeleteOperation } from '@/src/constants/grid-columns/actions';
import { getParamsColumns } from '@/src/constants/grid-columns/grid-columns';
import { TestSuiteRequestTemplate, TestSuiteRequestTemplateParam } from '@/src/models/evaluation/test-suite';

export interface ParamsTabRef {
  add: () => void;
}

interface Props {
  template: TestSuiteRequestTemplate;
  changeTemplate: (template: TestSuiteRequestTemplate) => void;
  field: keyof Omit<TestSuiteRequestTemplate, 'urlTemplate' | 'body'>;
  emptyDataTitle: string;
}

const ParamsTab = forwardRef<ParamsTabRef, Props>(({ template, changeTemplate, field, emptyDataTitle }, ref) => {
  const [visibleIndex, setVisibleIndex] = useState<number | undefined>();
  const gridApi = useRef<GridApi>(null);
  const configRef = useRef(template?.[field] || []);

  const onAddParam = useCallback(() => {
    const fieldData = [...configRef.current];
    const lastIndex = gridApi.current?.getLastDisplayedRowIndex() as number;
    setVisibleIndex(lastIndex + 1);
    fieldData.push({ key: '', value: '' });
    changeTemplate({ ...template, [field]: fieldData });
  }, [changeTemplate, template, field]);

  const onRemoveParam = useCallback(
    (_data?: TestSuiteRequestTemplate, index?: number | null) => {
      if (index != null) {
        const fieldData = [...configRef.current];
        fieldData.splice(index, 1);
        setVisibleIndex(index - 1);
        changeTemplate({ ...template, [field]: fieldData });
      }
    },
    [template, changeTemplate, field],
  );

  const onChangeValue = useCallback(
    (value: string, _data: TestSuiteRequestTemplateParam, key: string, rowIndex?: number) => {
      if (rowIndex != null) {
        const fieldData = [...configRef.current];
        fieldData[rowIndex][key as keyof TestSuiteRequestTemplateParam] = value;
        changeTemplate({ ...template, [field]: fieldData });
      }
    },
    [template, changeTemplate, field],
  );

  const columnDefs: ColDef[] = [
    ...getParamsColumns(onChangeValue),
    ONE_ACTION_COLUMN(getDeleteOperation(onRemoveParam, void 0, 'text-error w-4 h-4')),
  ];
  const rowData = template?.[field] || [];

  const onGridReady = (event: GridReadyEvent) => {
    gridApi.current = event.api;

    event.api?.updateGridOptions({
      columnDefs,
      rowData,
    });
  };

  useImperativeHandle(ref, () => ({ add: onAddParam }), [onAddParam]);

  useEffect(() => {
    configRef.current = template?.[field] || [];
  }, [field, template]);

  useEffect(() => {
    gridApi.current?.updateGridOptions({
      rowData: template?.[field],
    });
    if (visibleIndex != null) {
      gridApi.current?.ensureIndexVisible(visibleIndex, 'bottom');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.[field]?.length, gridApi]);

  return (
    <div className="size-full">
      <GridView
        getIsEmptyData={() => !template?.[field]?.length}
        emptyDataProps={{ title: emptyDataTitle }}
        onGridReady={onGridReady}
      />
    </div>
  );
});

ParamsTab.displayName = 'ParamsTab';

export default ParamsTab;
