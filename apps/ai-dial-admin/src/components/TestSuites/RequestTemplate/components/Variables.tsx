'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GridApi, GridReadyEvent } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import { getVariablesColumns } from '@/src/components/TestSuites/utils/columns';
import { generateVariablesRowData } from '@/src/components/TestSuites/utils/template-variables';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { InputBindingRowData, TemplateVariable } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';

interface Props {
  variables: TemplateVariable[];
  requestBody: Record<string, unknown>;
  onChangeRequestBody: (requestBody: Record<string, unknown>) => void;
}

const Variables: FC<Props> = ({ variables, requestBody, onChangeRequestBody }) => {
  const t = useI18n();
  const [isSkipRefresh, setIsSkipRefresh] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi>();
  const requestBodyRef = useRef(requestBody);

  useEffect(() => {
    requestBodyRef.current = requestBody;
  }, [requestBody]);

  const onChangeParam = useCallback(
    (value: string | object, data: InputBindingRowData) => {
      const body = { ...requestBodyRef.current, [data.templateVariable]: value };
      setIsSkipRefresh(!(data.inferredType === TestCaseItemType.BOOLEAN));
      onChangeRequestBody(body);
    },
    [onChangeRequestBody],
  );

  const columns = useMemo(() => {
    return [...getVariablesColumns(onChangeParam)];
  }, [onChangeParam]);

  const data = useMemo(() => generateVariablesRowData(variables || [], requestBody || {}), [variables, requestBody]);

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({
      columnDefs: columns,
      rowData: data,
    });
  };

  useEffect(() => {
    if (!isSkipRefresh && !gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({
        columnDefs: columns,
        rowData: data,
      });
    }
  }, [isSkipRefresh, columns, data, gridApi]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <GridView
        getIsEmptyData={() => !data.length}
        emptyDataProps={{ title: t(BasicI18nKey.NoVariables) }}
        onGridReady={onGridReady}
      />
    </div>
  );
};

export default Variables;
