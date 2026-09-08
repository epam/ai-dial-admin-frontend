'use client';

import { FC, useMemo } from 'react';

import { ColDef, ICellRendererParams, ITooltipParams, ValueGetterParams } from 'ag-grid-community';
import { DialLabelledText } from '@epam/ai-dial-ui-kit';

import { TypeCellRenderer } from '@/src/components/Analytics/Common/TypeBadge';
import DraftSchemaEditor from '@/src/components/Analytics/Tables/DraftSchemaEditor';
import KeyFieldLabel from '@/src/components/Analytics/Tables/KeyFieldLabel';
import { useDraftSchemaForm } from '@/src/components/Analytics/Tables/use-draft-schema-form';
import SensitiveIndicator from '@/src/components/Common/SensitiveIndicator/SensitiveIndicator';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { capitalize } from '@/src/constants/analytics/tables';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { AnalyticsTable, AnalyticsTableColumn, AnalyticsTableType, TableStatus } from '@/src/models/analytics/table';

interface Props {
  table: AnalyticsTable;
  // The enrichment grain key, already resolved against the source table by TableDetailView, or null
  // for a table that has none. Pinned atop the grid rather than rendered as an editable column.
  grainKeyRow: AnalyticsTableColumn | null;
  draft: ReturnType<typeof useDraftSchemaForm>;
  actions: ActionMenuOperationDeclaration<AnalyticsTableColumn>[];
  canModify: boolean;
  onRenameCell: (from: string, to: string) => void;
}

// Renders the column name with a trailing sensitive marker; editing still swaps in the cell editor.
// The dot is tooltip-less — the grid's cell tooltip (see the name column's tooltipValueGetter) carries
// the sensitive note, so the two don't double up.
const ColumnNameCellRenderer: FC<ICellRendererParams<AnalyticsTableColumn>> = ({ value, data }) => (
  <span className="flex items-center gap-1.5">
    <span className="truncate">{value}</span>
    {data?.sensitive && <SensitiveIndicator />}
  </span>
);

