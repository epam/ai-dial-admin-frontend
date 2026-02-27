'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import { getColumnsGridColumns } from '@/src/components/TestSuites/utils/columns';
import { BasicI18nKey, ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ResponseColumn } from '@/src/models/evaluation/test-suite';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getEditOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import EditColumn from './EditColumn';

interface ColumnsProps {
  responseColumns: ResponseColumn[];
  onChangeResponseColumns: (responseColumns: ResponseColumn[]) => void;
}

const Columns: FC<ColumnsProps> = ({ responseColumns, onChangeResponseColumns }) => {
  const t = useI18n();
  const { isValid, dispatch } = useSaveValidationContext();

  const [editableColumnIndex, setEditableColumnIndex] = useState<number | undefined>(undefined);

  const columnsRef = useRef(responseColumns);
  const gridApiRef = useRef<GridApi | null>(null);

  useEffect(() => {
    columnsRef.current = responseColumns;
  }, [responseColumns]);

  const onAddColumn = useCallback(() => {
    const columns = [...columnsRef.current, { name: '', displayName: '', expression: '', type: '' }];
    onChangeResponseColumns(columns);
    setEditableColumnIndex(columns.length - 1);
  }, [onChangeResponseColumns]);

  const onRemoveColumn = useCallback(
    (_?: ResponseColumn, index?: number) => {
      if (index != null) {
        setEditableColumnIndex(void 0);
        const columns = [...columnsRef.current];
        columns.splice(index, 1);
        onChangeResponseColumns(columns);
      }
    },
    [onChangeResponseColumns],
  );

  const onChangeColumn = useCallback(
    (updatedColumn: ResponseColumn) => {
      if (editableColumnIndex != null) {
        const columns = [...columnsRef.current];
        columns[editableColumnIndex] = updatedColumn;
        onChangeResponseColumns(columns);
      }
    },
    [editableColumnIndex, onChangeResponseColumns],
  );

  const onEditColumn = useCallback((_?: ResponseColumn, index?: number) => {
    if (index != null) {
      setEditableColumnIndex(index);
    }
  }, []);

  const rowData = useMemo(() => responseColumns, [responseColumns]);

  const columnDefs: ColDef[] = useMemo(
    () => [
      ...getColumnsGridColumns(),
      { ...ONE_ACTION_COLUMN(getEditOperation(onEditColumn)), colId: 'action-edit' },
      {
        ...ONE_ACTION_COLUMN(getRemoveOperation(onRemoveColumn, void 0, 'text-error w-4 h-4')),
        colId: 'action-remove',
      },
    ],
    [onEditColumn, onRemoveColumn],
  );

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      gridApiRef.current = event.api;
      event.api.updateGridOptions({ columnDefs, rowData });
    },
    [columnDefs, rowData],
  );

  useEffect(() => {
    if (!gridApiRef.current?.isDestroyed()) {
      gridApiRef.current?.updateGridOptions({ rowData });
      const error = rowData.some((c) => !c.name || !c.displayName || !c.expression || !c.type);
      dispatch({ type: ValidationActionType.SetField, field: 'columns', isValid: !error });
    }
  }, [dispatch, rowData]);

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex flex-row justify-between items-center">
        <span className="text-secondary small">{t(TestSuitesI18nKey.ColumnsDescription)}</span>
        <DialNeutralButton
          label={t(ButtonsI18nKey.Add)}
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onAddColumn}
          disabled={!isValid}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <GridView<ResponseColumn>
          getIsEmptyData={() => responseColumns.length === 0}
          emptyDataProps={{ title: t(BasicI18nKey.NoData) }}
          onGridReady={onGridReady}
        />
      </div>
      {editableColumnIndex != null && responseColumns[editableColumnIndex] && (
        <EditColumn
          column={responseColumns[editableColumnIndex]}
          onChangeColumn={onChangeColumn}
          onClose={() => setEditableColumnIndex(void 0)}
        />
      )}
    </div>
  );
};

export default Columns;
