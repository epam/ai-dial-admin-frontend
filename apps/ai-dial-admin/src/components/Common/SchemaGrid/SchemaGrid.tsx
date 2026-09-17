'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { IconPlus } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent, ICellRendererParams, IsFullWidthRowParams } from 'ag-grid-community';
import { JSONSchema7 } from 'json-schema';
import isEqual from 'lodash/isEqual';

import GridView from '@/src/components/Grid/GridView/GridView';
import { findRowInTree, updateRowInTree } from '@/src/components/Common/TreeGrid/utils';
import { getRowIdById } from '@/src/components/Grid/utils';
import {
  CATALOG_META_LOCALIZED,
  CATALOG_META_SECTION,
  CATALOG_META_TAB,
  CATALOG_META_WIDGET,
} from '@/src/constants/catalog-schemas';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialNeutralButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { getSchemaGridColumns } from './columns';
import { DIAL_META_PROPERTY_KIND, DIAL_META_PROPERTY_ORDER } from './constants';
import { SchemaMetaColumn, SchemaMetaHandlers } from './models';
import {
  SchemaFieldRow,
  createEmptyField,
  fieldsToJsonSchema,
  flattenFields,
  getGridSchemaPart,
  jsonSchemaToFields,
} from './utils';

interface SchemaGridProps {
  schema?: JSONSchema7;
  onChange: (schema: JSONSchema7, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
  /** Which `dial:meta` columns this schema kind has — see the sets in `constants.ts`. */
  metaColumns?: SchemaMetaColumn[];
  isReadonly?: boolean;
}

const SchemaGrid: FC<SchemaGridProps> = ({ schema, onChange, isSkipRefresh, metaColumns, isReadonly }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonlyGrid = isReadonly || isReadOnlyAdmin;
  const [fields, setFields] = useState<SchemaFieldRow[]>(() => jsonSchemaToFields(schema, schema));
  const fieldsRef = useRef(fields);
  const gridApiRef = useRef<GridApi | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const prevSchemaRef = useRef(getGridSchemaPart(schema));

  useEffect(() => {
    const nextPart = getGridSchemaPart(schema);
    if (!isEqual(prevSchemaRef.current, nextPart)) {
      prevSchemaRef.current = nextPart;
      const newFields = jsonSchemaToFields(schema, schema);
      setFields(newFields);
    }
  }, [schema]);

  const updateFields = useCallback((updatedFields: SchemaFieldRow[], isSkipRefresh?: boolean) => {
    setFields(updatedFields);
    const newSchema = fieldsToJsonSchema(updatedFields);
    prevSchemaRef.current = getGridSchemaPart(newSchema);
    onChangeRef.current(newSchema, isSkipRefresh);
  }, []);

  const onToggleExpand = useCallback(
    (data: SchemaFieldRow) => {
      const updated = updateRowInTree(fieldsRef.current, data.id, (f) => ({
        ...f,
        expanded: !f.expanded,
      }));
      // Only update local state — expand/collapse is UI-only, doesn't change schema
      setFields(updated);
      // Directly push rowData to grid since this bypasses onChange/isSkipRefresh flow
      if (!gridApiRef.current?.isDestroyed()) {
        gridApiRef.current?.updateGridOptions({ rowData: flattenFields(updated, 0, isReadonlyGrid) });
      }
    },
    [isReadonlyGrid],
  );

  const onChangeName = useCallback(
    (value: string, data: SchemaFieldRow) => {
      const updated = updateRowInTree(fieldsRef.current, data.id, (f) => ({ ...f, name: value }));
      updateFields(updated, true);
    },
    [updateFields],
  );

  const onChangeType = useCallback(
    (value: string, data: SchemaFieldRow) => {
      const updated = updateRowInTree(fieldsRef.current, data.id, (f) => {
        if (value.startsWith('array:')) {
          const itemsType = value.slice(6) as SchemaFieldRow['type'];
          return {
            ...f,
            type: 'array' as SchemaFieldRow['type'],
            itemsType,
            children: itemsType === 'object' ? f.children : [],
            expanded: itemsType === 'object' ? f.expanded : false,
          };
        }
        const newType = value as SchemaFieldRow['type'];
        return {
          ...f,
          type: newType,
          itemsType: undefined,
          children: newType === 'object' ? f.children : [],
          expanded: newType === 'object' ? f.expanded : false,
        };
      });
      updateFields(updated);
    },
    [updateFields],
  );

  const onChangeRequired = useCallback(
    (value: boolean, data: SchemaFieldRow) => {
      const updated = updateRowInTree(fieldsRef.current, data.id, (f) => ({ ...f, required: value }));
      updateFields(updated);
    },
    [updateFields],
  );

  const onChangeTitle = useCallback(
    (value: string, data: SchemaFieldRow) => {
      const updated = updateRowInTree(fieldsRef.current, data.id, (f) => ({ ...f, title: value }));
      updateFields(updated, true);
    },
    [updateFields],
  );

  const onChangeDescription = useCallback(
    (value: string, data: SchemaFieldRow) => {
      const updated = updateRowInTree(fieldsRef.current, data.id, (f) => ({ ...f, description: value }));
      updateFields(updated, true);
    },
    [updateFields],
  );

  // A cleared cell removes its key rather than storing an empty hint.
  const onChangeDialMeta = useCallback(
    (key: string, value: unknown, data: SchemaFieldRow, skipRefresh?: boolean) => {
      if (data.parentId !== null) return;
      const updated = updateRowInTree(fieldsRef.current, data.id, (f) => {
        const dialMeta = { ...f.dialMeta };
        if (value === '' || value === undefined) {
          delete dialMeta[key];
        } else {
          dialMeta[key] = value;
        }
        return { ...f, dialMeta: Object.keys(dialMeta).length ? dialMeta : undefined };
      });
      updateFields(updated, skipRefresh);
    },
    [updateFields],
  );

  const onChangeOrder = useCallback(
    (value: number | string, data: SchemaFieldRow) => {
      const num = typeof value === 'string' ? (value === '' ? undefined : Number(value)) : value;
      onChangeDialMeta(DIAL_META_PROPERTY_ORDER, num, data, true);
    },
    [onChangeDialMeta],
  );

  const onChangeTab = useCallback(
    (value: string, data: SchemaFieldRow) => onChangeDialMeta(CATALOG_META_TAB, value, data, true),
    [onChangeDialMeta],
  );

  const onChangeSection = useCallback(
    (value: string, data: SchemaFieldRow) => onChangeDialMeta(CATALOG_META_SECTION, value, data, true),
    [onChangeDialMeta],
  );

  const onChangeWidget = useCallback(
    (value: string, data: SchemaFieldRow) => onChangeDialMeta(CATALOG_META_WIDGET, value, data),
    [onChangeDialMeta],
  );

  const onChangeLocalized = useCallback(
    (value: boolean, data: SchemaFieldRow) => onChangeDialMeta(CATALOG_META_LOCALIZED, value, data),
    [onChangeDialMeta],
  );

  const onChangePropertyKind = useCallback(
    (value: string, data: SchemaFieldRow) => onChangeDialMeta(DIAL_META_PROPERTY_KIND, value, data),
    [onChangeDialMeta],
  );

  const onRemoveField = useCallback(
    (data?: SchemaFieldRow) => {
      if (!data) return;
      let updated: SchemaFieldRow[];

      if (data.parentId) {
        updated = updateRowInTree(fieldsRef.current, data.parentId, (parent) => ({
          ...parent,
          children: parent.children.filter((c) => c.id !== data.id),
        }));
      } else {
        updated = fieldsRef.current.filter((f) => f.id !== data.id);
      }
      updateFields(updated);
    },
    [updateFields],
  );

  const onAddField = useCallback(() => {
    const newField = createEmptyField(null, 0);
    const updated = [...fieldsRef.current, newField];
    updateFields(updated);
  }, [updateFields]);

  const onAddSubField = useCallback(
    (parentId: string) => {
      const parent = findRowInTree(fieldsRef.current, parentId);
      const childDepth = (parent?.depth ?? 0) + 1;
      const updated = updateRowInTree(fieldsRef.current, parentId, (p) => ({
        ...p,
        expanded: true,
        children: [...p.children, createEmptyField(parentId, childDepth)],
      }));
      updateFields(updated);
    },
    [updateFields],
  );

  const rowData = useMemo(() => flattenFields(fields, 0, isReadonlyGrid), [fields, isReadonlyGrid]);

  const metaHandlers = useMemo<SchemaMetaHandlers>(() => {
    const handlers: Record<SchemaMetaColumn, SchemaMetaHandlers[SchemaMetaColumn]> = {
      [SchemaMetaColumn.Order]: onChangeOrder,
      [SchemaMetaColumn.PropertyKind]: onChangePropertyKind,
      [SchemaMetaColumn.Tab]: onChangeTab,
      [SchemaMetaColumn.Section]: onChangeSection,
      [SchemaMetaColumn.Widget]: onChangeWidget,
      [SchemaMetaColumn.Localized]: onChangeLocalized,
    };
    return Object.fromEntries((metaColumns ?? []).map((column) => [column, handlers[column]]));
  }, [
    metaColumns,
    onChangeOrder,
    onChangePropertyKind,
    onChangeTab,
    onChangeSection,
    onChangeWidget,
    onChangeLocalized,
  ]);

  const columnDefs: ColDef[] = useMemo(
    () =>
      getSchemaGridColumns(
        onToggleExpand,
        onChangeName,
        onChangeType,
        onChangeTitle,
        onChangeDescription,
        onChangeRequired,
        onRemoveField,
        t,
        isReadonlyGrid,
        metaHandlers,
      ),
    [
      onToggleExpand,
      onChangeName,
      onChangeType,
      onChangeTitle,
      onChangeDescription,
      onChangeRequired,
      onRemoveField,
      t,
      isReadonlyGrid,
      metaHandlers,
    ],
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
          <DialNeutralButton
            size={ElementSize.Small}
            iconBefore={<IconPlus size={12} stroke={2.5} />}
            label={isRootAdd ? t(BasicI18nKey.AddField) : t(BasicI18nKey.AddSubField)}
            onClick={() => (isRootAdd ? onAddField() : onAddSubField(parentId!))}
          />
        </div>
      );
    },
    [onAddField, onAddSubField, t],
  );

  return (
    <div className="h-full">
      <GridView<SchemaFieldRow>
        getIsEmptyData={() => fields.length === 0 && isReadonlyGrid}
        emptyDataProps={{ title: t(BasicI18nKey.NoData) }}
        onGridReady={onGridReady}
        additionalGridOptions={{
          getRowId: getRowIdById,
          isFullWidthRow: (params: IsFullWidthRowParams<SchemaFieldRow>) => !!params.rowNode.data?.isAddSubFieldRow,
          fullWidthCellRenderer,
        }}
      />
    </div>
  );
};

export default SchemaGrid;
