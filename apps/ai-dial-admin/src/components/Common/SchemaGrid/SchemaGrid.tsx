'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { IconPlus } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent, ICellRendererParams, IsFullWidthRowParams } from 'ag-grid-community';
import { JSONSchema7 } from 'json-schema';
import isEqual from 'lodash/isEqual';

import GridView from '@/src/components/Grid/GridView/GridView';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { getSchemaGridColumns } from './columns';
import { SchemaFieldRow, createEmptyField, fieldsToJsonSchema, flattenFields, jsonSchemaToFields } from './utils';

interface SchemaGridProps {
  schema?: JSONSchema7;
  onChange: (schema: JSONSchema7, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
}

const SchemaGrid: FC<SchemaGridProps> = ({ schema, onChange, isSkipRefresh }) => {
  const t = useI18n();
  const [fields, setFields] = useState<SchemaFieldRow[]>(() => jsonSchemaToFields(schema));
  const fieldsRef = useRef(fields);
  const gridApiRef = useRef<GridApi | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const prevSchemaRef = useRef(schema);

  useEffect(() => {
    if (!isEqual(prevSchemaRef.current, schema)) {
      prevSchemaRef.current = schema;
      const newFields = jsonSchemaToFields(schema);
      setFields(newFields);
    }
  }, [schema]);

  const updateFields = useCallback((updatedFields: SchemaFieldRow[], isSkipRefresh?: boolean) => {
    setFields(updatedFields);
    const newSchema = fieldsToJsonSchema(updatedFields);
    prevSchemaRef.current = newSchema;
    onChangeRef.current(newSchema, isSkipRefresh);
  }, []);

  const updateFieldInList = useCallback(
    (fieldList: SchemaFieldRow[], id: string, updater: (field: SchemaFieldRow) => SchemaFieldRow): SchemaFieldRow[] => {
      return fieldList.map((field) => {
        if (field.id === id) return updater(field);
        if (field.children.length) {
          return { ...field, children: updateFieldInList(field.children, id, updater) };
        }
        return field;
      });
    },
    [],
  );

  const onToggleExpand = useCallback(
    (data: SchemaFieldRow) => {
      const updated = updateFieldInList(fieldsRef.current, data.id, (f) => ({
        ...f,
        expanded: !f.expanded,
      }));
      // Only update local state — expand/collapse is UI-only, doesn't change schema
      setFields(updated);
      // Directly push rowData to grid since this bypasses onChange/isSkipRefresh flow
      if (!gridApiRef.current?.isDestroyed()) {
        gridApiRef.current?.updateGridOptions({ rowData: flattenFields(updated) });
      }
    },
    [updateFieldInList],
  );

  const onChangeName = useCallback(
    (value: string, data: SchemaFieldRow) => {
      const updated = updateFieldInList(fieldsRef.current, data.id, (f) => ({ ...f, name: value }));
      updateFields(updated, true);
    },
    [updateFieldInList, updateFields],
  );

  const onChangeType = useCallback(
    (value: string, data: SchemaFieldRow) => {
      const updated = updateFieldInList(fieldsRef.current, data.id, (f) => {
        const newType = value as SchemaFieldRow['type'];
        const shouldClearChildren = newType !== 'object' && newType !== 'array';
        return {
          ...f,
          type: newType,
          children: shouldClearChildren ? [] : f.children,
          expanded: shouldClearChildren ? false : f.expanded,
        };
      });
      updateFields(updated);
    },
    [updateFieldInList, updateFields],
  );

  const onChangeRequired = useCallback(
    (value: boolean, data: SchemaFieldRow) => {
      const updated = updateFieldInList(fieldsRef.current, data.id, (f) => ({ ...f, required: value }));
      updateFields(updated);
    },
    [updateFieldInList, updateFields],
  );

  const onChangeDescription = useCallback(
    (value: string, data: SchemaFieldRow) => {
      const updated = updateFieldInList(fieldsRef.current, data.id, (f) => ({ ...f, description: value }));
      updateFields(updated, true);
    },
    [updateFieldInList, updateFields],
  );

  const onRemoveField = useCallback(
    (data?: SchemaFieldRow) => {
      if (!data) return;
      let updated: SchemaFieldRow[];

      if (data.parentId) {
        updated = updateFieldInList(fieldsRef.current, data.parentId, (parent) => ({
          ...parent,
          children: parent.children.filter((c) => c.id !== data.id),
        }));
      } else {
        updated = fieldsRef.current.filter((f) => f.id !== data.id);
      }
      updateFields(updated);
    },
    [updateFieldInList, updateFields],
  );

  const onAddField = useCallback(() => {
    const newField = createEmptyField(null, 0);
    const updated = [...fieldsRef.current, newField];
    updateFields(updated);
  }, [updateFields]);

  const findFieldById = useCallback((id: string, fieldList: SchemaFieldRow[]): SchemaFieldRow | undefined => {
    for (const field of fieldList) {
      if (field.id === id) return field;
      const found = findFieldById(id, field.children);
      if (found) return found;
    }
    return undefined;
  }, []);

  const onAddSubField = useCallback(
    (parentId: string) => {
      const parent = findFieldById(parentId, fieldsRef.current);
      const childDepth = (parent?.depth ?? 0) + 1;
      const updated = updateFieldInList(fieldsRef.current, parentId, (p) => ({
        ...p,
        expanded: true,
        children: [...p.children, createEmptyField(parentId, childDepth)],
      }));
      updateFields(updated);
    },
    [updateFieldInList, updateFields, findFieldById],
  );

  const rowData = useMemo(() => flattenFields(fields), [fields]);

  const columnDefs: ColDef[] = useMemo(
    () =>
      getSchemaGridColumns(
        onToggleExpand,
        onChangeName,
        onChangeType,
        onChangeDescription,
        onChangeRequired,
        onRemoveField,
        t,
      ),
    [onToggleExpand, onChangeName, onChangeType, onChangeDescription, onChangeRequired, onRemoveField, t],
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
      gridApiRef.current?.updateGridOptions({ columnDefs });
    }
  }, [columnDefs]);

  useEffect(() => {
    if (!isSkipRefresh && !gridApiRef.current?.isDestroyed()) {
      gridApiRef.current?.updateGridOptions({ rowData });
    }
  }, [isSkipRefresh, rowData]);

  const fullWidthCellRenderer = useCallback(
    (params: ICellRendererParams<SchemaFieldRow>) => {
      if (!params.data?.isAddSubFieldRow) return null;
      const { parentId, depth } = params.data;
      const isRootAdd = !parentId;
      return (
        <div className="flex items-center h-full" style={{ paddingLeft: depth * 24 + 18 + 8 }}>
          <button
            className="flex items-center gap-1 tiny text-secondary hover:text-primary"
            onClick={() => (isRootAdd ? onAddField() : onAddSubField(parentId!))}
          >
            <IconPlus size={12} stroke={2.5} />
            {isRootAdd ? t(BasicI18nKey.AddField) : t(BasicI18nKey.AddSubField)}
          </button>
        </div>
      );
    },
    [onAddField, onAddSubField, t],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-auto">
      <GridView<SchemaFieldRow>
        getIsEmptyData={() => fields.length === 0}
        emptyDataProps={{ title: t(BasicI18nKey.NoData) }}
        onGridReady={onGridReady}
        additionalGridOptions={{
          headerHeight: 30,
          domLayout: 'autoHeight',
          getRowId: (params) => params.data.id,
          isFullWidthRow: (params: IsFullWidthRowParams<SchemaFieldRow>) => !!params.rowNode.data?.isAddSubFieldRow,
          fullWidthCellRenderer,
        }}
      />
    </div>
  );
};

export default SchemaGrid;