const TableProperties: FC<Props> = ({ table, grainKeyRow, draft, actions, canModify, onRenameCell }) => {
  const t = useI18n();

  const isActive = table.status === TableStatus.Active;
  const isEnrichment = table.type === AnalyticsTableType.Enrichment;
  const columns = useMemo(() => table.columns ?? [], [table.columns]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: t(AnalyticsTablesI18nKey.ColumnName),
        field: 'name',
        editable: (params) => canModify && !params.node.rowPinned,
        cellRenderer: ColumnNameCellRenderer,
        // Fold the sensitive note into the single cell tooltip so it doesn't double with the dot.
        tooltipValueGetter: (params: ITooltipParams<AnalyticsTableColumn>) =>
          [params.data?.name, params.data?.sensitive ? t(AnalyticsTablesI18nKey.Sensitive) : '']
            .filter(Boolean)
            .join(' — '),
        flex: 2,
      },
      {
        headerName: t(AnalyticsTablesI18nKey.Type),
        field: 'type',
        cellRenderer: TypeCellRenderer,
        // An enum column's declared domain, reachable without opening the edit modal. It rides the cell's
        // own tooltip rather than the badge's: the badge is a non-focusable span, so a tooltip on it would
        // be mouse-only, while the grid cell is reachable by keyboard navigation.
        tooltipValueGetter: (params: ITooltipParams<AnalyticsTableColumn>) =>
          params.data?.enum_values?.length ? params.data.enum_values.join(', ') : '',
        flex: 1,
      },
      { headerName: t(AnalyticsTablesI18nKey.Tag), field: 'tag', flex: 1 },
      // Long display names/descriptions truncate in the cell; the grid's default tooltip exposes the full value.
      { headerName: t(AnalyticsTablesI18nKey.DisplayName), field: 'display_name', flex: 2 },
      { headerName: t(AnalyticsTablesI18nKey.Description), field: 'description', flex: 3 },
      {
        headerName: t(AnalyticsTablesI18nKey.Nullable),
        colId: 'nullable',
        flex: 1,
        cellDataType: false,
        valueGetter: (params: ValueGetterParams<AnalyticsTableColumn>) => String(Boolean(params.data?.nullable)),
      },
      ...(canModify ? [ACTION_COLUMN(actions)] : []),
    ],
    [t, actions, canModify],
  );

  return (
    <>
      {/* The summary is otherwise ACTIVE-only, because a draft's keys live in DraftSchemaEditor as
          editable inputs. An enrichment's source table has no such input — it is fixed at create — so
          it shows at any status, including while the draft schema is being defined. */}
      {(isActive || isEnrichment) && (
        <div className="flex flex-wrap gap-8 mb-6">
          {table.type === AnalyticsTableType.Source ? (
            <>
              {!!table.ordering_key?.length && (
                <DialLabelledText
                  label={
                    <KeyFieldLabel
                      label={t(AnalyticsTablesI18nKey.OrderingKey)}
                      hint={t(AnalyticsTablesI18nKey.OrderingKeyHint)}
                    />
                  }
                  text={table.ordering_key.join(', ')}
                />
              )}
              {table.partition_by && (
                <>
                  <DialLabelledText
                    label={
                      <KeyFieldLabel
                        label={t(AnalyticsTablesI18nKey.PartitionColumn)}
                        hint={t(AnalyticsTablesI18nKey.PartitionColumnHint)}
                      />
                    }
                    text={table.partition_by.column}
                  />
                  <DialLabelledText
                    label={
                      <KeyFieldLabel
                        label={t(AnalyticsTablesI18nKey.Granularity)}
                        hint={t(AnalyticsTablesI18nKey.GranularityHint)}
                      />
                    }
                    text={capitalize(table.partition_by.granularity)}
                  />
                </>
              )}
              {table.identity_column && (
                <DialLabelledText
                  label={
                    <KeyFieldLabel
                      label={t(AnalyticsTablesI18nKey.IdentityColumn)}
                      hint={t(AnalyticsTablesI18nKey.IdentityColumnHint)}
                    />
                  }
                  text={table.identity_column}
                />
              )}
              {table.version_column && (
                <DialLabelledText
                  label={
                    <KeyFieldLabel
                      label={t(AnalyticsTablesI18nKey.VersionColumn)}
                      hint={t(AnalyticsTablesI18nKey.VersionColumnHint)}
                    />
                  }
                  text={table.version_column}
                />
              )}
            </>
          ) : (
            <>
              {/* No KeyFieldLabel hint: unlike the keys beside it, the source table is not chosen on the
                  draft surface — it is fixed at create — so there is no explanation to keep in step. */}
              {table.source_table && (
                <DialLabelledText label={t(AnalyticsTablesI18nKey.SourceTable)} text={table.source_table} />
              )}
              {!!table.grain?.grain_key && (
                <DialLabelledText
                  label={
                    <KeyFieldLabel
                      label={t(AnalyticsTablesI18nKey.GrainKey)}
                      hint={t(AnalyticsTablesI18nKey.GrainKeyHint)}
                    />
                  }
                  text={table.grain.grain_key}
                />
              )}
            </>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {isActive ? (
          <GridView
            columnDefs={columnDefs}
            rowData={columns}
            getRowId={(params) => params.data.name}
            additionalGridOptions={{
              pinnedTopRowData: grainKeyRow ? [grainKeyRow] : undefined,
              onCellValueChanged: (e) => {
                if (e.colDef.field === 'name') onRenameCell(e.oldValue as string, e.newValue as string);
              },
            }}
            emptyDataProps={{ title: t(AnalyticsTablesI18nKey.NoColumns) }}
          />
        ) : (
          <DraftSchemaEditor table={table} draft={draft} />
        )}
      </div>
    </>
  );
};

export default TableProperties;
