'use client';

import { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import { getSchemaFieldGridColumns } from '@/src/components/TestSuites/utils/columns';
import { ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';

interface Props {
  testCaseSchema: TestCaseSchema[];
  onChangeTestCaseSchema: (schema: TestCaseSchema[], isSkipRefresh?: boolean) => void;
}

const SchemaManager: FC<Props> = ({ testCaseSchema, onChangeTestCaseSchema }) => {
  const t = useI18n();

  const schemaRef = useRef(testCaseSchema);
  const dirtyRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChangeTestCaseSchema);

  useEffect(() => {
    schemaRef.current = testCaseSchema;
  }, [testCaseSchema]);

  useEffect(() => {
    onChangeRef.current = onChangeTestCaseSchema;
  }, [onChangeTestCaseSchema]);

  // Flush pending inline edits to parent — called on blur and unmount
  const flushToParent = useCallback(() => {
    if (dirtyRef.current) {
      dirtyRef.current = false;
      onChangeRef.current(schemaRef.current, true);
    }
  }, []);

  // Flush on unmount so changes aren't lost when panel closes
  useEffect(() => {
    return () => {
      if (dirtyRef.current) {
        onChangeRef.current(schemaRef.current, true);
      }
    };
  }, []);

  // Flush when focus leaves the schema grid container entirely
  const handleContainerBlur = useCallback(() => {
    const container = containerRef.current;
    requestAnimationFrame(() => {
      if (container && !container.contains(document.activeElement)) {
        flushToParent();
      }
    });
  }, [flushToParent]);

  // CRITICAL: mutate row data IN PLACE (same pattern as test cases grid).
  // When EditableCellRenderer calls setValue(), the value is already in the row node data,
  // so ag-grid sees no change and doesn't refresh/recreate the cell.
  const onCellChange = useCallback((value: string | number, data: unknown, column: string, index?: number) => {
    if (index == null) return;
    (data as Record<string, unknown>)[column] = value;
    const schema = [...schemaRef.current];
    schema[index] = data as TestCaseSchema;
    schemaRef.current = schema;
    dirtyRef.current = true;
  }, []);

  const onSelectChange = useCallback((value: string | string[], data: unknown, column?: string, index?: number) => {
    if (index == null || !column) return;
    (data as Record<string, unknown>)[column] = value;
    const schema = [...schemaRef.current];
    schema[index] = data as TestCaseSchema;
    schemaRef.current = schema;
    dirtyRef.current = true;
  }, []);

  const onChangeRequired = useCallback((value: boolean, data: TestCaseSchema) => {
    data.required = value;
    const schema = [...schemaRef.current];
    schemaRef.current = schema;
    onChangeRef.current(schema, true);
  }, []);

  // Structural changes: flush any pending edits, then notify parent immediately
  const onAddField = useCallback(() => {
    dirtyRef.current = false;
    const schema = [
      ...schemaRef.current,
      { name: '', type: TestCaseItemType.STRING, required: false, description: '' },
    ];
    onChangeRef.current(schema);
  }, []);

  const onRemoveField = useCallback((_?: TestCaseSchema, index?: number) => {
    if (index != null) {
      dirtyRef.current = false;
      const schema = [...schemaRef.current];
      schema.splice(index, 1);
      onChangeRef.current(schema);
    }
  }, []);

  // Stable columnDefs — callbacks never change identity
  const columnDefs: ColDef[] = useMemo(
    () => [
      ...getSchemaFieldGridColumns(onCellChange, onSelectChange, onChangeRequired, t),
      {
        ...ONE_ACTION_COLUMN(getRemoveOperation(onRemoveField, undefined, 'text-error w-4 h-4')),
        colId: 'action-remove',
      },
    ],
    [onCellChange, onSelectChange, onChangeRequired, t, onRemoveField],
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-4 border border-primary rounded p-4 mb-4"
      onBlur={handleContainerBlur}
    >
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-col gap-1">
          <h3>{t(TestSuitesI18nKey.TestCaseSchema)}</h3>
          <span className="text-secondary small">{t(TestSuitesI18nKey.SchemaDescription)}</span>
        </div>
        <DialNeutralButton
          label={t(BasicI18nKey.AddField)}
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onAddField}
        />
      </div>
      <div className="min-h-0 overflow-auto" style={{ maxHeight: '300px' }}>
        <GridView<TestCaseSchema>
          columnDefs={columnDefs}
          rowData={testCaseSchema}
          getIsEmptyData={() => testCaseSchema.length === 0}
          emptyDataProps={{ title: t(TestSuitesI18nKey.NoSchemaFields) }}
          additionalGridOptions={{}}
        />
      </div>
    </div>
  );
};

export default SchemaManager;
