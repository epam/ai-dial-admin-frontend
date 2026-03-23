import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import { ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { getFormDataColumns } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import { FormDataPart, FormDataType } from '@/src/models/form-data';

interface Props {
  content: FormDataPart[];
  changeContent: (content: FormDataPart[]) => void;
  /** When true, Add is shown at request-template tabs level instead */
  hideAddButton?: boolean;
}
const FormDataGrid: FC<Props> = ({ content, changeContent, hideAddButton }) => {
  const t = useI18n();
  const [isSkipRefresh, setIsSkipRefresh] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi>();

  const contentRef = useRef(structuredClone(content) || []);
  const onChangeRef = useRef(changeContent);

  const onAddPart = useCallback(() => {
    const fieldData = [...contentRef.current];
    fieldData.push({ name: '', value: '', type: FormDataType.Text });
    setIsSkipRefresh(false);
    onChangeRef.current(fieldData);
  }, []);

  const onRemovePart = useCallback((_data?: TestSuiteRequestTemplate, index?: number | null) => {
    if (index != null) {
      const fieldData = [...contentRef.current];
      fieldData.splice(index, 1);
      setIsSkipRefresh(false);
      onChangeRef.current(fieldData);
    }
  }, []);

  const onChangeValue = useCallback(
    (value: string | FormDataType, _data: FormDataPart, key: string, rowIndex?: number) => {
      if (rowIndex != null) {
        const isTypeChanged = key === 'type' && value !== contentRef.current[rowIndex].type;
        const isFileChanged = key === 'value' && contentRef.current[rowIndex].type === FormDataType.File;
        const fieldData = [...contentRef.current];
        fieldData[rowIndex][key as keyof FormDataPart] = value as any;
        if (isTypeChanged) {
          fieldData[rowIndex].value = '';
        }
        setIsSkipRefresh(!(isTypeChanged || isFileChanged));
        onChangeRef.current(fieldData);
      }
    },
    [],
  );

  const data = useMemo(() => content || [], [content]);

  const columns: ColDef[] = useMemo(
    () => [
      ...getFormDataColumns(onChangeValue),
      ONE_ACTION_COLUMN(getRemoveOperation(onRemovePart, void 0, 'text-error w-4 h-4')),
    ],
    [onChangeValue, onRemovePart],
  );

  useEffect(() => {
    contentRef.current = structuredClone(content) || [];
  }, [content]);

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({
      columnDefs: columns,
      rowData: data,
    });
  };

  useEffect(() => {
    if (!gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({ columnDefs: columns });
    }
  }, [columns, gridApi]);

  useEffect(() => {
    if (!isSkipRefresh && !gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({ rowData: data });
    }
  }, [isSkipRefresh, data, gridApi]);

  return (
    <div className="flex flex-col gap-3 size-full">
      {!hideAddButton && (
        <div className="flex flex-row justify-end items-center">
          <DialGhostButton iconBefore={<IconPlus />} label={t(ButtonsI18nKey.Add)} onClick={() => onAddPart()} />
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-auto">
        <GridView
          getIsEmptyData={() => !content?.length}
          emptyDataProps={{ title: 'No form data' }}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};

export default FormDataGrid;
