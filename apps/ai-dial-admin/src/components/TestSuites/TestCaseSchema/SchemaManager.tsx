'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialNeutralButton, DialNotification, NotificationVariant } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { ColDef, GetRowIdParams, GridApi, GridReadyEvent } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import { getSchemaFieldGridColumns } from '@/src/components/TestSuites/utils/columns';
import { ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import { getDuplicateFieldNames } from '@/src/utils/evaluation/schema-fields';

interface Props {
  testCaseSchema: TestCaseSchema[];
  onChangeTestCaseSchema: (schema: TestCaseSchema[], isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
  isReadOnly?: boolean;
}

const SchemaManager: FC<Props> = ({ testCaseSchema, onChangeTestCaseSchema, isSkipRefresh, isReadOnly = false }) => {
  const t = useI18n();

  const [gridApi, setGridApi] = useState<GridApi>();

  const schemaRef = useRef(testCaseSchema);
  const onChangeRef = useRef(onChangeTestCaseSchema);
  const rowKeysRef = useRef(new WeakMap<TestCaseSchema, string>());
  const nextRowKeyRef = useRef(0);

  useEffect(() => {
    onChangeRef.current = onChangeTestCaseSchema;
    schemaRef.current = testCaseSchema;
  }, [onChangeTestCaseSchema, testCaseSchema]);

  const commitSchema = useCallback((schema: TestCaseSchema[], skipRefresh?: boolean) => {
    schemaRef.current = schema;
    if (skipRefresh == null) {
      onChangeRef.current(schema);
    } else {
      onChangeRef.current(schema, skipRefresh);
    }
  }, []);

  const getSchemaRowId = useCallback(({ data }: GetRowIdParams<TestCaseSchema>) => {
    if (data.id) return data.id;

    const existingKey = rowKeysRef.current.get(data);
    if (existingKey) return existingKey;

    const key = `new-schema-field-${nextRowKeyRef.current++}`;
    rowKeysRef.current.set(data, key);
    return key;
  }, []);

  // CRITICAL: mutate row data IN PLACE (same pattern as test cases grid).
  // When EditableCellRenderer calls setValue(), the value is already in the row node data,
  // so ag-grid sees no change and doesn't refresh/recreate the cell.
  const onCellChange = useCallback(
    (value: string | number, data: unknown, column: string) => {
      const field = data as TestCaseSchema;
      const index = schemaRef.current.indexOf(field);
      if (index === -1) return;

      (field as unknown as Record<string, unknown>)[column] = value;
      const schema = [...schemaRef.current];
      schema[index] = field;
      commitSchema(schema, true);
    },
    [commitSchema],
  );

  const onSelectChange = useCallback(
    (value: string | string[], data: unknown, column?: string) => {
      if (!column) return;

      const field = data as TestCaseSchema;
      const index = schemaRef.current.indexOf(field);
      if (index === -1) return;

      (field as unknown as Record<string, unknown>)[column] = value;
      const schema = [...schemaRef.current];
      schema[index] = field;
      commitSchema(schema);
    },
    [commitSchema],
  );

  const onChangeRequired = useCallback(
    (value: boolean, data: TestCaseSchema) => {
      data.required = value;
      const schema = [...schemaRef.current];
      commitSchema(schema);
    },
    [commitSchema],
  );

  const onChangePerTurn = useCallback(
    (value: boolean, data: TestCaseSchema) => {
      data.perTurn = value;
      const schema = [...schemaRef.current];
      commitSchema(schema);
    },
    [commitSchema],
  );

  const onAddField = useCallback(() => {
    const schema = [
      ...schemaRef.current,
      { name: '', type: TestCaseItemType.STRING, required: false, description: '' },
    ];
    commitSchema(schema);
  }, [commitSchema]);

  const onRemoveField = useCallback(
    (field?: TestCaseSchema) => {
      if (!field) return;

      const schema = schemaRef.current.filter((item) => item !== field);
      commitSchema(schema);
    },
    [commitSchema],
  );

  const columnDefs: ColDef[] = useMemo(
    () => [
      ...getSchemaFieldGridColumns(onCellChange, onSelectChange, onChangeRequired, onChangePerTurn, t, isReadOnly),
      ...(isReadOnly
        ? []
        : [
            {
              ...ONE_ACTION_COLUMN(getRemoveOperation(onRemoveField, undefined, 'text-error w-4 h-4')),
              colId: 'action-remove',
            },
          ]),
    ],
    [onCellChange, onSelectChange, onChangeRequired, onChangePerTurn, t, onRemoveField, isReadOnly],
  );

  const rowData = useMemo(() => testCaseSchema, [testCaseSchema]);

  const duplicateName = useMemo(() => {
    const duplicates = getDuplicateFieldNames(testCaseSchema);
    return testCaseSchema.find(({ name }) => duplicates.has(name?.trim().toLowerCase()))?.name;
  }, [testCaseSchema]);

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      setGridApi(event.api);
      event.api?.updateGridOptions({
        columnDefs,
        rowData,
      });
    },
    [columnDefs, rowData],
  );

  useEffect(() => {
    if (!gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({ columnDefs });
    }
  }, [columnDefs, gridApi]);

  useEffect(() => {
    if (!isSkipRefresh && !gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({ rowData });
    }
  }, [isSkipRefresh, rowData, gridApi]);

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {duplicateName && (
        <DialNotification
          variant={NotificationVariant.Error}
          message={t(TestSuitesI18nKey.DuplicateSchemaFieldName, { name: duplicateName })}
        />
      )}
      <div className="flex flex-row justify-between items-center shrink-0">
        <span className="dial-small-text">{t(TestSuitesI18nKey.SchemaDescription)}</span>
        <DialNeutralButton
          label={t(BasicI18nKey.AddField)}
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onAddField}
          disabled={isReadOnly}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <GridView<TestCaseSchema>
          getIsEmptyData={() => testCaseSchema.length === 0}
          emptyDataProps={{ title: t(TestSuitesI18nKey.NoSchemaFields) }}
          isLiveData
          getRowId={getSchemaRowId}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};

export default SchemaManager;
