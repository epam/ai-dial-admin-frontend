'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import { ButtonAppearance, DialNeutralButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { JSONSchema7 } from 'json-schema';

import GridView from '@/src/components/Grid/GridView/GridView';
import { getColumnsGridColumns } from '@/src/components/TestSuites/utils/columns';
import { ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { BasicI18nKey, ButtonsI18nKey, CompareI18nKey, JsonAtaI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { ResponseColumn } from '@/src/models/evaluation/test-suite';
import DocumentationModal from './DocumentationModal';

interface ColumnsProps {
  responseColumns: ResponseColumn[];
  onChangeResponseColumns: (responseColumns: ResponseColumn[], isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
  responseSchema: JSONSchema7;
}

const Columns: FC<ColumnsProps> = ({ responseColumns, onChangeResponseColumns, responseSchema, isSkipRefresh }) => {
  const t = useI18n();
  const { isValid, dispatch } = useSaveValidationContext();

  const columnsRef = useRef(responseColumns);
  const gridApiRef = useRef<GridApi | null>(null);

  const [isDocumentationModalOpen, setIsDocumentationModalOpen] = useState(false);

  useEffect(() => {
    columnsRef.current = responseColumns;
  }, [responseColumns]);

  const onAddColumn = useCallback(() => {
    const columns = [...columnsRef.current, { name: '', displayName: '', expression: '', type: '' }];
    onChangeResponseColumns(columns);
  }, [onChangeResponseColumns]);

  const onRemoveColumn = useCallback(
    (_?: ResponseColumn, index?: number) => {
      if (index != null) {
        const columns = [...columnsRef.current];
        columns.splice(index, 1);
        onChangeResponseColumns(columns);
      }
    },
    [onChangeResponseColumns],
  );

  const onChangeColumn = useCallback(
    (value: string, _data: ResponseColumn, column: string, index?: number) => {
      const columns = [...columnsRef.current];
      const columnToUpdate = columns[index || 0];
      if (columnToUpdate) {
        if (column === 'displayName') {
          columnToUpdate.displayName = value;
          columnToUpdate.name = value;
          onChangeResponseColumns(columns, true);
        } else if (column === 'type') {
          columnToUpdate.type = value;
          onChangeResponseColumns(columns);
        }
      }
    },
    [onChangeResponseColumns],
  );

  const onChangeExpression = useCallback(
    (value: { expression: string; type?: string }, _data: ResponseColumn, column: string, index?: number) => {
      const columns = [...columnsRef.current];
      const columnToUpdate = columns[index || 0];
      if (columnToUpdate) {
        columnToUpdate.expression = value.expression;
        columnToUpdate.type = value.type || columnToUpdate.type;
        onChangeResponseColumns(columns);
      }
    },
    [onChangeResponseColumns],
  );

  const rowData = useMemo(() => responseColumns, [responseColumns]);

  const columnDefs: ColDef[] = useMemo(
    () => [
      ...getColumnsGridColumns(responseSchema, onChangeColumn, onChangeExpression),
      {
        ...ONE_ACTION_COLUMN(getRemoveOperation(onRemoveColumn, t, void 0, 'text-error w-4 h-4')),
        colId: 'action-remove',
      },
    ],
    [onChangeColumn, onChangeExpression, onRemoveColumn, responseSchema, t],
  );

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      gridApiRef.current = event.api;
      event.api.updateGridOptions({ columnDefs, rowData });
    },
    [columnDefs, rowData],
  );

  useEffect(() => {
    if (!isSkipRefresh && !gridApiRef.current?.isDestroyed()) {
      gridApiRef.current?.updateGridOptions({ rowData });
      const error = rowData.some((c) => !c.name || !c.displayName || !c.expression || !c.type);
      dispatch({ type: ValidationActionType.SetField, field: 'columns', isValid: !error });
    } else {
      dispatch({ type: ValidationActionType.SetField, field: 'columns', isValid: true });
    }
  }, [dispatch, isSkipRefresh, rowData]);

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex flex-row justify-between items-center">
        <span className="text-secondary small">{t(TestSuitesI18nKey.ColumnsDescription)}</span>
        <div className="flex flex-row gap-2">
          <DialPrimaryButton
            iconBefore={<OpenPopup {...BASE_BUTTON_ICON_PROPS} />}
            appearance={ButtonAppearance.Ghost}
            label={`${t(CompareI18nKey.View)} ${t(JsonAtaI18nKey.JSONAtaDoc)}`}
            onClick={() => setIsDocumentationModalOpen(true)}
          />
          <DialNeutralButton
            label={t(ButtonsI18nKey.Add)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onAddColumn}
            disabled={!isValid}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <GridView<ResponseColumn>
          getIsEmptyData={() => responseColumns.length === 0}
          emptyDataProps={{ title: t(BasicI18nKey.NoData) }}
          onGridReady={onGridReady}
        />
      </div>
      {isDocumentationModalOpen &&
        createPortal(
          <DocumentationModal
            schema={responseSchema}
            isModalOpen={isDocumentationModalOpen}
            onClose={() => setIsDocumentationModalOpen(false)}
          />,
          document.body,
        )}
    </div>
  );
};

export default Columns;
